package repository

import (
	"context"
	"financeiro-api/internal/entity"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type TransactionRepository struct {
	db *pgxpool.Pool
}

func NewTransactionRepository(db *pgxpool.Pool) *TransactionRepository {
	// Ensure conflicting triggers are removed
	// This is a safety measure to prevent double balance updates (Trigger + Go Logic)
	// especially for historical transactions where the trigger doesn't respect the logic.
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		query := `
			DROP TRIGGER IF EXISTS on_transaction_change ON public.transactions;
			DROP FUNCTION IF EXISTS public.handle_balance_update();
		`
		_, err := db.Exec(ctx, query)
		if err != nil {
			fmt.Printf("WARNING: Failed to drop legacy triggers: %v\n", err)
		} else {
			fmt.Println("SUCCESS: Legacy balance triggers dropped to ensure consistency.")
		}
	}()
	return &TransactionRepository{db: db}
}

// Filtros de transação
type TransactionFilter struct {
	AccountID  string
	CategoryID string
	Type       string
	DateStart  string
	DateEnd    string
	SortBy     string
	SortOrder  string
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
		WHERE t.user_id = $1::uuid AND t.deleted_at IS NULL
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

	// Order By Logic
	orderBy := "t.date DESC, t.created_at DESC"
	if filter.SortBy != "" {
		direction := "ASC"
		if filter.SortOrder == "desc" {
			direction = "DESC"
		}

		switch filter.SortBy {
		case "date":
			orderBy = fmt.Sprintf("t.date %s, t.created_at DESC", direction)
		case "description":
			orderBy = fmt.Sprintf("t.description %s", direction)
		case "amount":
			orderBy = fmt.Sprintf("t.amount %s", direction)
		case "category":
			orderBy = fmt.Sprintf("c.name %s", direction)
		case "account":
			orderBy = fmt.Sprintf("a.name %s", direction)
		}
	}

	argCount++
	query += fmt.Sprintf(" ORDER BY %s LIMIT $%d", orderBy, argCount)
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
		WHERE id = $1 AND user_id = $2::uuid
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

func (r *TransactionRepository) findByIDWithTx(ctx context.Context, tx pgx.Tx, id, userID string) (*entity.Transaction, error) {
	query := `
		SELECT id, user_id, account_id, category_id, subcategory_id,
		       payment_method_id, credit_card_invoice_id, payable_id, related_transaction_id,
		       description, amount, type, date, is_historical, created_at, updated_at
		FROM transactions
		WHERE id = $1 AND user_id = $2::uuid
	`

	var t entity.Transaction
	err := tx.QueryRow(ctx, query, id, userID).Scan(
		&t.ID, &t.UserID, &t.AccountID, &t.CategoryID, &t.SubcategoryID,
		&t.PaymentMethodID, &t.InvoiceID, &t.PayableID, &t.RelatedTransactionID,
		&t.Description, &t.Amount, &t.Type, &t.Date, &t.IsHistorical, &t.CreatedAt, &t.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to find transaction: %w", err)
	}

	return &t, nil
}

func (r *TransactionRepository) Create(ctx context.Context, userID string, input entity.CreateTransactionInput) (*entity.Transaction, error) {
	// Start transaction
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	transaction, err := r.createWithTx(ctx, tx, userID, input)
	if err != nil {
		return nil, err
	}

	// Commit transaction
	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return transaction, nil
}

func (r *TransactionRepository) createWithTx(ctx context.Context, tx pgx.Tx, userID string, input entity.CreateTransactionInput) (*entity.Transaction, error) {
	// 1. Check if transaction is retroactive (historical)
	// Get last balance adjustment date for the account
	var lastAdjustmentDate *time.Time
	adjustmentQuery := `
		SELECT adjustment_date 
		FROM account_balance_adjustments
		WHERE account_id = $1
		ORDER BY adjustment_date DESC
		LIMIT 1
	`
	err := tx.QueryRow(ctx, adjustmentQuery, input.AccountID).Scan(&lastAdjustmentDate)
	if err != nil {
		if err.Error() == "no rows in result set" {
			// Fallback: use account creation date if no adjustment record found
			var createdAt time.Time
			err := tx.QueryRow(ctx, "SELECT created_at FROM accounts WHERE id = $1", input.AccountID).Scan(&createdAt)
			if err == nil {
				lastAdjustmentDate = &createdAt
			}
		} else {
			return nil, fmt.Errorf("failed to check balance adjustments: %w", err)
		}
	}

	// Determine if transaction is historical
	isHistorical := false
	if lastAdjustmentDate != nil {
		// If transaction date is before last adjustment, it's historical
		// Compare only the date part (ignore time)
		// Force UTC for comparison to avoid timezone issues
		// We want to compare the "Calendar Date", effectively ignoring time.
		// Using the location of the input/db dates to determine their Calendar Day.

		tYear, tMonth, tDay := input.Date.Date()
		aYear, aMonth, aDay := lastAdjustmentDate.Date()

		transactionDate := time.Date(tYear, tMonth, tDay, 0, 0, 0, 0, time.UTC)
		adjustmentDate := time.Date(aYear, aMonth, aDay, 0, 0, 0, 0, time.UTC)

		fmt.Printf("DEBUG: Tx Date: %v (Orig: %v), Adj Date: %v (Orig: %v)\n", transactionDate, input.Date, adjustmentDate, lastAdjustmentDate)

		if transactionDate.Before(adjustmentDate) {
			isHistorical = true
		}

		// Explicitly ensure same-day is NOT historical (matches user expectation)
		if transactionDate.Equal(adjustmentDate) {
			isHistorical = false
			fmt.Println("DEBUG: Transaction is on Adjustment Day -> Forcing Active (Not Historical)")
		}
	}
	fmt.Printf("DEBUG: Is Historical: %v\n", isHistorical)

	// 2. Insert transaction with is_historical flag
	query := `
		INSERT INTO transactions (
			user_id, account_id, category_id, subcategory_id,
			payment_method_id, description, amount, type, date, payable_id, credit_card_invoice_id,
			is_historical
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		RETURNING id, user_id, account_id, category_id, subcategory_id,
		          payment_method_id, credit_card_invoice_id, payable_id, related_transaction_id,
		          description, amount, type, date, created_at, updated_at
	`

	var transaction entity.Transaction
	err = tx.QueryRow(ctx, query,
		userID, input.AccountID, input.CategoryID, input.SubcategoryID,
		input.PaymentMethodID, input.Description, input.Amount, input.Type, input.Date, input.PayableID, input.InvoiceID,
		isHistorical,
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

	// 3. Update account balance ONLY if transaction is NOT historical
	if !isHistorical {
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
	}

	return &transaction, nil
}

func (r *TransactionRepository) CreateTransfer(ctx context.Context, userID string, sourceInput, targetInput entity.CreateTransactionInput) (*entity.Transaction, *entity.Transaction, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	sourceTx, err := r.createWithTx(ctx, tx, userID, sourceInput)
	if err != nil {
		return nil, nil, err
	}

	targetTx, err := r.createWithTx(ctx, tx, userID, targetInput)
	if err != nil {
		return nil, nil, err
	}

	// Link them
	linkQuery := `UPDATE transactions SET related_transaction_id = $1 WHERE id = $2`
	if _, err := tx.Exec(ctx, linkQuery, targetTx.ID, sourceTx.ID); err != nil {
		return nil, nil, fmt.Errorf("failed to link source transaction: %w", err)
	}
	if _, err := tx.Exec(ctx, linkQuery, sourceTx.ID, targetTx.ID); err != nil {
		return nil, nil, fmt.Errorf("failed to link target transaction: %w", err)
	}

	sourceTx.RelatedTransactionID = &targetTx.ID
	targetTx.RelatedTransactionID = &sourceTx.ID

	if err := tx.Commit(ctx); err != nil {
		return nil, nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return sourceTx, targetTx, nil
}

func (r *TransactionRepository) Update(ctx context.Context, id, userID string, input entity.UpdateTransactionInput) (*entity.Transaction, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	updated, err := r.updateWithTx(ctx, tx, id, userID, input, true)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return updated, nil
}

func (r *TransactionRepository) updateWithTx(ctx context.Context, tx pgx.Tx, id, userID string, input entity.UpdateTransactionInput, propagate bool) (*entity.Transaction, error) {
	// Get original transaction first
	original, err := r.findByIDWithTx(ctx, tx, id, userID)
	if err != nil {
		return nil, err
	}

	// Determine if we need to recalculate is_historical
	var newIsHistorical = original.IsHistorical
	if input.Date != nil {
		// Date changed, need to recalculate is_historical
		var lastAdjustmentDate *time.Time
		adjustmentQuery := `
			SELECT adjustment_date 
			FROM account_balance_adjustments
			WHERE account_id = $1
			ORDER BY adjustment_date DESC
			LIMIT 1
		`
		accountID := original.AccountID
		if input.AccountID != nil {
			accountID = *input.AccountID
		}

		err = tx.QueryRow(ctx, adjustmentQuery, accountID).Scan(&lastAdjustmentDate)
		if err != nil && err.Error() != "no rows in result set" {
			return nil, fmt.Errorf("failed to check balance adjustments: %w", err)
		}

		if lastAdjustmentDate != nil {
			transactionDate := time.Date(input.Date.Year(), input.Date.Month(), input.Date.Day(), 0, 0, 0, 0, input.Date.Location())
			adjustmentDate := time.Date(lastAdjustmentDate.Year(), lastAdjustmentDate.Month(), lastAdjustmentDate.Day(), 0, 0, 0, 0, lastAdjustmentDate.Location())

			newIsHistorical = transactionDate.Before(adjustmentDate)
		} else {
			newIsHistorical = false
		}
	}

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

		// Update is_historical if date changed
		argCount++
		query += fmt.Sprintf(", is_historical = $%d", argCount)
		args = append(args, newIsHistorical)
	}

	query += ` WHERE id = $1 AND user_id = $2 
	           RETURNING id, user_id, account_id, category_id, subcategory_id,
	                     payment_method_id, credit_card_invoice_id, payable_id, related_transaction_id,
	                     description, amount, type, date, is_historical, created_at, updated_at`

	var updated entity.Transaction
	err = tx.QueryRow(ctx, query, args...).Scan(
		&updated.ID, &updated.UserID, &updated.AccountID,
		&updated.CategoryID, &updated.SubcategoryID, &updated.PaymentMethodID,
		&updated.InvoiceID, &updated.PayableID, &updated.RelatedTransactionID,
		&updated.Description, &updated.Amount, &updated.Type,
		&updated.Date, &updated.IsHistorical, &updated.CreatedAt, &updated.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to update transaction: %w", err)
	}

	// Update account balance ONLY if BOTH original AND updated are NOT historical
	if !original.IsHistorical && !updated.IsHistorical {
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
	} else if !original.IsHistorical && updated.IsHistorical {
		// Transaction became historical: revert the balance
		originalChange := original.Amount
		if original.Type == "despesa" {
			originalChange = -originalChange
		}

		revertQuery := `
			UPDATE accounts
			SET balance = balance - $1, updated_at = NOW()
			WHERE id = $2 AND user_id = $3
		`
		_, err = tx.Exec(ctx, revertQuery, originalChange, original.AccountID, userID)
		if err != nil {
			return nil, fmt.Errorf("failed to revert balance (became historical): %w", err)
		}
	} else if original.IsHistorical && !updated.IsHistorical {
		// Transaction became current: apply the balance
		newChange := updated.Amount
		if updated.Type == "despesa" {
			newChange = -newChange
		}

		applyQuery := `
			UPDATE accounts
			SET balance = balance + $1, updated_at = NOW()
			WHERE id = $2 AND user_id = $3
		`
		_, err = tx.Exec(ctx, applyQuery, newChange, updated.AccountID, userID)
		if err != nil {
			return nil, fmt.Errorf("failed to apply balance (became current): %w", err)
		}
	}

	// Propagate to related transaction
	if propagate && updated.RelatedTransactionID != nil {
		relatedInput := entity.UpdateTransactionInput{}
		shouldUpdate := false

		if input.Amount != nil {
			relatedInput.Amount = input.Amount
			shouldUpdate = true
		}
		if input.Date != nil {
			relatedInput.Date = input.Date
			shouldUpdate = true
		}
		if input.Description != nil {
			relatedInput.Description = input.Description
			shouldUpdate = true
		}

		if shouldUpdate {
			_, err := r.updateWithTx(ctx, tx, *updated.RelatedTransactionID, userID, relatedInput, false)
			if err != nil {
				return nil, fmt.Errorf("failed to propagate update to related transaction: %w", err)
			}
		}
	}

	return &updated, nil
}

func (r *TransactionRepository) Delete(ctx context.Context, id, userID string) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	// Get transaction to check related
	t, err := r.findByIDWithTx(ctx, tx, id, userID)
	if err != nil {
		return err
	}

	idsToDelete := []string{id}
	if t.RelatedTransactionID != nil {
		idsToDelete = append(idsToDelete, *t.RelatedTransactionID)
	}

	for _, deleteID := range idsToDelete {
		if err := r.deleteWithTx(ctx, tx, deleteID, userID); err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

func (r *TransactionRepository) deleteWithTx(ctx context.Context, tx pgx.Tx, id, userID string) error {
	// Get transaction to check balance
	t, err := r.findByIDWithTx(ctx, tx, id, userID)
	if err != nil {
		// If not found, it might have been already deleted (if circular reference, but we only go 1 level deep)
		// Or if we are deleting related and it's missing.
		// Let's assume strict consistency.
		return err
	}

	// Delete
	deleteQuery := `DELETE FROM transactions WHERE id = $1 AND user_id = $2`
	if _, err := tx.Exec(ctx, deleteQuery, id, userID); err != nil {
		return fmt.Errorf("failed to delete transaction: %w", err)
	}

	// Revert Balance
	if !t.IsHistorical {
		balanceChange := t.Amount
		if t.Type == "despesa" {
			balanceChange = -balanceChange
		}

		updateBalanceQuery := `
			UPDATE accounts
			SET balance = balance - $1, updated_at = NOW()
			WHERE id = $2 AND user_id = $3
		`
		if _, err := tx.Exec(ctx, updateBalanceQuery, balanceChange, t.AccountID, userID); err != nil {
			return fmt.Errorf("failed to update account balance: %w", err)
		}
	}
	return nil
}
