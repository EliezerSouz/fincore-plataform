package repository

import (
	"context"
	"financeiro-api/internal/entity"
	"fmt"

	"github.com/jackc/pgx/v5"
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
		WHERE (user_id = $1::uuid OR user_id IS NULL)
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

	var methods []entity.PaymentMethod

	// Helper to scan rows
	scanRows := func(rows pgx.Rows) error {
		defer rows.Close()
		for rows.Next() {
			var pm entity.PaymentMethod
			var userID *string // Handle nullable user_id

			err := rows.Scan(
				&pm.ID, &userID, &pm.Name, &pm.Type, &pm.AllowsIncome, &pm.AllowsExpense, &pm.AllowsTransfer,
				&pm.AffectsBalance, &pm.AffectsCreditCard, &pm.AffectsInvoice, &pm.IsInternal,
				&pm.Icon, &pm.SortOrder, &pm.IsActive, &pm.CreatedAt,
			)
			if err != nil {
				return fmt.Errorf("failed to scan payment method: %w", err)
			}

			if userID != nil {
				pm.UserID = *userID
			}

			if filter.TransactionType != "" {
				if !pm.CanBeUsedFor(filter.TransactionType) {
					continue
				}
			}

			methods = append(methods, pm)
		}
		return nil
	}

	err = scanRows(rows)
	if err != nil {
		return nil, err
	}

	// Self-healing: If no methods found, try to create defaults and retry
	// This ensures that even if the trigger failed or user is new, they get methods.
	if len(methods) == 0 {
		// Only attempt creation if we really found nothing.
		// If filter was strict (e.g. only active), we might want to check if ANY exist first?
		// But create_default_payment_methods is idempotent (checks IF NOT EXISTS), so it's safe to call.

		// We execute the function call
		_, err := r.db.Exec(ctx, "SELECT create_default_payment_methods($1)", userID)
		if err == nil {
			// Retry the query
			rows, err := r.db.Query(ctx, query, args...)
			if err == nil {
				methods = []entity.PaymentMethod{} // Clear previous empty
				_ = scanRows(rows)
			}
		} else {
			fmt.Printf("Warning: Failed to auto-create payment methods for user %s: %v\n", userID, err)
		}
	}

	return methods, nil
}
