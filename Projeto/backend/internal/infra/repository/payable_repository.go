package repository

import (
	"context"
	"financeiro-api/internal/entity"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type PayableRepository struct {
	db *pgxpool.Pool
}

func NewPayableRepository(db *pgxpool.Pool) *PayableRepository {
	return &PayableRepository{db: db}
}

func (r *PayableRepository) Create(ctx context.Context, p *entity.Payable) error {
	query := `
		INSERT INTO payables (
			id, user_id, description, amount, due_date, status, 
			recurrence_strategy, installment_number, total_installments, recurrence_id,
			category_id, subcategory_id, payment_method_id, 
			paid_at, transaction_id, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, 
			$7, $8, $9, $10,
			$11, $12, $13, 
			$14, $15, $16, $17
		)
	`
	_, err := r.db.Exec(ctx, query,
		p.ID, p.UserID, p.Description, p.Amount, p.DueDate, p.Status,
		p.RecurrenceStrategy, p.InstallmentNumber, p.TotalInstallments, p.RecurrenceID,
		p.CategoryID, p.SubcategoryID, p.PaymentMethodID,
		p.PaidAt, p.TransactionID, p.CreatedAt, p.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create payable: %w", err)
	}
	return nil
}

// FindByID returns the payable with populated Category/Subcategory names if possible
func (r *PayableRepository) FindByID(ctx context.Context, id string) (*entity.Payable, error) {
	// Join with categories/subcategories to match Frontend logic
	query := `
		SELECT 
			p.id, p.user_id, p.description, p.amount, p.due_date, p.status, 
			p.recurrence_strategy, p.installment_number, p.total_installments, p.recurrence_id,
			p.category_id, p.subcategory_id, p.payment_method_id, 
			p.paid_at, p.transaction_id, p.created_at, p.updated_at,
            c.name, s.name
		FROM payables p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN subcategories s ON p.subcategory_id = s.id
		WHERE p.id = $1
	`
	var p entity.Payable
	var catName, subName *string // Temp vars for scan

	err := r.db.QueryRow(ctx, query, id).Scan(
		&p.ID, &p.UserID, &p.Description, &p.Amount, &p.DueDate, &p.Status,
		&p.RecurrenceStrategy, &p.InstallmentNumber, &p.TotalInstallments, &p.RecurrenceID,
		&p.CategoryID, &p.SubcategoryID, &p.PaymentMethodID,
		&p.PaidAt, &p.TransactionID, &p.CreatedAt, &p.UpdatedAt,
		&catName, &subName,
	)
	if err != nil {
		return nil, fmt.Errorf("payable not found: %w", err)
	}

	// Fill virtual structs if joined
	if catName != nil {
		p.Category = &entity.Category{ID: *p.CategoryID, Name: *catName}
	}
	if subName != nil {
		p.Subcategory = &entity.Subcategory{ID: *p.SubcategoryID, Name: *subName}
	}

	return &p, nil
}

func (r *PayableRepository) Update(ctx context.Context, p *entity.Payable) error {
	query := `
		UPDATE payables SET 
			description = $1, amount = $2, due_date = $3, status = $4,
			category_id = $5, subcategory_id = $6, payment_method_id = $7,
			paid_at = $8, transaction_id = $9, updated_at = $10
		WHERE id = $11
	`
	_, err := r.db.Exec(ctx, query,
		p.Description, p.Amount, p.DueDate, p.Status,
		p.CategoryID, p.SubcategoryID, p.PaymentMethodID,
		p.PaidAt, p.TransactionID, p.UpdatedAt,
		p.ID,
	)
	if err != nil {
		return fmt.Errorf("failed to update payable: %w", err)
	}
	return nil
}

func (r *PayableRepository) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM payables WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	return err
}

func (r *PayableRepository) DeleteSeries(ctx context.Context, recurrenceID, userID string) error {
	// Delete only pending payables in the series
	query := `DELETE FROM payables WHERE recurrence_id = $1 AND user_id = $2 AND status = 'pending'`
	_, err := r.db.Exec(ctx, query, recurrenceID, userID)
	return err
}

func (r *PayableRepository) UpdateSeries(ctx context.Context, p *entity.Payable) error {
	// Update only pending payables in the series
	// Note: DueDate is NOT updated for series to maintain the timeline structure
	query := `
        UPDATE payables SET 
            description = $1, amount = $2, 
            category_id = $3, subcategory_id = $4, payment_method_id = $5,
            updated_at = $6
        WHERE recurrence_id = $7 AND user_id = $8 AND status = 'pending'
    `
	_, err := r.db.Exec(ctx, query,
		p.Description, p.Amount,
		p.CategoryID, p.SubcategoryID, p.PaymentMethodID,
		p.UpdatedAt,
		p.RecurrenceID, p.UserID,
	)
	if err != nil {
		return fmt.Errorf("failed to update series: %w", err)
	}
	return nil
}

// FindAllByDateRange used for listing (simplified version of Frontend query)
func (r *PayableRepository) FindAllByDateRange(ctx context.Context, userID string, start, end time.Time) ([]entity.Payable, error) {
	query := `
		SELECT 
			p.id, p.user_id, p.description, p.amount, p.due_date, p.status, 
			p.recurrence_strategy, p.installment_number, p.total_installments, p.recurrence_id,
			p.category_id, p.subcategory_id, p.payment_method_id, 
			p.paid_at, p.transaction_id, p.created_at, p.updated_at,
            c.name, c.color, c.icon, s.name
		FROM payables p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN subcategories s ON p.subcategory_id = s.id
		WHERE p.user_id = $1 AND p.due_date >= $2 AND p.due_date <= $3
        ORDER BY p.due_date ASC
	`

	rows, err := r.db.Query(ctx, query, userID, start, end)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var payables []entity.Payable
	for rows.Next() {
		var p entity.Payable
		var catName, catColor, catIcon, subName *string

		err := rows.Scan(
			&p.ID, &p.UserID, &p.Description, &p.Amount, &p.DueDate, &p.Status,
			&p.RecurrenceStrategy, &p.InstallmentNumber, &p.TotalInstallments, &p.RecurrenceID,
			&p.CategoryID, &p.SubcategoryID, &p.PaymentMethodID,
			&p.PaidAt, &p.TransactionID, &p.CreatedAt, &p.UpdatedAt,
			&catName, &catColor, &catIcon, &subName,
		)
		if err != nil {
			return nil, err
		}

		if catName != nil {
			p.Category = &entity.Category{ID: *p.CategoryID, Name: *catName, Color: *catColor, Icon: *catIcon}
		}
		if subName != nil {
			p.Subcategory = &entity.Subcategory{ID: *p.SubcategoryID, Name: *subName}
		}

		payables = append(payables, p)
	}
	return payables, nil
}
