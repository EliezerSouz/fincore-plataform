package repository

import (
	"context"
	"financeiro-api/internal/entity"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type LiquidityYieldRepository struct {
	db *pgxpool.Pool
}

func NewLiquidityYieldRepository(db *pgxpool.Pool) *LiquidityYieldRepository {
	return &LiquidityYieldRepository{db: db}
}

// CheckYieldExists verifies if a yield record already exists for the given account and date
func (r *LiquidityYieldRepository) CheckYieldExists(ctx context.Context, accountID string, date time.Time) (bool, error) {
	var exists bool
	err := r.db.QueryRow(ctx, `
		SELECT EXISTS(
			SELECT 1 FROM liquidity_yields 
			WHERE account_id = $1 AND date = $2
		)
	`, accountID, date).Scan(&exists)

	return exists, err
}

// GetBaseAmount calculates the base amount for yield calculation
// base_amount = operational_balance + sum(previous_yields)
func (r *LiquidityYieldRepository) GetBaseAmount(ctx context.Context, accountID string, date time.Time) (float64, error) {
	var operationalBalance float64
	var previousYields float64

	// Get operational balance from accounts
	err := r.db.QueryRow(ctx, `
		SELECT COALESCE(balance, 0) 
		FROM accounts 
		WHERE id = $1
	`, accountID).Scan(&operationalBalance)

	if err != nil {
		return 0, fmt.Errorf("failed to get operational balance: %w", err)
	}

	// Sum all previous yields up to (but not including) the target date
	err = r.db.QueryRow(ctx, `
		SELECT COALESCE(SUM(yield_amount), 0)
		FROM liquidity_yields
		WHERE account_id = $1 AND date < $2
	`, accountID, date).Scan(&previousYields)

	if err != nil {
		return 0, fmt.Errorf("failed to get previous yields: %w", err)
	}

	return operationalBalance + previousYields, nil
}

// CreateYield creates a new liquidity yield record
func (r *LiquidityYieldRepository) CreateYield(ctx context.Context, yield *entity.LiquidityYield) error {
	// Convert empty AccountID to nil for proper NULL insertion
	var accountID *string
	if yield.AccountID != "" {
		accountID = &yield.AccountID
	}

	_, err := r.db.Exec(ctx, `
		INSERT INTO liquidity_yields (
			id, account_id, pocket_id, date, base_amount, yield_amount, rate_applied, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`, yield.ID, accountID, yield.PocketID, yield.Date, yield.BaseAmount, yield.YieldAmount, yield.RateApplied, yield.CreatedAt)

	if err != nil {
		return fmt.Errorf("failed to create yield record: %w", err)
	}

	return nil
}

// GetYieldsByAccount retrieves all yield records for an account
func (r *LiquidityYieldRepository) GetYieldsByAccount(ctx context.Context, accountID string, startDate, endDate time.Time) ([]*entity.LiquidityYield, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, account_id, date, base_amount, yield_amount, rate_applied, created_at
		FROM liquidity_yields
		WHERE account_id = $1 
		AND date >= $2 
		AND date <= $3
		ORDER BY date DESC
	`, accountID, startDate, endDate)

	if err != nil {
		return nil, fmt.Errorf("failed to query yields: %w", err)
	}
	defer rows.Close()

	var yields []*entity.LiquidityYield
	for rows.Next() {
		var y entity.LiquidityYield
		err := rows.Scan(&y.ID, &y.AccountID, &y.Date, &y.BaseAmount, &y.YieldAmount, &y.RateApplied, &y.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan yield: %w", err)
		}
		yields = append(yields, &y)
	}

	return yields, nil
}

// GetTotalYields calculates the sum of all yields for an account
func (r *LiquidityYieldRepository) GetTotalYields(ctx context.Context, accountID string) (float64, error) {
	var total float64
	err := r.db.QueryRow(ctx, `
		SELECT COALESCE(SUM(yield_amount), 0)
		FROM liquidity_yields
		WHERE account_id = $1
	`, accountID).Scan(&total)

	return total, err
}

// DeleteYield removes a yield record (for reprocessing with audit)
func (r *LiquidityYieldRepository) DeleteYield(ctx context.Context, accountID string, date time.Time) error {
	result, err := r.db.Exec(ctx, `
		DELETE FROM liquidity_yields
		WHERE account_id = $1 AND date = $2
	`, accountID, date)

	if err != nil {
		return fmt.Errorf("failed to delete yield: %w", err)
	}

	rowsAffected := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("no yield record found for deletion")
	}

	return nil
}

// =====================================================
// POCKET-SPECIFIC METHODS
// =====================================================

// CheckYieldExistsForPocket verifies if a yield record already exists for the given pocket and date
func (r *LiquidityYieldRepository) CheckYieldExistsForPocket(ctx context.Context, pocketID string, date time.Time) (bool, error) {
	var exists bool
	err := r.db.QueryRow(ctx, `
		SELECT EXISTS(
			SELECT 1 FROM liquidity_yields 
			WHERE pocket_id = $1 AND date = $2
		)
	`, pocketID, date).Scan(&exists)

	return exists, err
}

// GetBaseAmountForPocket calculates the base amount for yield calculation for a pocket
// base_amount = balance at END of previous day (operational balance - today's transactions - future transactions)
// NOTE: Since pockets.balance now includes accumulated yields, we DO NOT add previous_yields again.
func (r *LiquidityYieldRepository) GetBaseAmountForPocket(ctx context.Context, pocketID string, date time.Time) (float64, error) {
	var currentBalance float64
	var txAdjustment float64

	// Get current total balance from pockets (includes previous yields)
	err := r.db.QueryRow(ctx, `
		SELECT COALESCE(balance, 0) 
		FROM pockets 
		WHERE id = $1
	`, pocketID).Scan(&currentBalance)

	if err != nil {
		return 0, fmt.Errorf("failed to get operational balance: %w", err)
	}

	// Calculate net change from transactions occurring ON or AFTER the target date
	// If we want Closing Balance of 'date', we subtract transactions that happened AFTER 'date'.
	// If we want Opening Balance of 'date' (which is Closing of date-1), we subtract transactions ON 'date' too.
	// Assuming Conservative Logic (Opening Balance): Subtract transactions >= date
	// Assuming Aggressive Logic (Closing Balance): Subtract transactions > date
	//
	// Given the context of "Juros Composto", we typically yield on the closing balance.
	// But let's stick to the previous logic structure but CORRECTED for PocketID and No Double Yields.
	//
	// Current Logic Impl: Subtract transactions ON the date. This yields on Opening Balance.
	// Filter: pocket_id = $1

	err = r.db.QueryRow(ctx, `
		SELECT COALESCE(SUM(
			CASE 
				WHEN type = 'receita' THEN amount
				WHEN type = 'despesa' THEN -amount
				WHEN type = 'transferencia' AND description ILIKE '%de%' THEN amount
				WHEN type = 'transferencia' AND description ILIKE '%para%' THEN -amount
				ELSE 0
			END
		), 0)
		FROM transactions
		WHERE pocket_id = $1
		AND date >= $2
		AND is_historical = false
		AND deleted_at IS NULL
	`, pocketID, date).Scan(&txAdjustment)

	if err != nil {
		return 0, fmt.Errorf("failed to get transaction adjustments: %w", err)
	}

	// Base Amount = Current Total Balance - Adjustments looking forward
	baseAmount := currentBalance - txAdjustment

	return baseAmount, nil
}
