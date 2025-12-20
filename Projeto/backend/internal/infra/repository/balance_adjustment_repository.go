package repository

import (
	"context"
	"financeiro-api/internal/entity"
	"fmt"

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
			id, user_id, account_id, adjustment_date, balance, type, notes, starts_controlled_period, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`
	_, err := r.db.Exec(ctx, query,
		adjustment.ID,
		adjustment.UserID,
		adjustment.AccountID,
		adjustment.AdjustmentDate,
		adjustment.Balance,
		adjustment.Type,
		adjustment.Notes,
		adjustment.StartsControlledPeriod,
		adjustment.CreatedAt,
		adjustment.UpdatedAt,
	)
	return err
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
	return err
}

func (r *BalanceAdjustmentRepository) Delete(ctx context.Context, id, userID string) error {
	query := `DELETE FROM account_balance_adjustments WHERE id = $1 AND user_id = $2`
	_, err := r.db.Exec(ctx, query, id, userID)
	return err
}

func (r *BalanceAdjustmentRepository) FindByID(ctx context.Context, id string) (*entity.BalanceAdjustment, error) {
	query := `SELECT id, user_id, account_id, adjustment_date, balance, type, notes, starts_controlled_period, created_at, updated_at FROM account_balance_adjustments WHERE id = $1`
	var ba entity.BalanceAdjustment
	err := r.db.QueryRow(ctx, query, id).Scan(
		&ba.ID, &ba.UserID, &ba.AccountID, &ba.AdjustmentDate, &ba.Balance, &ba.Type, &ba.Notes, &ba.StartsControlledPeriod, &ba.CreatedAt, &ba.UpdatedAt,
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
		SELECT id, user_id, account_id, adjustment_date, balance, type, notes, starts_controlled_period, created_at, updated_at
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
			&ba.ID, &ba.UserID, &ba.AccountID, &ba.AdjustmentDate, &ba.Balance, &ba.Type, &ba.Notes, &ba.StartsControlledPeriod, &ba.CreatedAt, &ba.UpdatedAt,
		); err != nil {
			return nil, err
		}
		adjustments = append(adjustments, ba)
	}
	return adjustments, nil
}
