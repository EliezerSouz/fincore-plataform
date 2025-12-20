package repository

import (
	"context"
	"financeiro-api/internal/entity"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

type PaymentMethodRepository struct {
	db *pgxpool.Pool
}

func NewPaymentMethodRepository(db *pgxpool.Pool) *PaymentMethodRepository {
	return &PaymentMethodRepository{db: db}
}

func (r *PaymentMethodRepository) FindAll(ctx context.Context, userID string, filter entity.PaymentMethodFilter) ([]entity.PaymentMethod, error) {
	// Note: payment_methods table structure might need verification against entity
	// Assuming it matches the entity fields.
	query := `
		SELECT id, user_id, name, type, allows_income, allows_expense, allows_transfer,
		       affects_balance, affects_credit_card, affects_invoice, is_internal,
		       icon, sort_order, is_active, created_at
		FROM payment_methods
		WHERE (user_id = $1::uuid OR is_internal = true)
	`
	args := []interface{}{userID}

	if filter.OnlyActive {
		query += " AND is_active = true"
	}

	// Sort by order and name
	query += " ORDER BY sort_order ASC, name ASC"

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query payment methods: %w", err)
	}
	defer rows.Close()

	var methods []entity.PaymentMethod
	for rows.Next() {
		var pm entity.PaymentMethod
		err := rows.Scan(
			&pm.ID, &pm.UserID, &pm.Name, &pm.Type, &pm.AllowsIncome, &pm.AllowsExpense, &pm.AllowsTransfer,
			&pm.AffectsBalance, &pm.AffectsCreditCard, &pm.AffectsInvoice, &pm.IsInternal,
			&pm.Icon, &pm.SortOrder, &pm.IsActive, &pm.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan payment method: %w", err)
		}

		if filter.TransactionType != "" {
			if !pm.CanBeUsedFor(filter.TransactionType) {
				continue
			}
		}

		methods = append(methods, pm)
	}

	return methods, nil
}
