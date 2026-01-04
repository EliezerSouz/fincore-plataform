package repository

import (
	"context"
	"financeiro-api/internal/entity"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type BalanceAdjustmentRepository struct {
	db *pgxpool.Pool
}

func NewBalanceAdjustmentRepository(db *pgxpool.Pool) *BalanceAdjustmentRepository {
	return &BalanceAdjustmentRepository{db: db}
}

func (r *BalanceAdjustmentRepository) Create(ctx context.Context, adjustment *entity.BalanceAdjustment) error {
	query := `
		INSERT INTO account_balance_adjustments (
			id, user_id, account_id, pocket_id, adjustment_date, balance, type, notes, starts_controlled_period, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`
	_, err := r.db.Exec(ctx, query,
		adjustment.ID,
		adjustment.UserID,
		adjustment.AccountID,
		adjustment.PocketID,
		adjustment.AdjustmentDate,
		adjustment.Balance,
		adjustment.Type,
		adjustment.Notes,
		adjustment.StartsControlledPeriod,
		adjustment.CreatedAt,
		adjustment.UpdatedAt,
	)
	if err != nil {
		return err
	}
	return r.recalculateBalance(ctx, adjustment.AccountID, adjustment.PocketID)
}

func (r *BalanceAdjustmentRepository) Update(ctx context.Context, adjustment *entity.BalanceAdjustment) error {
	query := `
		UPDATE account_balance_adjustments
		SET adjustment_date = $1, balance = $2, type = $3, notes = $4, starts_controlled_period = $5, updated_at = $6
		WHERE id = $7 AND user_id = $8
	`
	_, err := r.db.Exec(ctx, query,
		adjustment.AdjustmentDate,
		adjustment.Balance,
		adjustment.Type,
		adjustment.Notes,
		adjustment.StartsControlledPeriod,
		adjustment.UpdatedAt,
		adjustment.ID,
		adjustment.UserID,
	)
	if err != nil {
		return err
	}
	return r.recalculateBalance(ctx, adjustment.AccountID, adjustment.PocketID)
}

func (r *BalanceAdjustmentRepository) Delete(ctx context.Context, id, userID string) error {
	query := `DELETE FROM account_balance_adjustments WHERE id = $1 AND user_id = $2 RETURNING account_id, pocket_id`
	var accountID *string
	var pocketID *string
	err := r.db.QueryRow(ctx, query, id, userID).Scan(&accountID, &pocketID)
	if err != nil {
		return err
	}
	return r.recalculateBalance(ctx, accountID, pocketID)
}

func (r *BalanceAdjustmentRepository) FindByID(ctx context.Context, id string) (*entity.BalanceAdjustment, error) {
	query := `SELECT id, user_id, account_id, pocket_id, adjustment_date, balance, type, notes, starts_controlled_period, created_at, updated_at FROM account_balance_adjustments WHERE id = $1`
	var ba entity.BalanceAdjustment
	err := r.db.QueryRow(ctx, query, id).Scan(
		&ba.ID, &ba.UserID, &ba.AccountID, &ba.PocketID, &ba.AdjustmentDate, &ba.Balance, &ba.Type, &ba.Notes, &ba.StartsControlledPeriod, &ba.CreatedAt, &ba.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("balance adjustment not found")
		}
		return nil, err
	}
	return &ba, nil
}

func (r *BalanceAdjustmentRepository) FindAllByAccount(ctx context.Context, accountID, userID string) ([]entity.BalanceAdjustment, error) {
	query := `
		SELECT id, user_id, account_id, pocket_id, adjustment_date, balance, type, notes, starts_controlled_period, created_at, updated_at
		FROM account_balance_adjustments
		WHERE account_id = $1 AND user_id = $2
		ORDER BY adjustment_date DESC
	`
	rows, err := r.db.Query(ctx, query, accountID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var adjustments []entity.BalanceAdjustment
	for rows.Next() {
		var ba entity.BalanceAdjustment
		if err := rows.Scan(
			&ba.ID, &ba.UserID, &ba.AccountID, &ba.PocketID, &ba.AdjustmentDate, &ba.Balance, &ba.Type, &ba.Notes, &ba.StartsControlledPeriod, &ba.CreatedAt, &ba.UpdatedAt,
		); err != nil {
			return nil, err
		}
		adjustments = append(adjustments, ba)
	}
	return adjustments, nil
}

// HasTransactionsAfterDate checks if there are any transactions after the given date
func (r *BalanceAdjustmentRepository) HasTransactionsAfterDate(ctx context.Context, accountID *string, pocketID *string, date time.Time) (bool, error) {
	var count int
	var query string
	var id string

	if pocketID != nil && *pocketID != "" {
		query = `
			SELECT COUNT(*)
			FROM transactions
			WHERE pocket_id = $1
				AND date >= $2
				AND deleted_at IS NULL
		`
		id = *pocketID
	} else if accountID != nil && *accountID != "" {
		query = `
			SELECT COUNT(*)
			FROM transactions
			WHERE account_id = $1
				AND date >= $2
				AND deleted_at IS NULL
		`
		id = *accountID
	} else {
		return false, fmt.Errorf("either account_id or pocket_id is required")
	}

	err := r.db.QueryRow(ctx, query, id, date).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// Helper to recalculate and update balance for either Pocket or Account
func (r *BalanceAdjustmentRepository) recalculateBalance(ctx context.Context, accountID *string, pocketID *string) error {
	if pocketID != nil && *pocketID != "" {
		return r.recalculatePocketBalance(ctx, *pocketID)
	}
	if accountID != nil && *accountID != "" {
		return r.recalculateAccountBalance(ctx, *accountID)
	}
	return nil
}

func (r *BalanceAdjustmentRepository) recalculatePocketBalance(ctx context.Context, pocketID string) error {
	// 1. Get the latest adjustment for POCKET
	queryAdj := `
		SELECT balance, adjustment_date
		FROM account_balance_adjustments
		WHERE pocket_id = $1
		ORDER BY adjustment_date DESC, created_at DESC
		LIMIT 1
	`
	var lastBalance float64
	var lastDate time.Time
	hasAdjustment := true

	err := r.db.QueryRow(ctx, queryAdj, pocketID).Scan(&lastBalance, &lastDate)
	if err != nil {
		if err == pgx.ErrNoRows {
			hasAdjustment = false
		} else {
			return fmt.Errorf("failed to get last adjustment: %w", err)
		}
	}

	// 2. Sum transactions AFTER that date (or all if no adjustment)
	// For pockets, we sum 'receita' (positive) and 'despesa' (negative) and 'transferencia' (depends)
	// But transaction_repository usually stores amount and handles sign in code? No, amount is always positive in DB?
	// Let's check logic:
	// Receita: +
	// Despesa: -
	// Transferencia:
	//   - Source (para X): -
	//   - Target (de Y): +
	// The transaction type 'transferencia' itself doesn't tell direction easily without checking descriptions or flags.
	// However, usually we should trust how transactions affect balance.
	// Wait, standard balance calculation in SQL:

	queryTx := `
		SELECT COALESCE(SUM(
			CASE 
				WHEN type = 'receita' THEN amount 
				WHEN type = 'despesa' THEN -amount 
				WHEN type = 'transferencia' THEN 
					CASE
						WHEN description ILIKE 'Transferência para%' THEN -amount
						WHEN description ILIKE 'Transferência de%' THEN amount
						ELSE 0 -- Should handle other cases or assume neutral?
					END
				ELSE 0 
			END
		), 0)
		FROM transactions
		WHERE pocket_id = $1
		  AND deleted_at IS NULL
	`
	args := []interface{}{pocketID}

	if hasAdjustment {
		queryTx += " AND date >= $2"
		args = append(args, lastDate)
	}

	var txSum float64
	err = r.db.QueryRow(ctx, queryTx, args...).Scan(&txSum)
	if err != nil {
		return fmt.Errorf("failed to sum transactions: %w", err)
	}

	// 3. New Balance
	newBalance := txSum
	if hasAdjustment {
		newBalance += lastBalance
	}

	// 4. Update Pocket
	queryUpdate := `UPDATE pockets SET balance = $1, updated_at = NOW() WHERE id = $2`
	_, err = r.db.Exec(ctx, queryUpdate, newBalance, pocketID)
	if err != nil {
		return fmt.Errorf("failed to update pocket balance: %w", err)
	}

	return nil
}

func (r *BalanceAdjustmentRepository) recalculateAccountBalance(ctx context.Context, accountID string) error {
	// 1. Get the latest adjustment for ACCOUNT
	queryAdj := `
		SELECT balance, adjustment_date
		FROM account_balance_adjustments
		WHERE account_id = $1
		ORDER BY adjustment_date DESC, created_at DESC
		LIMIT 1
	`
	var lastBalance float64
	var lastDate time.Time
	hasAdjustment := true

	err := r.db.QueryRow(ctx, queryAdj, accountID).Scan(&lastBalance, &lastDate)
	if err != nil {
		if err == pgx.ErrNoRows {
			hasAdjustment = false
		} else {
			return fmt.Errorf("failed to get last adjustment: %w", err)
		}
	}

	// 2. Sum transactions
	queryTx := `
		SELECT COALESCE(SUM(
			CASE 
				WHEN type = 'receita' THEN amount 
				WHEN type = 'despesa' THEN -amount 
				ELSE 0 
			END
		), 0)
		FROM transactions
		WHERE account_id = $1
		  AND deleted_at IS NULL
	`
	args := []interface{}{accountID}

	if hasAdjustment {
		queryTx += " AND date >= $2"
		args = append(args, lastDate)
	}

	var txSum float64
	err = r.db.QueryRow(ctx, queryTx, args...).Scan(&txSum)
	if err != nil {
		return fmt.Errorf("failed to sum transactions: %w", err)
	}

	// 3. New Balance
	newBalance := txSum
	if hasAdjustment {
		newBalance += lastBalance
	}

	// 4. Update Account
	queryUpdate := `UPDATE accounts SET balance = $1, updated_at = NOW() WHERE id = $2`
	_, err = r.db.Exec(ctx, queryUpdate, newBalance, accountID)
	if err != nil {
		return fmt.Errorf("failed to update account balance: %w", err)
	}

	return nil
}
