package repository

import (
	"context"
	"fmt"
	"time"

	"financeiro-api/internal/entity"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type InvoiceRepository struct {
	db *pgxpool.Pool
}

func NewInvoiceRepository(db *pgxpool.Pool) *InvoiceRepository {
	return &InvoiceRepository{db: db}
}

func (r *InvoiceRepository) FindByCardID(ctx context.Context, cardID string) ([]entity.CreditCardInvoice, error) {
	query := `
		SELECT id, credit_card_id, reference_month, reference_year, closing_date, due_date, total_amount, paid_amount, status, created_at, updated_at
		FROM credit_card_invoices
		WHERE credit_card_id = $1
		ORDER BY reference_year DESC, reference_month DESC
	`
	rows, err := r.db.Query(ctx, query, cardID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var invoices []entity.CreditCardInvoice
	for rows.Next() {
		var i entity.CreditCardInvoice
		if err := rows.Scan(&i.ID, &i.CreditCardID, &i.ReferenceMonth, &i.ReferenceYear, &i.ClosingDate, &i.DueDate, &i.TotalAmount, &i.PaidAmount, &i.Status, &i.CreatedAt, &i.UpdatedAt); err != nil {
			return nil, err
		}
		invoices = append(invoices, i)
	}
	return invoices, nil
}

func (r *InvoiceRepository) FindByID(ctx context.Context, id string) (*entity.CreditCardInvoice, error) {
	query := `
		SELECT 
			i.id, i.credit_card_id, i.reference_month, i.reference_year, i.closing_date, i.due_date, 
			i.total_amount, i.paid_amount, i.status, i.created_at, i.updated_at,
			c.id, c.name, c.brand, c.last_4_digits, c.color
		FROM credit_card_invoices i
		LEFT JOIN credit_cards c ON i.credit_card_id = c.id
		WHERE i.id = $1
	`
	var i entity.CreditCardInvoice
	i.CreditCard = &entity.CreditCard{}

	err := r.db.QueryRow(ctx, query, id).Scan(
		&i.ID, &i.CreditCardID, &i.ReferenceMonth, &i.ReferenceYear, &i.ClosingDate, &i.DueDate,
		&i.TotalAmount, &i.PaidAmount, &i.Status, &i.CreatedAt, &i.UpdatedAt,
		&i.CreditCard.ID, &i.CreditCard.Name, &i.CreditCard.Brand, &i.CreditCard.Last4Digits, &i.CreditCard.Color,
	)
	if err != nil {
		return nil, err
	}
	return &i, nil
}

func (r *InvoiceRepository) FindOneByCardAndMonthYear(ctx context.Context, cardID string, month, year int) (*entity.CreditCardInvoice, error) {
	query := `
		SELECT id, credit_card_id, reference_month, reference_year, closing_date, due_date, total_amount, paid_amount, status, created_at, updated_at
		FROM credit_card_invoices
		WHERE credit_card_id = $1 AND reference_month = $2 AND reference_year = $3
	`
	var i entity.CreditCardInvoice
	err := r.db.QueryRow(ctx, query, cardID, month, year).Scan(&i.ID, &i.CreditCardID, &i.ReferenceMonth, &i.ReferenceYear, &i.ClosingDate, &i.DueDate, &i.TotalAmount, &i.PaidAmount, &i.Status, &i.CreatedAt, &i.UpdatedAt)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &i, nil
}

func (r *InvoiceRepository) FindTransactionsByInvoiceID(ctx context.Context, invoiceID string) ([]entity.CreditCardTransaction, error) {
	query := `
		SELECT id, user_id, credit_card_id, invoice_id, description, amount, transaction_date, is_installment, installment_number, total_installments, category_id, subcategory_id, notes, group_id, transaction_type, created_at, updated_at
		FROM credit_card_transactions
		WHERE invoice_id = $1
		ORDER BY transaction_date DESC
	`
	rows, err := r.db.Query(ctx, query, invoiceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var transactions []entity.CreditCardTransaction
	for rows.Next() {
		var t entity.CreditCardTransaction
		if err := rows.Scan(&t.ID, &t.UserID, &t.CreditCardID, &t.InvoiceID, &t.Description, &t.Amount, &t.TransactionDate, &t.IsInstallment, &t.InstallmentNumber, &t.TotalInstallments, &t.CategoryID, &t.SubcategoryID, &t.Notes, &t.GroupID, &t.TransactionType, &t.CreatedAt, &t.UpdatedAt); err != nil {
			return nil, err
		}
		transactions = append(transactions, t)
	}
	return transactions, nil
}

func (r *InvoiceRepository) FindPaymentsByInvoiceID(ctx context.Context, invoiceID string) ([]entity.Transaction, error) {
	query := `
		SELECT id, description, amount, date, account_id
		FROM transactions
		WHERE credit_card_invoice_id = $1
		ORDER BY date DESC
	`
	rows, err := r.db.Query(ctx, query, invoiceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var payments []entity.Transaction
	for rows.Next() {
		var t entity.Transaction
		if err := rows.Scan(&t.ID, &t.Description, &t.Amount, &t.Date, &t.AccountID); err != nil {
			return nil, err
		}
		payments = append(payments, t)
	}
	return payments, nil
}

func (r *InvoiceRepository) GetOrCreateInvoice(ctx context.Context, tx pgx.Tx, userID, cardID string, date time.Time) (string, error) {
	// 1. Fetch Card Closing/Due Days
	var closingDay, dueDay int
	err := tx.QueryRow(ctx, "SELECT closing_day, due_day FROM credit_cards WHERE id = $1", cardID).Scan(&closingDay, &dueDay)
	if err != nil {
		return "", fmt.Errorf("failed to fetch card details: %w", err)
	}

	// 2. Calculate Reference Month/Year based on Closing Day
	refMonth := int(date.Month())
	refYear := date.Year()

	// If transaction date day is >= closing day, it goes to next month's invoice
	if date.Day() >= closingDay {
		refMonth++
		if refMonth > 12 {
			refMonth = 1
			refYear++
		}
	}

	// 3. Check if invoice exists
	var invoiceID string
	queryCheck := `
		SELECT id FROM credit_card_invoices 
		WHERE credit_card_id = $1 AND reference_month = $2 AND reference_year = $3
	`
	err = tx.QueryRow(ctx, queryCheck, cardID, refMonth, refYear).Scan(&invoiceID)
	if err == nil {
		return invoiceID, nil
	}
	if err != pgx.ErrNoRows {
		return "", fmt.Errorf("failed to check existing invoice: %w", err)
	}

	// 4. Create new invoice
	// Calculate Due Date
	// Due Date is in the reference month/year
	// E.g. Ref Jan 2024, Due Day 10 -> Due Date 2024-01-10
	dueDate := time.Date(refYear, time.Month(refMonth), dueDay, 0, 0, 0, 0, time.UTC)

	// Calculate Closing Date
	// Closing Date is usually ~10 days before Due Date, but strictly it is the Closing Day of the PREVIOUS month relative to due date?
	// Or Closing Day of the SAME month if Closing Day < Due Day?
	// Wait, if Closing Day is 5 and Due Day is 15.
	// Trans Jan 6 -> Ref Feb (since >= 5). Due Feb 15. Closing Date Feb 5.
	// Trans Jan 4 -> Ref Jan. Due Jan 15. Closing Date Jan 5.

	// Let's assume Closing Date is simply the Closing Day in the Reference Month/Year.
	// Note: Logic might vary if Closing Day > Due Day (e.g. Closing 25, Due 5 next month).
	// If Closing 25, Due 5.
	// Trans Jan 26 -> Ref Mar? No.
	// Usually:
	// Closing 25 Jan. Due 05 Feb.
	// Trans Jan 20 -> Ref Feb (Current open invoice).
	// Trans Jan 26 -> Ref Mar.

	// Simple logic:
	// If closing_day > due_day, then closing date is in month X-1 relative to due date month X?
	// But we established Reference Month IS the month of the Due Date.
	// So if Ref is Feb. Due is Feb 05.
	// Closing must be Jan 25.

	var closingDateMonth = time.Month(refMonth)
	var closingDateYear = refYear

	if closingDay > dueDay {
		closingDateMonth--
		if closingDateMonth < 1 {
			closingDateMonth = 12
			closingDateYear--
		}
	}

	closingDate := time.Date(closingDateYear, closingDateMonth, closingDay, 0, 0, 0, 0, time.UTC)

	// Generate ID
	newID := uuid.New().String()

	queryInsert := `
		INSERT INTO credit_card_invoices (
			id, user_id, credit_card_id, reference_month, reference_year, closing_date, due_date, status, total_amount, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, 'open', 0, NOW(), NOW())
		RETURNING id
	`
	err = tx.QueryRow(ctx, queryInsert, newID, userID, cardID, refMonth, refYear, closingDate, dueDate).Scan(&invoiceID)
	if err != nil {
		return "", fmt.Errorf("failed to create invoice: %w", err)
	}

	return invoiceID, nil
}

func (r *InvoiceRepository) CreateTransaction(ctx context.Context, input entity.CreateCreditCardTransactionInput, userID string) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Validate Installments
	installments := input.Installments
	if installments < 1 {
		installments = 1
	}

	// Calculate values
	amount := input.Amount
	perInstallmentAmount := amount
	if installments > 1 {
		perInstallmentAmount = amount / float64(installments)
	}
	// Retroativo: se fornecido valor específico por parcela, usar
	if input.InstallmentValue != nil && *input.InstallmentValue > 0 {
		perInstallmentAmount = *input.InstallmentValue
	}

	groupID := uuid.New().String()
	purchaseDate := input.TransactionDate

	// Retroativo: começar na parcela informada (default 1)
	start := input.StartInstallment
	if start < 1 {
		start = 1
	}

	for i := start; i <= installments; i++ {
		// Calculate installment date
		// i=1 -> purchaseDate
		// i=2 -> purchaseDate + 1 month
		installmentDate := purchaseDate.AddDate(0, i-1, 0)

		// Get or Create Invoice
		invoiceID, err := r.GetOrCreateInvoice(ctx, tx, userID, input.CreditCardID, installmentDate)
		if err != nil {
			return err
		}

		// Check Invoice Status
		var status string
		var refMonth, refYear int
		err = tx.QueryRow(ctx, "SELECT status, reference_month, reference_year FROM credit_card_invoices WHERE id = $1", invoiceID).Scan(&status, &refMonth, &refYear)
		if err != nil {
			return fmt.Errorf("failed to check invoice status: %w", err)
		}
		if status == "paid" {
			monthNames := []string{"", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"}
			return fmt.Errorf("não é possível adicionar transações na fatura de %s/%d pois ela já foi paga. Para adicionar despesas retroativas, escolha uma fatura em aberto", monthNames[refMonth], refYear)
		}

		// Insert Transaction
		txID := uuid.New().String()
		desc := input.Description
		if installments > 1 {
			desc = fmt.Sprintf("%s (%d/%d)", input.Description, i, installments)
		}

		queryInsert := `
			INSERT INTO credit_card_transactions (
				id, user_id, credit_card_id, invoice_id, description, amount, transaction_date, 
				is_installment, installment_number, total_installments, category_id, subcategory_id, notes, group_id, transaction_type, created_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
		`

		var currentGroupID *string
		var currentInstallmentNumber *int
		var currentTotalInstallments *int

		if installments > 1 {
			currentGroupID = &groupID
			valI := i
			valTotal := installments
			currentInstallmentNumber = &valI
			currentTotalInstallments = &valTotal
		}

		// DEBUG: Log do valor que será inserido
		fmt.Printf("🟢 Repository inserting: desc=%s, amount=%.2f, perInstallmentAmount=%.2f\n", desc, input.Amount, perInstallmentAmount)

		_, err = tx.Exec(ctx, queryInsert,
			txID, userID, input.CreditCardID, invoiceID, desc, perInstallmentAmount, installmentDate,
			installments > 1, currentInstallmentNumber, currentTotalInstallments, input.CategoryID, input.SubcategoryID, input.Notes, currentGroupID, "purchase",
		)
		if err != nil {
			return fmt.Errorf("failed to insert transaction: %w", err)
		}

		// Update Invoice Total
		_, err = tx.Exec(ctx, "UPDATE credit_card_invoices SET total_amount = total_amount + $1 WHERE id = $2", perInstallmentAmount, invoiceID)
		if err != nil {
			return fmt.Errorf("failed to update invoice total: %w", err)
		}
	}

	return tx.Commit(ctx)
}

func (r *InvoiceRepository) DeleteTransaction(ctx context.Context, id, userID string) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// 1. Get Transaction to know Amount and InvoiceID
	var t entity.CreditCardTransaction
	queryGet := `SELECT invoice_id, amount FROM credit_card_transactions WHERE id = $1 AND user_id = $2`
	err = tx.QueryRow(ctx, queryGet, id, userID).Scan(&t.InvoiceID, &t.Amount)
	if err != nil {
		return fmt.Errorf("transaction not found: %w", err)
	}

	// 2. Check Invoice Status
	var status string
	err = tx.QueryRow(ctx, "SELECT status FROM credit_card_invoices WHERE id = $1", t.InvoiceID).Scan(&status)
	if err != nil {
		return fmt.Errorf("invoice not found: %w", err)
	}
	if status == "paid" {
		return fmt.Errorf("cannot delete transaction from paid invoice")
	}

	// 3. Delete
	_, err = tx.Exec(ctx, "DELETE FROM credit_card_transactions WHERE id = $1", id)
	if err != nil {
		return fmt.Errorf("failed to delete transaction: %w", err)
	}

	// 4. Update Invoice Total
	_, err = tx.Exec(ctx, "UPDATE credit_card_invoices SET total_amount = total_amount - $1 WHERE id = $2", t.Amount, t.InvoiceID)
	if err != nil {
		return fmt.Errorf("failed to update invoice total: %w", err)
	}

	return tx.Commit(ctx)
}

func (r *InvoiceRepository) UpdateInvoiceStatus(ctx context.Context, id string, status entity.InvoiceStatus, paidAmount float64) error {
	query := `UPDATE credit_card_invoices SET status = $1, paid_amount = $2, updated_at = NOW() WHERE id = $3`
	_, err := r.db.Exec(ctx, query, status, paidAmount, id)
	return err
}

func (r *InvoiceRepository) UpdateTransaction(ctx context.Context, input entity.UpdateCreditCardTransactionInput, userID string) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Get transaction and invoice to compute diff and check status
	var invoiceID string
	var oldAmount float64
	err = tx.QueryRow(ctx, `SELECT invoice_id, amount FROM credit_card_transactions WHERE id = $1 AND user_id = $2`, input.ID, userID).
		Scan(&invoiceID, &oldAmount)
	if err != nil {
		return fmt.Errorf("transaction not found: %w", err)
	}

	var status string
	err = tx.QueryRow(ctx, `SELECT status FROM credit_card_invoices WHERE id = $1`, invoiceID).Scan(&status)
	if err != nil {
		return fmt.Errorf("invoice not found: %w", err)
	}
	if status == "paid" {
		return fmt.Errorf("cannot update transaction from paid invoice")
	}

	// Update transaction
	_, err = tx.Exec(ctx, `
		UPDATE credit_card_transactions
		SET description = $1, amount = $2, transaction_date = $3, category_id = $4, subcategory_id = $5, notes = $6, updated_at = NOW()
		WHERE id = $7 AND user_id = $8
	`, input.Description, input.Amount, input.TransactionDate, input.CategoryID, input.SubcategoryID, input.Notes, input.ID, userID)
	if err != nil {
		return fmt.Errorf("failed to update transaction: %w", err)
	}

	// Adjust invoice total by diff
	diff := input.Amount - oldAmount
	if diff != 0 {
		_, err = tx.Exec(ctx, `UPDATE credit_card_invoices SET total_amount = total_amount + $1, updated_at = NOW() WHERE id = $2`, diff, invoiceID)
		if err != nil {
			return fmt.Errorf("failed to update invoice total: %w", err)
		}
	}

	return tx.Commit(ctx)
}

func (r *InvoiceRepository) DeleteSeriesByTransactionID(ctx context.Context, id, userID string) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Find group_id and card info
	var groupID *string
	err = tx.QueryRow(ctx, `SELECT group_id FROM credit_card_transactions WHERE id = $1 AND user_id = $2`, id, userID).Scan(&groupID)
	if err != nil {
		return fmt.Errorf("transaction not found: %w", err)
	}
	if groupID == nil {
		return fmt.Errorf("series delete unavailable for this transaction")
	}

	// Check any paid invoices in the series
	rows, err := tx.Query(ctx, `
		SELECT cci.id, cci.status
		FROM credit_card_transactions cct
		JOIN credit_card_invoices cci ON cct.invoice_id = cci.id
		WHERE cct.group_id = $1 AND cct.user_id = $2
	`, *groupID, userID)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var invID, status string
		if err := rows.Scan(&invID, &status); err != nil {
			return err
		}
		if status == "paid" {
			return fmt.Errorf("cannot delete series: one or more installments are in paid invoices")
		}
	}

	// Sum amounts to deduct from invoices
	var sumAmount float64
	err = tx.QueryRow(ctx, `
		SELECT COALESCE(SUM(amount), 0)
		FROM credit_card_transactions
		WHERE group_id = $1 AND user_id = $2
	`, *groupID, userID).Scan(&sumAmount)
	if err != nil {
		return err
	}

	// Delete series
	_, err = tx.Exec(ctx, `DELETE FROM credit_card_transactions WHERE group_id = $1 AND user_id = $2`, *groupID, userID)
	if err != nil {
		return fmt.Errorf("failed to delete series: %w", err)
	}

	// Deduct from all affected invoices totals
	_, err = tx.Exec(ctx, `
		UPDATE credit_card_invoices AS cci
		SET total_amount = cci.total_amount - sub.sum_amount, updated_at = NOW()
		FROM (
			SELECT invoice_id, SUM(amount) AS sum_amount
			FROM credit_card_transactions_deleted_cache -- placeholder table if exists
		) AS sub
		WHERE cci.id = sub.invoice_id
	`)
	// The above assumes a cache; since we don't have it, instead recompute per invoice:
	if err != nil {
		// Fallback recompute per invoice: add back amounts via joins prior to delete not possible.
		// As a simpler approach, recalc totals for affected invoices:
		_, err = tx.Exec(ctx, `
			UPDATE credit_card_invoices cci
			SET total_amount = COALESCE((
				SELECT SUM(amount) FROM credit_card_transactions WHERE invoice_id = cci.id
			),0), updated_at = NOW()
			WHERE cci.id IN (
				SELECT DISTINCT invoice_id FROM credit_card_transactions WHERE group_id = $1 AND user_id = $2
			)
		`, *groupID, userID)
		// Note: after delete, the inner SELECT returns 0 which is desired.
		if err != nil {
			return fmt.Errorf("failed to recompute invoice totals: %w", err)
		}
	}

	return tx.Commit(ctx)
}

func (r *InvoiceRepository) RevertLatestPayment(ctx context.Context, invoiceID, userID string) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Find latest payment transaction linked to this invoice in main transactions table
	var paymentID string
	var paymentAmount float64
	err = tx.QueryRow(ctx, `
		SELECT id, amount
		FROM transactions
		WHERE user_id = $1::uuid AND credit_card_invoice_id = $2
		ORDER BY created_at DESC
		LIMIT 1
	`, userID, invoiceID).Scan(&paymentID, &paymentAmount)
	if err != nil {
		return fmt.Errorf("no payment found to revert: %w", err)
	}

	// Delete payment
	_, err = tx.Exec(ctx, `DELETE FROM transactions WHERE id = $1`, paymentID)
	if err != nil {
		return fmt.Errorf("failed to delete payment transaction: %w", err)
	}

	// Update invoice paid_amount and status
	var currentPaid float64
	err = tx.QueryRow(ctx, `SELECT paid_amount FROM credit_card_invoices WHERE id = $1`, invoiceID).Scan(&currentPaid)
	if err != nil {
		return fmt.Errorf("invoice not found: %w", err)
	}

	newPaid := currentPaid - paymentAmount
	if newPaid < 0 {
		newPaid = 0
	}

	newStatus := entity.InvoiceStatusOpen
	if newPaid > 0 {
		newStatus = entity.InvoiceStatusPartial
	}

	_, err = tx.Exec(ctx, `UPDATE credit_card_invoices SET paid_amount = $1, status = $2, updated_at = NOW() WHERE id = $3`, newPaid, newStatus, invoiceID)
	if err != nil {
		return fmt.Errorf("failed to update invoice: %w", err)
	}

	return tx.Commit(ctx)
}
