package repository

import (
	"context"
	"financeiro-api/internal/entity"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type CardRepository struct {
	db *pgxpool.Pool
}

func NewCardRepository(db *pgxpool.Pool) *CardRepository {
	return &CardRepository{db: db}
}

func (r *CardRepository) FindAll(ctx context.Context, userID string) ([]entity.CreditCard, error) {
	query := `
		SELECT c.id, c.user_id, c.account_id, c.name, c.brand, c.last_4_digits, c.limit_amount, 
		       c.closing_day, c.due_day, c.color, c.created_at, c.updated_at,
		       (c.limit_amount - COALESCE((
		           SELECT SUM(i.total_amount - i.paid_amount)
		           FROM credit_card_invoices i
		           WHERE i.credit_card_id = c.id
		             AND i.status != 'paid'
		       ), 0)) as available_limit,
		       (
		           SELECT i.total_amount - i.paid_amount
		           FROM credit_card_invoices i
		           WHERE i.credit_card_id = c.id
		             AND i.status != 'paid'
		           ORDER BY i.due_date ASC
		           LIMIT 1
		       ) as next_invoice_amount,
		       (
		           SELECT i.due_date
		           FROM credit_card_invoices i
		           WHERE i.credit_card_id = c.id
		             AND i.status != 'paid'
		           ORDER BY i.due_date ASC
		           LIMIT 1
		       ) as next_invoice_date
		FROM credit_cards c
		WHERE c.user_id = $1
		ORDER BY c.name
	`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query cards: %w", err)
	}
	defer rows.Close()

	var cards []entity.CreditCard
	for rows.Next() {
		var card entity.CreditCard
		var avail float64
		var nextAmount *float64
		var nextDate *time.Time
		err := rows.Scan(
			&card.ID, &card.UserID, &card.AccountID, &card.Name, &card.Brand, &card.Last4Digits,
			&card.LimitAmount, &card.ClosingDay, &card.DueDay, &card.Color,
			&card.CreatedAt, &card.UpdatedAt, &avail, &nextAmount, &nextDate,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan card: %w", err)
		}
		card.AvailableLimit = &avail
		card.NextInvoiceAmount = nextAmount
		card.NextInvoiceDate = nextDate
		cards = append(cards, card)
	}

	return cards, nil
}

func (r *CardRepository) FindByID(ctx context.Context, id, userID string) (*entity.CreditCard, error) {
	query := `
		SELECT c.id, c.user_id, c.account_id, c.name, c.brand, c.last_4_digits, c.limit_amount, 
		       c.closing_day, c.due_day, c.color, c.created_at, c.updated_at
		FROM credit_cards c
		WHERE c.id = $1 AND c.user_id = $2
	`
	var card entity.CreditCard
	err := r.db.QueryRow(ctx, query, id, userID).Scan(
		&card.ID, &card.UserID, &card.AccountID, &card.Name, &card.Brand, &card.Last4Digits,
		&card.LimitAmount, &card.ClosingDay, &card.DueDay, &card.Color,
		&card.CreatedAt, &card.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to find card: %w", err)
	}
	return &card, nil
}

func (r *CardRepository) Create(ctx context.Context, userID string, input entity.CreateCardInput) (*entity.CreditCard, error) {
	query := `
		INSERT INTO credit_cards (
			user_id, account_id, name, brand, last_4_digits, limit_amount, closing_day, due_day, color
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, user_id, account_id, name, brand, last_4_digits, limit_amount, closing_day, due_day, color, created_at, updated_at
	`
	var card entity.CreditCard
	err := r.db.QueryRow(ctx, query, userID, input.AccountID, input.Name, input.Brand, input.Last4Digits,
		input.LimitAmount, input.ClosingDay, input.DueDay, input.Color).Scan(
		&card.ID, &card.UserID, &card.AccountID, &card.Name, &card.Brand, &card.Last4Digits,
		&card.LimitAmount, &card.ClosingDay, &card.DueDay, &card.Color,
		&card.CreatedAt, &card.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create card: %w", err)
	}
	// Initial available limit equals total limit
	avail := card.LimitAmount
	card.AvailableLimit = &avail
	return &card, nil
}

func (r *CardRepository) Update(ctx context.Context, id, userID string, input entity.UpdateCardInput) (*entity.CreditCard, error) {
	query := `UPDATE credit_cards SET updated_at = NOW()`
	args := []interface{}{id, userID}
	argCount := 2

	if input.Name != nil {
		argCount++
		query += fmt.Sprintf(", name = $%d", argCount)
		args = append(args, *input.Name)
	}
	if input.AccountID != nil {
		argCount++
		query += fmt.Sprintf(", account_id = $%d", argCount)
		args = append(args, *input.AccountID)
	}
	if input.Brand != nil {
		argCount++
		query += fmt.Sprintf(", brand = $%d", argCount)
		args = append(args, *input.Brand)
	}
	if input.Last4Digits != nil {
		argCount++
		query += fmt.Sprintf(", last_4_digits = $%d", argCount)
		args = append(args, *input.Last4Digits)
	}
	if input.LimitAmount != nil {
		argCount++
		query += fmt.Sprintf(", limit_amount = $%d", argCount)
		args = append(args, *input.LimitAmount)
	}
	if input.ClosingDay != nil {
		argCount++
		query += fmt.Sprintf(", closing_day = $%d", argCount)
		args = append(args, *input.ClosingDay)
	}
	if input.DueDay != nil {
		argCount++
		query += fmt.Sprintf(", due_day = $%d", argCount)
		args = append(args, *input.DueDay)
	}
	if input.Color != nil {
		argCount++
		query += fmt.Sprintf(", color = $%d", argCount)
		args = append(args, *input.Color)
	}

	query += ` WHERE id = $1 AND user_id = $2 RETURNING id, user_id, account_id, name, brand, last_4_digits, limit_amount, closing_day, due_day, color, created_at, updated_at`

	var card entity.CreditCard
	err := r.db.QueryRow(ctx, query, args...).Scan(
		&card.ID, &card.UserID, &card.AccountID, &card.Name, &card.Brand, &card.Last4Digits,
		&card.LimitAmount, &card.ClosingDay, &card.DueDay, &card.Color,
		&card.CreatedAt, &card.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to update card: %w", err)
	}
	return &card, nil
}

func (r *CardRepository) Delete(ctx context.Context, id, userID string) error {
	// Need to handle CASCADE manually if not set in DB
	// Frontend implementation did: delete txs, delete invoices, call rpc(force_delete).
	// RPC force_delete suggests DB constraints.
	// We can try calling the RPC from here or just cascading deletes?
	// Using transaction (BEGIN...COMMIT) is best practice here.

	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Delete transactions linked to invoices of this card? Or just invoices?
	// Frontend logic: delete credit_card_transactions where credit_card_id = id
	_, err = tx.Exec(ctx, "DELETE FROM credit_card_transactions WHERE credit_card_id = $1 AND user_id = $2", id, userID)
	if err != nil {
		return fmt.Errorf("failed to delete transactions: %w", err)
	}

	// Delete invoices
	_, err = tx.Exec(ctx, "DELETE FROM credit_card_invoices WHERE credit_card_id = $1 AND user_id = $2", id, userID)
	if err != nil {
		return fmt.Errorf("failed to delete invoices: %w", err)
	}

	// Delete card
	_, err = tx.Exec(ctx, "DELETE FROM credit_cards WHERE id = $1 AND user_id = $2", id, userID)
	if err != nil {
		return fmt.Errorf("failed to delete card: %w", err)
	}

	return tx.Commit(ctx)
}
