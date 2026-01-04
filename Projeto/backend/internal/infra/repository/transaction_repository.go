package repository

import (
	"context"
	"financeiro-api/internal/entity"
	"fmt"
	"strings"
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

// GetPocketParentAccountID returns the parent_account_id for a given pocket_id
func (r *TransactionRepository) GetPocketParentAccountID(ctx context.Context, pocketID string) (string, error) {
	var parentAccountID string
	err := r.db.QueryRow(ctx, "SELECT parent_account_id FROM pockets WHERE id = $1", pocketID).Scan(&parentAccountID)
	if err != nil {
		return "", fmt.Errorf("pocket not found: %w", err)
	}
	return parentAccountID, nil
}

// GetDB returns the database connection pool
func (r *TransactionRepository) GetDB() *pgxpool.Pool {
	return r.db
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
		SELECT t.id, t.user_id, t.account_id, t.pocket_id, t.category_id, t.subcategory_id, 
		       t.payment_method_id, t.credit_card_invoice_id, t.payable_id, t.related_transaction_id,
		       t.description, t.amount, t.type, t.date, t.created_at, t.updated_at,
		       c.name, c.icon, c.color,
		       a.name, a.type,
		       s.name,
		       pm.name,
		       p.name, p.pocket_type, p.parent_account_id,
		       pa.institution_name, pa.institution_type
		FROM transactions t
		LEFT JOIN categories c ON t.category_id = c.id
		LEFT JOIN accounts a ON t.account_id = a.id
		LEFT JOIN subcategories s ON t.subcategory_id = s.id
		LEFT JOIN payment_methods pm ON t.payment_method_id = pm.id
		LEFT JOIN pockets p ON t.pocket_id = p.id
		LEFT JOIN parent_accounts pa ON p.parent_account_id = pa.id
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
		query += fmt.Sprintf(" AND t.date::date >= $%d::date", argCount)
		args = append(args, filter.DateStart)
	}
	if filter.DateEnd != "" {
		argCount++
		query += fmt.Sprintf(" AND t.date::date <= $%d::date", argCount)
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
		var pocketName, pocketType, pocketParentID *string
		var paName, paType *string

		err := rows.Scan(
			&tx.ID, &tx.UserID, &tx.AccountID, &tx.PocketID, &tx.CategoryID, &tx.SubcategoryID,
			&tx.PaymentMethodID, &tx.InvoiceID, &tx.PayableID, &tx.RelatedTransactionID,
			&tx.Description, &tx.Amount, &tx.Type, &tx.Date, &tx.CreatedAt, &tx.UpdatedAt,
			&catName, &catIcon, &catColor,
			&accName, &accType,
			&subName, &pmName,
			&pocketName, &pocketType, &pocketParentID,
			&paName, &paType,
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

		// Lógica de prioridade para Nome da Conta (Instituição)
		// 1. Tenta pegar da ParentAccount (via Pocket) -> Nome correto da instituição (Ex: Banco do Brasil)
		// 2. Se não tiver, pega da Account legada (fallback)
		if paName != nil {
			tx.Account = &entity.Account{
				Name: *paName,
				Type: "bank", // Default type
			}
			if paType != nil {
				tx.Account.Type = *paType
			}
		} else if accName != nil {
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

		if pocketName != nil {
			tx.Pocket = &entity.Pocket{
				Name:            *pocketName,
				PocketType:      *pocketType,
				ParentAccountID: *pocketParentID,
			}
		}

		transactions = append(transactions, tx)
	}

	return transactions, nil
}

func (r *TransactionRepository) FindByID(ctx context.Context, id, userID string) (*entity.Transaction, error) {
	query := `
		SELECT id, user_id, account_id, pocket_id, category_id, subcategory_id,
		       payment_method_id, credit_card_invoice_id, payable_id, related_transaction_id,
		       description, amount, type, date, created_at, updated_at
		FROM transactions
		WHERE id = $1 AND user_id = $2::uuid
	`

	var tx entity.Transaction
	err := r.db.QueryRow(ctx, query, id, userID).Scan(
		&tx.ID, &tx.UserID, &tx.AccountID, &tx.PocketID, &tx.CategoryID, &tx.SubcategoryID,
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
		SELECT id, user_id, account_id, pocket_id, category_id, subcategory_id,
		       payment_method_id, credit_card_invoice_id, payable_id, related_transaction_id,
		       description, amount, type, date, is_historical, created_at, updated_at
		FROM transactions
		WHERE id = $1 AND user_id = $2::uuid
	`

	var t entity.Transaction
	err := tx.QueryRow(ctx, query, id, userID).Scan(
		&t.ID, &t.UserID, &t.AccountID, &t.PocketID, &t.CategoryID, &t.SubcategoryID,
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
	// 0. Fallback: If PocketID is nil, try to find a default pocket for the account
	if (input.PocketID == nil || *input.PocketID == "") && input.AccountID != "" {
		var defaultPocketID string

		// First, try to find pocket using parent_account_id (new structure)
		err := tx.QueryRow(ctx, "SELECT id FROM pockets WHERE parent_account_id = $1 ORDER BY created_at ASC LIMIT 1", input.AccountID).Scan(&defaultPocketID)

		if err != nil {
			// If not found, the accountID might be from the old 'accounts' table
			// Try to find if this account exists in the old structure
			var oldAccountExists bool
			err2 := tx.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM accounts WHERE id = $1)", input.AccountID).Scan(&oldAccountExists)

			if err2 == nil && oldAccountExists {
				// This is a legacy account from the old 'accounts' table
				// We need to find or create a corresponding pocket
				fmt.Printf("   ⚠️  Legacy account detected: %s\n", input.AccountID)

				// Try to find a pocket that was created for this legacy account
				// (assuming migration created pockets with same user_id)
				err3 := tx.QueryRow(ctx, `
					SELECT p.id 
					FROM pockets p
					WHERE p.user_id = $1 
					  AND p.pocket_type = 'CAIXA'
					ORDER BY p.created_at ASC 
					LIMIT 1
				`, userID).Scan(&defaultPocketID)

				if err3 == nil {
					input.PocketID = &defaultPocketID
					fmt.Printf("   ℹ️  Found default CAIXA pocket for user: %s\n", defaultPocketID)
				} else {
					fmt.Printf("   ❌  No pocket found for legacy account. Error: %v\n", err3)
					return nil, fmt.Errorf("legacy account %s has no associated pockets - please use the new pocket-based structure", input.AccountID)
				}
			} else {
				fmt.Printf("   ❌  Account %s not found in parent_accounts or accounts. Error: %v\n", input.AccountID, err)
				return nil, fmt.Errorf("account %s not found", input.AccountID)
			}
		} else {
			input.PocketID = &defaultPocketID
			fmt.Printf("   ℹ️  No PocketID provided. Auto-assigned to default pocket: %s\n", defaultPocketID)
		}
	}

	// 1. Check if transaction is retroactive (historical)
	// Only mark as historical if there's an explicit balance adjustment AND transaction is before it
	var lastAdjustmentDate *time.Time
	var err error
	isHistorical := false

	// Try to find balance adjustment for the pocket (if we have one)
	if input.PocketID != nil && *input.PocketID != "" {
		adjustmentQuery := `
			SELECT adjustment_date 
			FROM account_balance_adjustments
			WHERE pocket_id = $1
				AND deleted_at IS NULL
			ORDER BY adjustment_date DESC, created_at DESC
			LIMIT 1
		`
		err = tx.QueryRow(ctx, adjustmentQuery, *input.PocketID).Scan(&lastAdjustmentDate)
		if err != nil && err.Error() != "no rows in result set" {
			fmt.Printf("⚠️  Error checking pocket adjustments: %v\n", err)
		}
	}

	// If no pocket adjustment found, try account adjustment (legacy)
	if lastAdjustmentDate == nil && input.AccountID != "" {
		adjustmentQuery := `
			SELECT adjustment_date 
			FROM account_balance_adjustments
			WHERE account_id = $1
				AND deleted_at IS NULL
			ORDER BY adjustment_date DESC, created_at DESC
			LIMIT 1
		`
		err = tx.QueryRow(ctx, adjustmentQuery, input.AccountID).Scan(&lastAdjustmentDate)
		if err != nil && err.Error() != "no rows in result set" {
			fmt.Printf("⚠️  Error checking account adjustments: %v\n", err)
		}
	}

	// Only mark as historical if we found an adjustment AND transaction is before it
	if lastAdjustmentDate != nil {
		fmt.Printf("✅ Adjustment found: %v\n", *lastAdjustmentDate)

		// Compare dates
		tYear, tMonth, tDay := input.Date.Date()
		aYear, aMonth, aDay := lastAdjustmentDate.Date()

		transactionDate := time.Date(tYear, tMonth, tDay, 0, 0, 0, 0, time.UTC)
		adjustmentDate := time.Date(aYear, aMonth, aDay, 0, 0, 0, 0, time.UTC)

		fmt.Printf("📅 DATE COMPARISON:\n")
		fmt.Printf("   Transaction Date: %v (Original: %v)\n", transactionDate, input.Date)
		fmt.Printf("   Adjustment Date:  %v (Original: %v)\n", adjustmentDate, *lastAdjustmentDate)

		if transactionDate.Before(adjustmentDate) {
			isHistorical = true
			fmt.Printf("   ➡️  Transaction is BEFORE adjustment → is_historical = TRUE\n")
		} else if transactionDate.Equal(adjustmentDate) {
			isHistorical = false
			fmt.Printf("   ➡️  Transaction is ON adjustment day → is_historical = FALSE (forced)\n")
		} else {
			fmt.Printf("   ➡️  Transaction is AFTER adjustment → is_historical = FALSE\n")
		}
	} else {
		fmt.Printf("ℹ️  No balance adjustment found → is_historical = FALSE (will update balance)\n")
	}
	fmt.Printf("🎯 FINAL is_historical: %v\n", isHistorical)

	// 2. Insert transaction with is_historical flag and pocket_id
	query := `
		INSERT INTO transactions (
			user_id, account_id, pocket_id, category_id, subcategory_id,
			payment_method_id, description, amount, type, date, payable_id, credit_card_invoice_id,
			is_historical
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		RETURNING id, user_id, account_id, pocket_id, category_id, subcategory_id,
		          payment_method_id, credit_card_invoice_id, payable_id, related_transaction_id,
		          description, amount, type, date, created_at, updated_at
	`

	var transaction entity.Transaction

	// Use NULL for account_id if it's empty (pocket-only transactions)
	var accountIDParam interface{}
	if input.AccountID == "" {
		accountIDParam = nil
	} else {
		accountIDParam = input.AccountID
	}

	err = tx.QueryRow(ctx, query,
		userID, accountIDParam, input.PocketID, input.CategoryID, input.SubcategoryID,
		input.PaymentMethodID, input.Description, input.Amount, input.Type, input.Date, input.PayableID, input.InvoiceID,
		isHistorical,
	).Scan(
		&transaction.ID, &transaction.UserID, &transaction.AccountID, &transaction.PocketID,
		&transaction.CategoryID, &transaction.SubcategoryID, &transaction.PaymentMethodID,
		&transaction.InvoiceID, &transaction.PayableID, &transaction.RelatedTransactionID,
		&transaction.Description, &transaction.Amount, &transaction.Type,
		&transaction.Date, &transaction.CreatedAt, &transaction.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create transaction: %w", err)
	}

	// 3. Update account balance ONLY if transaction is NOT historical
	fmt.Printf("🔍 CREATE DEBUG - Transaction created\n")
	fmt.Printf("   Account ID: %s\n", input.AccountID)
	fmt.Printf("   Amount: %.2f\n", input.Amount)
	fmt.Printf("   Type: %s\n", input.Type)
	fmt.Printf("   IsHistorical: %v\n", isHistorical)

	if !isHistorical {
		balanceChange := input.Amount

		// Determine balance change based on transaction type
		if input.Type == "despesa" {
			balanceChange = -balanceChange
		} else if input.Type == "transferencia" {
			// For transfers, determine if this is source (saída) or target (entrada)
			// Source: "Transferência para [conta]" → decrease balance
			// Target: "Transferência de [conta]" → increase balance
			descLower := strings.ToLower(input.Description)
			if strings.Contains(descLower, "para") {
				// Source transaction - decrease balance
				balanceChange = -balanceChange
				fmt.Printf("   📤 Transfer OUT (source) detected\n")
			} else if strings.Contains(descLower, "de") {
				// Target transaction - increase balance
				fmt.Printf("   � Transfer IN (target) detected\n")
			} else {
				// Fallback: if description doesn't match pattern, don't change balance
				fmt.Printf("   ⚠️  Transfer type unclear from description, skipping balance update\n")
				balanceChange = 0
			}
		}

		if balanceChange != 0 {
			fmt.Printf("   ✅ UPDATING BALANCE: %.2f (original amount: %.2f, type: %s)\n", balanceChange, input.Amount, input.Type)

			// Atualizar saldo do POCKET se pocket_id foi especificado, senão atualizar ACCOUNT
			if input.PocketID != nil && *input.PocketID != "" {
				// Atualizar saldo do POCKET
				updateBalanceQuery := `
					UPDATE pockets
					SET balance = balance + $1, updated_at = NOW()
					WHERE id = $2 AND user_id = $3
				`

				result, err := tx.Exec(ctx, updateBalanceQuery, balanceChange, *input.PocketID, userID)
				if err != nil {
					return nil, fmt.Errorf("failed to update pocket balance: %w", err)
				}

				rowsAffected := result.RowsAffected()
				fmt.Printf("   ✅ POCKET balance updated successfully! Rows affected: %d\n", rowsAffected)

				if rowsAffected == 0 {
					fmt.Printf("   ⚠️  WARNING: No rows affected! Pocket might not exist or user_id mismatch\n")
				}
			} else {
				// Atualizar saldo da ACCOUNT (comportamento legado)
				updateBalanceQuery := `
					UPDATE accounts
					SET balance = balance + $1, updated_at = NOW()
					WHERE id = $2 AND user_id = $3
				`

				result, err := tx.Exec(ctx, updateBalanceQuery, balanceChange, input.AccountID, userID)
				if err != nil {
					return nil, fmt.Errorf("failed to update account balance: %w", err)
				}

				rowsAffected := result.RowsAffected()
				fmt.Printf("   ✅ ACCOUNT balance updated successfully! Rows affected: %d\n", rowsAffected)

				if rowsAffected == 0 {
					fmt.Printf("   ⚠️  WARNING: No rows affected! Account might not exist or user_id mismatch\n")
				}
			}
		}
	} else {
		fmt.Printf("   ⏭️  SKIPPING balance update (IsHistorical = true)\n")
	}

	return &transaction, nil
}

func (r *TransactionRepository) CreateTransfer(ctx context.Context, userID string, sourceInput, targetInput entity.CreateTransactionInput) (*entity.Transaction, *entity.Transaction, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	fmt.Printf("\n🔄 CREATING TRANSFER\n")
	fmt.Printf("   Source Account: %s (Amount: %.2f)\n", sourceInput.AccountID, sourceInput.Amount)
	fmt.Printf("   Target Account: %s (Amount: %.2f)\n", targetInput.AccountID, targetInput.Amount)

	// Force type to 'transferencia' for both transactions
	sourceInput.Type = "transferencia"
	targetInput.Type = "transferencia"

	// Source transaction (saída)
	sourceTx, err := r.createWithTx(ctx, tx, userID, sourceInput)
	if err != nil {
		return nil, nil, err
	}
	fmt.Printf("   ✅ Source transaction created: %s\n", sourceTx.ID)

	// Target transaction (entrada)
	targetTx, err := r.createWithTx(ctx, tx, userID, targetInput)
	if err != nil {
		return nil, nil, err
	}
	fmt.Printf("   ✅ Target transaction created: %s\n", targetTx.ID)

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

	fmt.Printf("   🔗 Transactions linked successfully\n")

	if err := tx.Commit(ctx); err != nil {
		return nil, nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	fmt.Printf("   ✅ Transfer committed successfully!\n\n")

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
		var errCheck error // use separate error var to avoid shadowing if needed, though 'err' is available

		// 1. Try POCKET adjustment first
		pocketID := ""
		if original.PocketID != nil {
			pocketID = *original.PocketID
		}
		if input.PocketID != nil && *input.PocketID != "" {
			pocketID = *input.PocketID
		}

		if pocketID != "" {
			adjustmentQuery := `
				SELECT adjustment_date 
				FROM account_balance_adjustments
				WHERE pocket_id = $1
					AND deleted_at IS NULL
				ORDER BY adjustment_date DESC, created_at DESC
				LIMIT 1
			`
			errCheck = tx.QueryRow(ctx, adjustmentQuery, pocketID).Scan(&lastAdjustmentDate)
			if errCheck != nil && errCheck.Error() != "no rows in result set" {
				return nil, fmt.Errorf("failed to check pocket balance adjustments: %w", errCheck)
			}
		}

		// 2. If no pocket adjustment, try ACCOUNT adjustment
		if lastAdjustmentDate == nil {
			accountID := ""
			if original.AccountID != nil {
				accountID = *original.AccountID
			}
			if input.AccountID != nil && *input.AccountID != "" {
				accountID = *input.AccountID
			}

			if accountID != "" {
				adjustmentQuery := `
					SELECT adjustment_date 
					FROM account_balance_adjustments
					WHERE account_id = $1
						AND deleted_at IS NULL
					ORDER BY adjustment_date DESC, created_at DESC
					LIMIT 1
				`
				errCheck = tx.QueryRow(ctx, adjustmentQuery, accountID).Scan(&lastAdjustmentDate)
				if errCheck != nil && errCheck.Error() != "no rows in result set" {
					return nil, fmt.Errorf("failed to check account balance adjustments: %w", errCheck)
				}
			}
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
	if input.PocketID != nil {
		argCount++
		query += fmt.Sprintf(", pocket_id = $%d", argCount)
		args = append(args, *input.PocketID)
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
	           RETURNING id, user_id, account_id, pocket_id, category_id, subcategory_id,
	                     payment_method_id, credit_card_invoice_id, payable_id, related_transaction_id,
	                     description, amount, type, date, is_historical, created_at, updated_at`

	var updated entity.Transaction
	err = tx.QueryRow(ctx, query, args...).Scan(
		&updated.ID, &updated.UserID, &updated.AccountID, &updated.PocketID,
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
			// 1. Calculate Original Change
			originalChange := original.Amount
			if original.Type == "despesa" {
				originalChange = -originalChange
			} else if original.Type == "transferencia" {
				if strings.Contains(strings.ToLower(original.Description), "para") {
					originalChange = -originalChange
				} else if !strings.Contains(strings.ToLower(original.Description), "de") {
					originalChange = 0
				}
			}

			// 2. Calculate New Change
			newChange := updated.Amount
			if updated.Type == "despesa" {
				newChange = -newChange
			} else if updated.Type == "transferencia" {
				if strings.Contains(strings.ToLower(updated.Description), "para") {
					newChange = -newChange
				} else if !strings.Contains(strings.ToLower(updated.Description), "de") {
					newChange = 0
				}
			}

			// 3. Determine if Location Changed (Account or Pocket)
			pocketsChanged := false
			if (original.PocketID == nil && updated.PocketID != nil) ||
				(original.PocketID != nil && updated.PocketID == nil) ||
				(original.PocketID != nil && updated.PocketID != nil && *original.PocketID != *updated.PocketID) {
				pocketsChanged = true
			}

			accountsChanged := original.AccountID != updated.AccountID

			if accountsChanged || pocketsChanged {
				// Location changed: Revert from Old and Apply to New

				// A. Revert from Old Location
				if original.PocketID != nil && *original.PocketID != "" {
					revertQuery := `UPDATE pockets SET balance = balance - $1, updated_at = NOW() WHERE id = $2 AND user_id = $3`
					if _, err := tx.Exec(ctx, revertQuery, originalChange, *original.PocketID, userID); err != nil {
						return nil, fmt.Errorf("failed to revert balance from old pocket: %w", err)
					}
				} else {
					revertQuery := `UPDATE accounts SET balance = balance - $1, updated_at = NOW() WHERE id = $2 AND user_id = $3`
					if _, err := tx.Exec(ctx, revertQuery, originalChange, original.AccountID, userID); err != nil {
						return nil, fmt.Errorf("failed to revert balance from old account: %w", err)
					}
				}

				// B. Apply to New Location
				if updated.PocketID != nil && *updated.PocketID != "" {
					applyQuery := `UPDATE pockets SET balance = balance + $1, updated_at = NOW() WHERE id = $2 AND user_id = $3`
					if _, err := tx.Exec(ctx, applyQuery, newChange, *updated.PocketID, userID); err != nil {
						return nil, fmt.Errorf("failed to apply balance to new pocket: %w", err)
					}
				} else {
					applyQuery := `UPDATE accounts SET balance = balance + $1, updated_at = NOW() WHERE id = $2 AND user_id = $3`
					if _, err := tx.Exec(ctx, applyQuery, newChange, updated.AccountID, userID); err != nil {
						return nil, fmt.Errorf("failed to apply balance to new account: %w", err)
					}
				}

			} else {
				// Same Location (Account & Pocket same), just apply difference
				diff := newChange - originalChange

				if diff != 0 {
					if updated.PocketID != nil && *updated.PocketID != "" {
						updateQuery := `UPDATE pockets SET balance = balance + $1, updated_at = NOW() WHERE id = $2 AND user_id = $3`
						if _, err := tx.Exec(ctx, updateQuery, diff, *updated.PocketID, userID); err != nil {
							return nil, fmt.Errorf("failed to update pocket balance: %w", err)
						}
					} else {
						updateQuery := `UPDATE accounts SET balance = balance + $1, updated_at = NOW() WHERE id = $2 AND user_id = $3`
						if _, err := tx.Exec(ctx, updateQuery, diff, updated.AccountID, userID); err != nil {
							return nil, fmt.Errorf("failed to update account balance: %w", err)
						}
					}
				}
			}
		}
	} else if !original.IsHistorical && updated.IsHistorical {
		// Transaction became historical: revert the balance from ORIGINAL location
		originalChange := original.Amount
		if original.Type == "despesa" {
			originalChange = -originalChange
		} else if original.Type == "transferencia" {
			if strings.Contains(strings.ToLower(original.Description), "para") {
				originalChange = -originalChange
			} else if !strings.Contains(strings.ToLower(original.Description), "de") {
				originalChange = 0
			}
		}

		if original.PocketID != nil && *original.PocketID != "" {
			revertQuery := `UPDATE pockets SET balance = balance - $1, updated_at = NOW() WHERE id = $2 AND user_id = $3`
			if _, err := tx.Exec(ctx, revertQuery, originalChange, *original.PocketID, userID); err != nil {
				return nil, fmt.Errorf("failed to revert balance from pocket (became historical): %w", err)
			}
		} else {
			revertQuery := `UPDATE accounts SET balance = balance - $1, updated_at = NOW() WHERE id = $2 AND user_id = $3`
			if _, err := tx.Exec(ctx, revertQuery, originalChange, original.AccountID, userID); err != nil {
				return nil, fmt.Errorf("failed to revert balance from account (became historical): %w", err)
			}
		}
	} else if original.IsHistorical && !updated.IsHistorical {
		// Transaction became current: apply the balance to NEW location
		newChange := updated.Amount
		if updated.Type == "despesa" {
			newChange = -newChange
		} else if updated.Type == "transferencia" {
			if strings.Contains(strings.ToLower(updated.Description), "para") {
				newChange = -newChange
			} else if !strings.Contains(strings.ToLower(updated.Description), "de") {
				newChange = 0
			}
		}

		if updated.PocketID != nil && *updated.PocketID != "" {
			applyQuery := `UPDATE pockets SET balance = balance + $1, updated_at = NOW() WHERE id = $2 AND user_id = $3`
			if _, err := tx.Exec(ctx, applyQuery, newChange, *updated.PocketID, userID); err != nil {
				return nil, fmt.Errorf("failed to apply balance to pocket (became current): %w", err)
			}
		} else {
			applyQuery := `UPDATE accounts SET balance = balance + $1, updated_at = NOW() WHERE id = $2 AND user_id = $3`
			if _, err := tx.Exec(ctx, applyQuery, newChange, updated.AccountID, userID); err != nil {
				return nil, fmt.Errorf("failed to apply balance to account (became current): %w", err)
			}
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

	fmt.Printf("🔍 DELETE DEBUG - Transaction ID: %s\n", id)
	accID := "nil"
	if t.AccountID != nil {
		accID = *t.AccountID
	}
	fmt.Printf("   Account ID: %s\n", accID)
	fmt.Printf("   Amount: %.2f\n", t.Amount)
	fmt.Printf("   Type: %s\n", t.Type)
	fmt.Printf("   IsHistorical: %v\n", t.IsHistorical)
	fmt.Printf("   RelatedTransactionID: %v\n", t.RelatedTransactionID)

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
		} else if t.Type == "transferencia" {
			// Logic for transfer reversion
			// If it was valid source (decrease), we add back (revert is subtraction of negative = addition)
			// If it was valid target (increase), we subtract (revert is subtraction of positive)

			// Note: The logic below "balance - $1" means we subtract the balanceChange.
			// So if original was -100 (despesa), we do balance - (-100) = balance + 100. Correct.
			// If original was +100 (receita), we do balance - (100) = balance - 100. Correct.

			// For transfer, we just need to reconstruct the original change.
			descLower := strings.ToLower(t.Description)
			if strings.Contains(descLower, "para") {
				// Was source (decrease), so balanceChange should be negative
				balanceChange = -balanceChange
			} else if strings.Contains(descLower, "de") {
				// Was target (increase), balanceChange remains positive
			} else {
				balanceChange = 0
			}
		}

		if balanceChange != 0 {
			fmt.Printf("   ✅ REVERTING BALANCE: %.2f (original amount: %.2f, type: %s)\n", balanceChange, t.Amount, t.Type)

			// Check if we need to revert from POCKET or ACCOUNT
			if t.PocketID != nil && *t.PocketID != "" {
				updateBalanceQuery := `
					UPDATE pockets
					SET balance = balance - $1, updated_at = NOW()
					WHERE id = $2 AND user_id = $3
				`
				if _, err := tx.Exec(ctx, updateBalanceQuery, balanceChange, *t.PocketID, userID); err != nil {
					return fmt.Errorf("failed to update pocket balance: %w", err)
				}
				fmt.Printf("   ✅ Balance reverted successfully for pocket %s\n", *t.PocketID)
			} else {
				updateBalanceQuery := `
					UPDATE accounts
					SET balance = balance - $1, updated_at = NOW()
					WHERE id = $2 AND user_id = $3
				`
				if _, err := tx.Exec(ctx, updateBalanceQuery, balanceChange, t.AccountID, userID); err != nil {
					return fmt.Errorf("failed to update account balance: %w", err)
				}
				fmt.Printf("   ✅ Balance reverted successfully for account %v\n", t.AccountID)
			}
		}
	} else {
		fmt.Printf("   ⏭️  SKIPPING balance revert (IsHistorical = true)\n")
	}
	return nil
}
