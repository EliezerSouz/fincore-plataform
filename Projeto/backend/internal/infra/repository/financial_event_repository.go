package repository

import (
	"context"
	"financeiro-api/internal/entity"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

type FinancialEventRepository struct {
	db *pgxpool.Pool
}

func NewFinancialEventRepository(db *pgxpool.Pool) *FinancialEventRepository {
	return &FinancialEventRepository{db: db}
}

// Create cria um novo evento financeiro
func (r *FinancialEventRepository) Create(ctx context.Context, userID string, input entity.CreateFinancialEventInput) (*entity.FinancialEvent, error) {
	query := `
		INSERT INTO financial_events (
			user_id, type, invoice_id, amount,
			origin_invoice_id, related_event_id, account_id,
			balance_impact, notes, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
		RETURNING id, user_id, type, invoice_id, amount,
			origin_invoice_id, related_event_id, account_id,
			balance_impact, notes, created_at, reverted_at
	`

	var event entity.FinancialEvent
	err := r.db.QueryRow(ctx, query,
		userID,
		input.Type,
		input.InvoiceID,
		input.Amount,
		input.OriginInvoiceID,
		input.RelatedEventID,
		input.AccountID,
		input.BalanceImpact,
		input.Notes,
	).Scan(
		&event.ID,
		&event.UserID,
		&event.Type,
		&event.InvoiceID,
		&event.Amount,
		&event.OriginInvoiceID,
		&event.RelatedEventID,
		&event.AccountID,
		&event.BalanceImpact,
		&event.Notes,
		&event.CreatedAt,
		&event.RevertedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create financial event: %w", err)
	}

	return &event, nil
}

// FindByInvoiceID busca eventos de uma fatura
func (r *FinancialEventRepository) FindByInvoiceID(ctx context.Context, invoiceID string) ([]entity.FinancialEvent, error) {
	query := `
		SELECT id, user_id, type, invoice_id, amount,
			origin_invoice_id, related_event_id, account_id,
			balance_impact, notes, created_at, reverted_at
		FROM financial_events
		WHERE invoice_id = $1
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(ctx, query, invoiceID)
	if err != nil {
		return nil, fmt.Errorf("failed to query events: %w", err)
	}
	defer rows.Close()

	var events []entity.FinancialEvent
	for rows.Next() {
		var event entity.FinancialEvent
		err := rows.Scan(
			&event.ID,
			&event.UserID,
			&event.Type,
			&event.InvoiceID,
			&event.Amount,
			&event.OriginInvoiceID,
			&event.RelatedEventID,
			&event.AccountID,
			&event.BalanceImpact,
			&event.Notes,
			&event.CreatedAt,
			&event.RevertedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan event: %w", err)
		}
		events = append(events, event)
	}

	return events, nil
}

// FindByID busca um evento por ID
func (r *FinancialEventRepository) FindByID(ctx context.Context, id string) (*entity.FinancialEvent, error) {
	query := `
		SELECT id, user_id, type, invoice_id, amount,
			origin_invoice_id, related_event_id, account_id,
			balance_impact, notes, created_at, reverted_at
		FROM financial_events
		WHERE id = $1
	`

	var event entity.FinancialEvent
	err := r.db.QueryRow(ctx, query, id).Scan(
		&event.ID,
		&event.UserID,
		&event.Type,
		&event.InvoiceID,
		&event.Amount,
		&event.OriginInvoiceID,
		&event.RelatedEventID,
		&event.AccountID,
		&event.BalanceImpact,
		&event.Notes,
		&event.CreatedAt,
		&event.RevertedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to find event: %w", err)
	}

	return &event, nil
}

// Revert marca um evento como estornado
func (r *FinancialEventRepository) Revert(ctx context.Context, eventID string) error {
	query := `
		UPDATE financial_events
		SET reverted_at = NOW()
		WHERE id = $1 AND reverted_at IS NULL
	`

	cmdTag, err := r.db.Exec(ctx, query, eventID)
	if err != nil {
		return fmt.Errorf("failed to revert event: %w", err)
	}

	if cmdTag.RowsAffected() == 0 {
		return entity.ErrEventAlreadyReverted
	}

	return nil
}

// FindPaymentsByInvoice busca pagamentos de uma fatura
func (r *FinancialEventRepository) FindPaymentsByInvoice(ctx context.Context, invoiceID string) ([]entity.FinancialEvent, error) {
	query := `
		SELECT id, user_id, type, invoice_id, amount,
			origin_invoice_id, related_event_id, account_id,
			balance_impact, notes, created_at, reverted_at
		FROM financial_events
		WHERE invoice_id = $1
			AND type IN ('PAGAMENTO_FATURA', 'PAGAMENTO_ANTECIPADO')
			AND reverted_at IS NULL
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(ctx, query, invoiceID)
	if err != nil {
		return nil, fmt.Errorf("failed to query payments: %w", err)
	}
	defer rows.Close()

	var events []entity.FinancialEvent
	for rows.Next() {
		var event entity.FinancialEvent
		err := rows.Scan(
			&event.ID,
			&event.UserID,
			&event.Type,
			&event.InvoiceID,
			&event.Amount,
			&event.OriginInvoiceID,
			&event.RelatedEventID,
			&event.AccountID,
			&event.BalanceImpact,
			&event.Notes,
			&event.CreatedAt,
			&event.RevertedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan payment: %w", err)
		}
		events = append(events, event)
	}

	return events, nil
}
