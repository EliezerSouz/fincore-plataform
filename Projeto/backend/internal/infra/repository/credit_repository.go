package repository

import (
	"context"
	"financeiro-api/internal/entity"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

type CreditRepository struct {
	db *pgxpool.Pool
}

func NewCreditRepository(db *pgxpool.Pool) *CreditRepository {
	return &CreditRepository{db: db}
}

// Create cria um novo crédito
func (r *CreditRepository) Create(ctx context.Context, userID string, input entity.CreateCreditInput) (*entity.Credit, error) {
	query := `
		INSERT INTO credits (
			user_id, origin_invoice_id, current_invoice_id,
			original_amount, remaining_amount, is_consumed,
			created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
		RETURNING id, user_id, origin_invoice_id, current_invoice_id,
			original_amount, remaining_amount, is_consumed,
			created_at, updated_at
	`

	var credit entity.Credit
	err := r.db.QueryRow(ctx, query,
		userID,
		input.OriginInvoiceID,
		input.CurrentInvoiceID,
		input.OriginalAmount,
		input.RemainingAmount,
		false, // is_consumed
	).Scan(
		&credit.ID,
		&credit.UserID,
		&credit.OriginInvoiceID,
		&credit.CurrentInvoiceID,
		&credit.OriginalAmount,
		&credit.RemainingAmount,
		&credit.IsConsumed,
		&credit.CreatedAt,
		&credit.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create credit: %w", err)
	}

	return &credit, nil
}

// FindByID busca um crédito por ID
func (r *CreditRepository) FindByID(ctx context.Context, id string) (*entity.Credit, error) {
	query := `
		SELECT id, user_id, origin_invoice_id, current_invoice_id,
			original_amount, remaining_amount, is_consumed,
			created_at, updated_at
		FROM credits
		WHERE id = $1
	`

	var credit entity.Credit
	err := r.db.QueryRow(ctx, query, id).Scan(
		&credit.ID,
		&credit.UserID,
		&credit.OriginInvoiceID,
		&credit.CurrentInvoiceID,
		&credit.OriginalAmount,
		&credit.RemainingAmount,
		&credit.IsConsumed,
		&credit.CreatedAt,
		&credit.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to find credit: %w", err)
	}

	return &credit, nil
}

// FindByOriginInvoice busca créditos gerados por uma fatura
func (r *CreditRepository) FindByOriginInvoice(ctx context.Context, invoiceID string) ([]entity.Credit, error) {
	query := `
		SELECT id, user_id, origin_invoice_id, current_invoice_id,
			original_amount, remaining_amount, is_consumed,
			created_at, updated_at
		FROM credits
		WHERE origin_invoice_id = $1
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(ctx, query, invoiceID)
	if err != nil {
		return nil, fmt.Errorf("failed to query credits: %w", err)
	}
	defer rows.Close()

	var credits []entity.Credit
	for rows.Next() {
		var credit entity.Credit
		err := rows.Scan(
			&credit.ID,
			&credit.UserID,
			&credit.OriginInvoiceID,
			&credit.CurrentInvoiceID,
			&credit.OriginalAmount,
			&credit.RemainingAmount,
			&credit.IsConsumed,
			&credit.CreatedAt,
			&credit.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan credit: %w", err)
		}
		credits = append(credits, credit)
	}

	return credits, nil
}

// FindByCurrentInvoice busca créditos alocados em uma fatura
func (r *CreditRepository) FindByCurrentInvoice(ctx context.Context, invoiceID string) ([]entity.Credit, error) {
	query := `
		SELECT id, user_id, origin_invoice_id, current_invoice_id,
			original_amount, remaining_amount, is_consumed,
			created_at, updated_at
		FROM credits
		WHERE current_invoice_id = $1
			AND is_consumed = false
		ORDER BY created_at ASC
	`

	rows, err := r.db.Query(ctx, query, invoiceID)
	if err != nil {
		return nil, fmt.Errorf("failed to query credits: %w", err)
	}
	defer rows.Close()

	var credits []entity.Credit
	for rows.Next() {
		var credit entity.Credit
		err := rows.Scan(
			&credit.ID,
			&credit.UserID,
			&credit.OriginInvoiceID,
			&credit.CurrentInvoiceID,
			&credit.OriginalAmount,
			&credit.RemainingAmount,
			&credit.IsConsumed,
			&credit.CreatedAt,
			&credit.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan credit: %w", err)
		}
		credits = append(credits, credit)
	}

	return credits, nil
}

// Update atualiza um crédito
func (r *CreditRepository) Update(ctx context.Context, credit *entity.Credit) error {
	query := `
		UPDATE credits
		SET current_invoice_id = $1,
			remaining_amount = $2,
			is_consumed = $3,
			updated_at = NOW()
		WHERE id = $4
	`

	cmdTag, err := r.db.Exec(ctx, query,
		credit.CurrentInvoiceID,
		credit.RemainingAmount,
		credit.IsConsumed,
		credit.ID,
	)

	if err != nil {
		return fmt.Errorf("failed to update credit: %w", err)
	}

	if cmdTag.RowsAffected() == 0 {
		return entity.ErrCreditNotFound
	}

	return nil
}

// ConsumeAmount consome uma quantidade do crédito
func (r *CreditRepository) ConsumeAmount(ctx context.Context, creditID string, amount float64) error {
	// Buscar crédito
	credit, err := r.FindByID(ctx, creditID)
	if err != nil {
		return err
	}

	// Validar e consumir
	if err := credit.ConsumeAmount(amount); err != nil {
		return err
	}

	// Atualizar no banco
	return r.Update(ctx, credit)
}

// MigrateToInvoice migra crédito para outra fatura
func (r *CreditRepository) MigrateToInvoice(ctx context.Context, creditID, newInvoiceID string) error {
	query := `
		UPDATE credits
		SET current_invoice_id = $1,
			updated_at = NOW()
		WHERE id = $2 AND is_consumed = false
	`

	cmdTag, err := r.db.Exec(ctx, query, newInvoiceID, creditID)
	if err != nil {
		return fmt.Errorf("failed to migrate credit: %w", err)
	}

	if cmdTag.RowsAffected() == 0 {
		return entity.ErrCreditAlreadyConsumed
	}

	return nil
}

// GetTotalActiveCreditsForInvoice calcula total de créditos ativos de uma fatura
func (r *CreditRepository) GetTotalActiveCreditsForInvoice(ctx context.Context, invoiceID string) (float64, error) {
	query := `
		SELECT COALESCE(SUM(remaining_amount), 0)
		FROM credits
		WHERE current_invoice_id = $1
			AND is_consumed = false
	`

	var total float64
	err := r.db.QueryRow(ctx, query, invoiceID).Scan(&total)
	if err != nil {
		return 0, fmt.Errorf("failed to calculate total credits: %w", err)
	}

	return total, nil
}
