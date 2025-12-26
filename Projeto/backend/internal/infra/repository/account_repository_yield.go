package repository

import (
	"context"
	"financeiro-api/internal/entity"
	"fmt"
)

// FindAllWithYieldEnabled returns all accounts that have yield enabled
// This is used by the scheduler to process yields for all users
func (r *AccountRepository) FindAllWithYieldEnabled(ctx context.Context) ([]entity.Account, error) {
	query := `
		SELECT 
			id, user_id, name, type, balance, color, is_active, 
			yield_rate, yield_enabled, yield_source, yield_cdi_rate, last_yield_date, 
			created_at, updated_at
		FROM accounts
		WHERE yield_enabled = true 
		AND is_active = true
		ORDER BY created_at ASC
	`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query accounts: %w", err)
	}
	defer rows.Close()

	var accounts []entity.Account
	for rows.Next() {
		var acc entity.Account
		err := rows.Scan(
			&acc.ID, &acc.UserID, &acc.Name, &acc.Type, &acc.Balance, &acc.Color, &acc.IsActive,
			&acc.YieldRate, &acc.YieldEnabled, &acc.YieldSource, &acc.YieldCdiRate, &acc.LastYieldDate,
			&acc.CreatedAt, &acc.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan account: %w", err)
		}
		accounts = append(accounts, acc)
	}

	return accounts, nil
}
