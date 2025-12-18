package repository

import (
	"context"
	"financeiro-api/internal/entity"
	"fmt"
	"math"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type AccountRepository struct {
	db *pgxpool.Pool
}

func NewAccountRepository(db *pgxpool.Pool) *AccountRepository {
	return &AccountRepository{db: db}
}

// Helper to check if a date is a business day (Mon-Fri)
func isBusinessDay(t time.Time) bool {
	wd := t.Weekday()
	return wd != time.Sunday && wd != time.Saturday
}

// Returns: (totalYieldedThisRun, lastYieldAmount, error)
func (r *AccountRepository) applyYield(ctx context.Context, acc *entity.Account) (float64, float64, error) {
	if acc.YieldRate <= 0 || acc.LastYieldDate == nil {
		return 0, 0, nil
	}

	now := time.Now()
	// Strip time part for comparison
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	last := time.Date(acc.LastYieldDate.Year(), acc.LastYieldDate.Month(), acc.LastYieldDate.Day(), 0, 0, 0, 0, acc.LastYieldDate.Location())

	if !last.Before(today) {
		return 0, 0, nil
	}

	// Calculate compound daily rate from monthly rate (approx 21 business days)
	// Rate = (1 + Monthly/100)^(1/21) - 1
	monthlyRate := acc.YieldRate / 100.0
	dailyRate := math.Pow(1+monthlyRate, 1.0/21.0) - 1

	currentBalance := acc.Balance
	daysProcessed := 0
	totalYielded := 0.0
	lastDailyYield := 0.0

	// Iterate from next day of LastYieldDate until Yesterday (inclusive) or Today (exclusive)?
	// "Yield occurs only on business days". If today is Monday, we process yield for Friday? Or does it yield AT the end of the day?
	// User said: "Calculated at access". So if I access today, I expect yield up to yesterday? Or today's yield if late?
	// Usually financial yield is T-1 or T. Let's calculate up to Today (exclusive), meaning yields from LastDate until yesterday.
	// If LastDate was yesterday, loop runs 0 times? No.
	// Logic: We process the day IF it has passed.

	// Better logic: Process all days from LastYieldDate until Today (exclusive of Today, as Today is not over).
	// But if LastYieldDate was yesterday (and business day), we should apply yesterday's yield.
	// So loop starts at LastYieldDate.

	// Transaction for safety? Ideally yes, but keeping it simple for now as it is lazy update on read.
	// If it fails mid-way, future reads will retry from last successful date if we update checkpoints?
	// Actually, we only update account LastYieldDate at the end. So if it fails, we rollback (or duplicate inserts if no tx).
	// Let's use a transaction to be safe.

	tx, err := r.db.Begin(ctx)
	if err != nil {
		return 0, 0, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	nextDate := last // Start checking from LastYieldDate
	for nextDate.Before(today) {
		if isBusinessDay(nextDate) {
			yieldAmount := currentBalance * dailyRate

			// Insert Audit Log
			_, err := tx.Exec(ctx, `
				INSERT INTO liquidity_yields (account_id, date, base_amount, yield_amount, rate_applied)
				VALUES ($1, $2, $3, $4, $5)
			`, acc.ID, nextDate, currentBalance, yieldAmount, acc.YieldRate) // Store monthly rate or daily? Schema says rate_applied FLOAT. Storing the config rate (monthly context) is usually more readable, but daily is accurate. Let's store the configured monthly rate as reference.

			if err != nil {
				return 0, 0, fmt.Errorf("failed to log yield: %w", err)
			}

			currentBalance += yieldAmount
			totalYielded += yieldAmount
			lastDailyYield = yieldAmount
			daysProcessed++
		}
		nextDate = nextDate.AddDate(0, 0, 1) // Move to next day
	}

	if daysProcessed > 0 {
		// Update Account Balance & Date
		query := `UPDATE accounts SET balance = $1, last_yield_date = $2 WHERE id = $3`
		updateTime := today

		_, err := tx.Exec(ctx, query, currentBalance, updateTime, acc.ID)
		if err != nil {
			return 0, 0, fmt.Errorf("failed to update account yield: %w", err)
		}

		if err := tx.Commit(ctx); err != nil {
			return 0, 0, fmt.Errorf("failed to commit yield transaction: %w", err)
		}

		// Update struct in memory only after commit
		acc.Balance = currentBalance
		acc.LastYieldDate = &updateTime
	} else {
		// Nothing processed, just commit empty tx (or rollback)
		_ = tx.Commit(ctx)
	}

	return totalYielded, lastDailyYield, nil
}

func (r *AccountRepository) FindAll(ctx context.Context, userID string, includeInactive bool) ([]entity.Account, error) {
	// Query includes subqueries for Yield Display
	// yield_today: fetches the very last yield record (most recent)
	// yield_month: sums yield for current month
	query := `
		SELECT 
			a.id, a.user_id, a.name, a.type, 
			calculate_account_balance_with_adjustments(a.id, CURRENT_DATE) as balance, 
			a.color, a.is_active, a.yield_rate, a.last_yield_date, a.created_at, a.updated_at,
			COALESCE((SELECT yield_amount FROM liquidity_yields WHERE account_id = a.id ORDER BY date DESC LIMIT 1), 0) as yield_today,
			COALESCE((SELECT SUM(yield_amount) FROM liquidity_yields WHERE account_id = a.id AND date >= date_trunc('month', CURRENT_DATE)), 0) as yield_month
		FROM accounts a
		WHERE a.user_id = $1
	`

	if !includeInactive {
		query += " AND a.is_active = true"
	}

	query += " ORDER BY a.is_active DESC, a.name ASC"

	fmt.Printf("DEBUG ACCOUNT REPO: Buscando contas para UserID: %s, IncludeInactive: %v\n", userID, includeInactive)

	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query accounts: %w", err)
	}
	defer rows.Close()

	var accounts []entity.Account
	for rows.Next() {
		var acc entity.Account
		err := rows.Scan(
			&acc.ID, &acc.UserID, &acc.Name, &acc.Type,
			&acc.Balance, &acc.Color, &acc.IsActive, &acc.YieldRate, &acc.LastYieldDate, &acc.CreatedAt, &acc.UpdatedAt,
			&acc.YieldToday, &acc.YieldMonth,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan account: %w", err)
		}

		// Apply yield on read (Lazy Update)
		if acc.YieldRate > 0 {
			yieldedRun, lastYieldRun, err := r.applyYield(ctx, &acc)
			if err == nil && yieldedRun > 0 {
				// If we generated new yields just now, update the display fields
				acc.YieldMonth += yieldedRun
				acc.YieldToday = lastYieldRun // "Today" becomes what we just calculated
			}
		}

		accounts = append(accounts, acc)
	}

	fmt.Printf("DEBUG ACCOUNT REPO: Total contas encontradas: %d\n", len(accounts))

	return accounts, nil
}

func (r *AccountRepository) FindByID(ctx context.Context, id, userID string) (*entity.Account, error) {
	query := `
		SELECT 
			a.id, a.user_id, a.name, a.type, 
			calculate_account_balance_with_adjustments(a.id, CURRENT_DATE) as balance, 
			a.color, a.is_active, a.yield_rate, a.last_yield_date, a.created_at, a.updated_at,
			COALESCE((SELECT yield_amount FROM liquidity_yields WHERE account_id = a.id ORDER BY date DESC LIMIT 1), 0) as yield_today,
			COALESCE((SELECT SUM(yield_amount) FROM liquidity_yields WHERE account_id = a.id AND date >= date_trunc('month', CURRENT_DATE)), 0) as yield_month
		FROM accounts a
		WHERE a.id = $1 AND a.user_id = $2
	`

	var acc entity.Account
	err := r.db.QueryRow(ctx, query, id, userID).Scan(
		&acc.ID, &acc.UserID, &acc.Name, &acc.Type,
		&acc.Balance, &acc.Color, &acc.IsActive, &acc.YieldRate, &acc.LastYieldDate, &acc.CreatedAt, &acc.UpdatedAt,
		&acc.YieldToday, &acc.YieldMonth,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to find account: %w", err)
	}

	if acc.YieldRate > 0 {
		yieldedRun, lastYieldRun, err := r.applyYield(ctx, &acc)
		if err == nil && yieldedRun > 0 {
			acc.YieldMonth += yieldedRun
			acc.YieldToday = lastYieldRun
		}
	}

	return &acc, nil
}

func (r *AccountRepository) Create(ctx context.Context, userID string, input entity.CreateAccountInput) (*entity.Account, error) {
	query := `
		INSERT INTO accounts (user_id, name, type, balance, color, yield_rate, last_yield_date)
		VALUES ($1, $2, $3, $4, $5, $6, NOW())
		RETURNING id, user_id, name, type, balance, color, is_active, yield_rate, last_yield_date, created_at, updated_at
	`

	var acc entity.Account
	err := r.db.QueryRow(ctx, query, userID, input.Name, input.Type, input.Balance, input.Color, input.YieldRate).Scan(
		&acc.ID, &acc.UserID, &acc.Name, &acc.Type,
		&acc.Balance, &acc.Color, &acc.IsActive, &acc.YieldRate, &acc.LastYieldDate, &acc.CreatedAt, &acc.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create account: %w", err)
	}

	return &acc, nil
}

func (r *AccountRepository) Update(ctx context.Context, id, userID string, input entity.UpdateAccountInput) (*entity.Account, error) {
	// Build dynamic update query
	query := `UPDATE accounts SET updated_at = NOW()`
	args := []interface{}{id, userID}
	argCount := 2

	if input.Name != nil {
		argCount++
		query += fmt.Sprintf(", name = $%d", argCount)
		args = append(args, *input.Name)
	}
	if input.Type != nil {
		argCount++
		query += fmt.Sprintf(", type = $%d", argCount)
		args = append(args, *input.Type)
	}
	if input.Balance != nil {
		argCount++
		query += fmt.Sprintf(", balance = $%d", argCount)
		args = append(args, *input.Balance)
	}
	if input.Color != nil {
		argCount++
		query += fmt.Sprintf(", color = $%d", argCount)
		args = append(args, *input.Color)
	}
	if input.IsActive != nil {
		argCount++
		query += fmt.Sprintf(", is_active = $%d", argCount)
		args = append(args, *input.IsActive)
	}
	if input.YieldRate != nil {
		argCount++
		query += fmt.Sprintf(", yield_rate = $%d", argCount)
		args = append(args, *input.YieldRate)
	}

	query += ` WHERE id = $1 AND user_id = $2 RETURNING id, user_id, name, type, balance, color, is_active, yield_rate, last_yield_date, created_at, updated_at`

	var acc entity.Account
	err := r.db.QueryRow(ctx, query, args...).Scan(
		&acc.ID, &acc.UserID, &acc.Name, &acc.Type,
		&acc.Balance, &acc.Color, &acc.IsActive, &acc.YieldRate, &acc.LastYieldDate, &acc.CreatedAt, &acc.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to update account: %w", err)
	}

	return &acc, nil
}

func (r *AccountRepository) Delete(ctx context.Context, id, userID string) error {
	query := `UPDATE accounts SET is_active = false WHERE id = $1 AND user_id = $2`

	result, err := r.db.Exec(ctx, query, id, userID)
	if err != nil {
		return fmt.Errorf("failed to delete account: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("account not found")
	}

	return nil
}
