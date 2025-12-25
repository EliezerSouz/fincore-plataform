package repository

import (
	"context"
	"financeiro-api/internal/entity"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

// InvoiceRepositoryExtension adiciona métodos para o novo sistema de faturas
type InvoiceRepositoryExtension struct {
	db *pgxpool.Pool
}

func NewInvoiceRepositoryExtension(db *pgxpool.Pool) *InvoiceRepositoryExtension {
	return &InvoiceRepositoryExtension{db: db}
}

// FindByCardAndPeriod busca fatura por cartão e período
func (r *InvoiceRepositoryExtension) FindByCardAndPeriod(ctx context.Context, cardID string, year, month int) (*entity.Invoice, error) {
	query := `
		SELECT id, user_id, credit_card_id, reference_month, reference_year,
			closing_date, due_date, status, total_amount, paid_amount,
			remaining_amount, inherited_credit, generated_credit,
			created_at, updated_at
		FROM invoices
		WHERE credit_card_id = $1
			AND reference_year = $2
			AND reference_month = $3
		LIMIT 1
	`

	var invoice entity.Invoice
	err := r.db.QueryRow(ctx, query, cardID, year, month).Scan(
		&invoice.ID,
		&invoice.UserID,
		&invoice.CreditCardID,
		&invoice.ReferenceMonth,
		&invoice.ReferenceYear,
		&invoice.ClosingDate,
		&invoice.DueDate,
		&invoice.Status,
		&invoice.TotalAmount,
		&invoice.PaidAmount,
		&invoice.RemainingAmount,
		&invoice.InheritedCredit,
		&invoice.GeneratedCredit,
		&invoice.CreatedAt,
		&invoice.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("invoice not found: %w", err)
	}

	return &invoice, nil
}

// Create cria uma nova fatura
func (r *InvoiceRepositoryExtension) Create(ctx context.Context, invoice *entity.Invoice) error {
	query := `
		INSERT INTO invoices (
			user_id, credit_card_id, reference_month, reference_year,
			closing_date, due_date, status, total_amount, paid_amount,
			remaining_amount, inherited_credit, generated_credit,
			created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
		RETURNING id, created_at, updated_at
	`

	err := r.db.QueryRow(ctx, query,
		invoice.UserID,
		invoice.CreditCardID,
		invoice.ReferenceMonth,
		invoice.ReferenceYear,
		invoice.ClosingDate,
		invoice.DueDate,
		invoice.Status,
		invoice.TotalAmount,
		invoice.PaidAmount,
		invoice.RemainingAmount,
		invoice.InheritedCredit,
		invoice.GeneratedCredit,
	).Scan(&invoice.ID, &invoice.CreatedAt, &invoice.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to create invoice: %w", err)
	}

	return nil
}

// Update atualiza uma fatura
func (r *InvoiceRepositoryExtension) Update(ctx context.Context, invoice *entity.Invoice) error {
	query := `
		UPDATE invoices
		SET status = $1,
			total_amount = $2,
			paid_amount = $3,
			remaining_amount = $4,
			inherited_credit = $5,
			generated_credit = $6,
			updated_at = NOW()
		WHERE id = $7
	`

	cmdTag, err := r.db.Exec(ctx, query,
		invoice.Status,
		invoice.TotalAmount,
		invoice.PaidAmount,
		invoice.RemainingAmount,
		invoice.InheritedCredit,
		invoice.GeneratedCredit,
		invoice.ID,
	)

	if err != nil {
		return fmt.Errorf("failed to update invoice: %w", err)
	}

	if cmdTag.RowsAffected() == 0 {
		return entity.ErrInvoiceNotFound
	}

	return nil
}

// FindByID busca fatura por ID
func (r *InvoiceRepositoryExtension) FindByID(ctx context.Context, id string) (*entity.Invoice, error) {
	query := `
		SELECT id, user_id, credit_card_id, reference_month, reference_year,
			closing_date, due_date, status, total_amount, paid_amount,
			remaining_amount, inherited_credit, generated_credit,
			created_at, updated_at
		FROM invoices
		WHERE id = $1
	`

	var invoice entity.Invoice
	err := r.db.QueryRow(ctx, query, id).Scan(
		&invoice.ID,
		&invoice.UserID,
		&invoice.CreditCardID,
		&invoice.ReferenceMonth,
		&invoice.ReferenceYear,
		&invoice.ClosingDate,
		&invoice.DueDate,
		&invoice.Status,
		&invoice.TotalAmount,
		&invoice.PaidAmount,
		&invoice.RemainingAmount,
		&invoice.InheritedCredit,
		&invoice.GeneratedCredit,
		&invoice.CreatedAt,
		&invoice.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("invoice not found: %w", err)
	}

	return &invoice, nil
}
