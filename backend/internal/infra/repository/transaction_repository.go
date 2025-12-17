package repository

import (
	"context"
	"financeiro-api/internal/entity"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

type TransactionRepository struct {
	db *pgxpool.Pool
}

func NewTransactionRepository(db *pgxpool.Pool) *TransactionRepository {
	return &TransactionRepository{db: db}
}

// Filtros de transação
type TransactionFilter struct {
	AccountID  string
	CategoryID string
	Type       string
	DateStart  string
	DateEnd    string
}

func (r *TransactionRepository) FindAll(ctx context.Context, userID string, filter TransactionFilter, limit, offset int) ([]entity.Transaction, error) {
	query := `
		SELECT t.id, t.user_id, t.account_id, t.category_id, t.subcategory_id, 
		       t.payment_method_id, t.credit_card_invoice_id, t.payable_id, t.related_transaction_id,
		       t.description, t.amount, t.type, t.date, t.created_at, t.updated_at,
		       c.name, c.icon, c.color,
		       a.name, a.type,
		       s.name,
		       pm.name
		FROM transactions t
		LEFT JOIN categories c ON t.category_id = c.id
		LEFT JOIN accounts a ON t.account_id = a.id
		LEFT JOIN subcategories s ON t.subcategory_id = s.id
		LEFT JOIN payment_methods pm ON t.payment_method_id = pm.id
		WHERE t.user_id = $1
	`

	args := []interface{}{userID}
	argCount := 1

	if filter.AccountID != "" {
		argCount++
		query += fmt.Sprintf(" AND t.account_id = $%d", argCount)
		args = append(args, filter.AccountID)
	}
	if filter.CategoryID != "" {
		argCount++
		query += fmt.Sprintf(" AND t.category_id = $%d", argCount)
		args = append(args, filter.CategoryID)
	}
	if filter.Type != "" && filter.Type != "all" {
		argCount++
		query += fmt.Sprintf(" AND t.type = $%d", argCount)
		args = append(args, filter.Type)
	}
	if filter.DateStart != "" {
		argCount++
		query += fmt.Sprintf(" AND t.date >= $%d", argCount)
		args = append(args, filter.DateStart)
	}
	if filter.DateEnd != "" {
		argCount++
		query += fmt.Sprintf(" AND t.date <= $%d", argCount)
		args = append(args, filter.DateEnd)
	}

	argCount++
	query += fmt.Sprintf(" ORDER BY t.date DESC, t.created_at DESC LIMIT $%d", argCount)
	args = append(args, limit)

	argCount++
	query += fmt.Sprintf(" OFFSET $%d", argCount)
	args = append(args, offset)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query transactions: %w", err)
	}
	defer rows.Close()

	var transactions []entity.Transaction
	for rows.Next() {
		var tx entity.Transaction
		var catName, catIcon, catColor *string
		var accName, accType *string
		var subName, pmName *string

		err := rows.Scan(
			&tx.ID, &tx.UserID, &tx.AccountID, &tx.CategoryID, &tx.SubcategoryID,
			&tx.PaymentMethodID, &tx.InvoiceID, &tx.PayableID, &tx.RelatedTransactionID,
			&tx.Description, &tx.Amount, &tx.Type, &tx.Date, &tx.CreatedAt, &tx.UpdatedAt,
			&catName, &catIcon, &catColor,
			&accName, &accType,
			&subName, &pmName,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan transaction: %w", err)
		}

		if catName != nil {
			tx.Category = &entity.Category{
				Name:  *catName,
				Icon:  *catIcon,
				Color: *catColor,
			}
		}

		if accName != nil {
			tx.Account = &entity.Account{
				Name: *accName,
				Type: *accType,
			}
		}

		if subName != nil {
			tx.Subcategory = &entity.Subcategory{
				Name: *subName,
			}
		}

		if pmName != nil {
			tx.PaymentMethod = &entity.PaymentMethod{
				Name: *pmName,
			}
		}

		transactions = append(transactions, tx)
	}

	return transactions, nil
}

func (r *TransactionRepository) FindByID(ctx context.Context, id, userID string) (*entity.Transaction, error) {
	query := `
		SELECT id, user_id, account_id, category_id, subcategory_id,
		       payment_method_id, credit_card_invoice_id, payable_id, related_transaction_id,
		       description, amount, type, date, created_at, updated_at
		FROM transactions
		WHERE id = $1 AND user_id = $2
	`

	var tx entity.Transaction
	err := r.db.QueryRow(ctx, query, id, userID).Scan(
		&tx.ID, &tx.UserID, &tx.AccountID, &tx.CategoryID, &tx.SubcategoryID,
		&tx.PaymentMethodID, &tx.InvoiceID, &tx.PayableID, &tx.RelatedTransactionID,
		&tx.Description, &tx.Amount, &tx.Type, &tx.Date, &tx.CreatedAt, &tx.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to find transaction: %w", err)
	}

	return &tx, nil
}

func (r *TransactionRepository) Create(ctx context.Context, userID string, input entity.CreateTransactionInput) (*entity.Transaction, error) {
	// Start transaction
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	// Insert transaction
	query := `
		INSERT INTO transactions (
			user_id, account_id, category_id, subcategory_id,
			payment_method_id, description, amount, type, date, payable_id, credit_card_invoice_id
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id, user_id, account_id, category_id, subcategory_id,
		          payment_method_id, credit_card_invoice_id, payable_id, related_transaction_id,
		          description, amount, type, date, created_at, updated_at
	`

	var transaction entity.Transaction
	err = tx.QueryRow(ctx, query,
		userID, input.AccountID, input.CategoryID, input.SubcategoryID,
		input.PaymentMethodID, input.Description, input.Amount, input.Type, input.Date, input.PayableID, input.InvoiceID,
	).Scan(
		&transaction.ID, &transaction.UserID, &transaction.AccountID,
		&transaction.CategoryID, &transaction.SubcategoryID, &transaction.PaymentMethodID,
		&transaction.InvoiceID, &transaction.PayableID, &transaction.RelatedTransactionID,
		&transaction.Description, &transaction.Amount, &transaction.Type,
		&transaction.Date, &transaction.CreatedAt, &transaction.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create transaction: %w", err)
	}

	// Update account balance
	balanceChange := input.Amount
	if input.Type == "despesa" {
		balanceChange = -balanceChange
	}

	updateBalanceQuery := `
		UPDATE accounts
		SET balance = balance + $1, updated_at = NOW()
		WHERE id = $2 AND user_id = $3
	`

	_, err = tx.Exec(ctx, updateBalanceQuery, balanceChange, input.AccountID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to update account balance: %w", err)
	}

	// Commit transaction
	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return &transaction, nil
}

func (r *TransactionRepository) Update(ctx context.Context, id, userID string, input entity.UpdateTransactionInput) (*entity.Transaction, error) {
	// Get original transaction first
	original, err := r.FindByID(ctx, id, userID)
	if err != nil {
		return nil, err
	}

	// Start transaction
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	// Build dynamic update query
	query := `UPDATE transactions SET updated_at = NOW()`
	args := []interface{}{id, userID}
	argCount := 2

	if input.AccountID != nil {
		argCount++
		query += fmt.Sprintf(", account_id = $%d", argCount)
		args = append(args, *input.AccountID)
	}
	if input.CategoryID != nil {
		argCount++
		query += fmt.Sprintf(", category_id = $%d", argCount)
		args = append(args, *input.CategoryID)
	}
	if input.SubcategoryID != nil {
		argCount++
		query += fmt.Sprintf(", subcategory_id = $%d", argCount)
		args = append(args, *input.SubcategoryID)
	}
	if input.PaymentMethodID != nil {
		argCount++
		query += fmt.Sprintf(", payment_method_id = $%d", argCount)
		args = append(args, *input.PaymentMethodID)
	}
	if input.Description != nil {
		argCount++
		query += fmt.Sprintf(", description = $%d", argCount)
		args = append(args, *input.Description)
	}
	if input.Amount != nil {
		argCount++
		query += fmt.Sprintf(", amount = $%d", argCount)
		args = append(args, *input.Amount)
	}
	if input.Type != nil {
		argCount++
		query += fmt.Sprintf(", type = $%d", argCount)
		args = append(args, *input.Type)
	}
	if input.Date != nil {
		argCount++
		query += fmt.Sprintf(", date = $%d", argCount)
		args = append(args, *input.Date)
	}

	query += ` WHERE id = $1 AND user_id = $2 
	           RETURNING id, user_id, account_id, category_id, subcategory_id,
	                     payment_method_id, credit_card_invoice_id, payable_id, related_transaction_id,
	                     description, amount, type, date, created_at, updated_at`

	var updated entity.Transaction
	err = tx.QueryRow(ctx, query, args...).Scan(
		&updated.ID, &updated.UserID, &updated.AccountID,
		&updated.CategoryID, &updated.SubcategoryID, &updated.PaymentMethodID,
		&updated.InvoiceID, &updated.PayableID, &updated.RelatedTransactionID,
		&updated.Description, &updated.Amount, &updated.Type,
		&updated.Date, &updated.CreatedAt, &updated.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to update transaction: %w", err)
	}

	// Update account balance if amount or type changed
	// Update account balance if amount, type or ACCOUNT changed
	if input.Amount != nil || input.Type != nil || input.AccountID != nil {
		// Revert result of original transaction
		originalChange := original.Amount
		if original.Type == "despesa" {
			originalChange = -originalChange
		}

		// Calculate result of updated transaction
		newChange := updated.Amount
		if updated.Type == "despesa" {
			newChange = -newChange
		}

		if original.AccountID != updated.AccountID {
			// Account changed: Revert from Old and Apply to New

			// 1. Revert from Old Account (Subtract original change)
			revertQuery := `
				UPDATE accounts
				SET balance = balance - $1, updated_at = NOW()
				WHERE id = $2 AND user_id = $3
			`
			_, err = tx.Exec(ctx, revertQuery, originalChange, original.AccountID, userID)
			if err != nil {
				return nil, fmt.Errorf("failed to revert balance from old account: %w", err)
			}

			// 2. Apply to New Account (Add new change)
			applyQuery := `
				UPDATE accounts
				SET balance = balance + $1, updated_at = NOW()
				WHERE id = $2 AND user_id = $3
			`
			_, err = tx.Exec(ctx, applyQuery, newChange, updated.AccountID, userID)
			if err != nil {
				return nil, fmt.Errorf("failed to apply balance to new account: %w", err)
			}
		} else {
			// Same Account: Apply difference
			balanceDiff := newChange - originalChange
			if balanceDiff != 0 {
				updateBalanceQuery := `
                    UPDATE accounts
                    SET balance = balance + $1, updated_at = NOW()
                    WHERE id = $2 AND user_id = $3
                `
				_, err = tx.Exec(ctx, updateBalanceQuery, balanceDiff, updated.AccountID, userID)
				if err != nil {
					return nil, fmt.Errorf("failed to update account balance: %w", err)
				}
			}
		}
	}

	// Commit transaction
	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return &updated, nil
}

func (r *TransactionRepository) Delete(ctx context.Context, id, userID string) error {
	// Get transaction first to update balance
	transaction, err := r.FindByID(ctx, id, userID)
	if err != nil {
		return err
	}

	// Start transaction
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	// Delete transaction
	deleteQuery := `DELETE FROM transactions WHERE id = $1 AND user_id = $2`
	result, err := tx.Exec(ctx, deleteQuery, id, userID)
	if err != nil {
		return fmt.Errorf("failed to delete transaction: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("transaction not found")
	}

	// Revert balance change
	balanceChange := transaction.Amount
	if transaction.Type == "despesa" {
		balanceChange = -balanceChange
	}

	updateBalanceQuery := `
		UPDATE accounts
		SET balance = balance - $1, updated_at = NOW()
		WHERE id = $2 AND user_id = $3
	`

	_, err = tx.Exec(ctx, updateBalanceQuery, balanceChange, transaction.AccountID, userID)
	if err != nil {
		return fmt.Errorf("failed to update account balance: %w", err)
	}

	// Commit transaction
	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}
