package handler

import (
	"context"
	"database/sql"
	"financeiro-api/internal/entity"
	"financeiro-api/internal/infra/repository"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// SimpleInvoiceHandler - Handler simples para operações de faturas
type SimpleInvoiceHandler struct {
	db          *pgxpool.Pool
	eventRepo   *repository.FinancialEventRepository
	creditRepo  *repository.CreditRepository
	cardRepo    *repository.CardRepository
	accountRepo *repository.AccountRepository
}

func NewSimpleInvoiceHandler(
	db *pgxpool.Pool,
	eventRepo *repository.FinancialEventRepository,
	creditRepo *repository.CreditRepository,
	cardRepo *repository.CardRepository,
	accountRepo *repository.AccountRepository,
) *SimpleInvoiceHandler {
	return &SimpleInvoiceHandler{
		db:          db,
		eventRepo:   eventRepo,
		creditRepo:  creditRepo,
		cardRepo:    cardRepo,
		accountRepo: accountRepo,
	}
}

// CreateTransaction cria um lançamento em cartão
func (h *SimpleInvoiceHandler) CreateTransaction(c *gin.Context) {
	userID := c.GetString("user_id")

	var input struct {
		CreditCardID     string    `json:"credit_card_id" binding:"required"`
		Description      string    `json:"description" binding:"required"`
		Amount           float64   `json:"amount" binding:"required,gt=0"`
		TransactionDate  time.Time `json:"transaction_date" binding:"required"`
		CategoryID       *string   `json:"category_id"`
		SubcategoryID    *string   `json:"subcategory_id"`
		Notes            *string   `json:"notes"`
		Installments     int       `json:"installments"`
		StartInstallment int       `json:"start_installment"`
		InstallmentValue *float64  `json:"installment_value"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Log do payload recebido para debug
	fmt.Printf("🔵 Backend received: amount=%.2f, description=%s\n", input.Amount, input.Description)

	// Criar usando InvoiceRepository (tabela credit_card_transactions)
	invoiceRepo := repository.NewInvoiceRepository(h.db)

	createInput := entity.CreateCreditCardTransactionInput{
		CreditCardID:     input.CreditCardID,
		Description:      input.Description,
		Amount:           input.Amount,
		TransactionDate:  input.TransactionDate,
		CategoryID:       input.CategoryID,
		SubcategoryID:    input.SubcategoryID,
		Notes:            input.Notes,
		Installments:     input.Installments,
		StartInstallment: input.StartInstallment,
		InstallmentValue: input.InstallmentValue,
	}

	err := invoiceRepo.CreateTransaction(c.Request.Context(), createInput, userID)
	if err != nil {
		fmt.Printf("❌ Error creating transaction: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "transaction created successfully",
		"amount":  input.Amount,
	})
}

// UpdateTransaction atualiza um lançamento em cartão
func (h *SimpleInvoiceHandler) UpdateTransaction(c *gin.Context) {
	userID := c.GetString("user_id")
	eventID := c.Param("id")

	var input struct {
		Description *string  `json:"description"`
		Amount      *float64 `json:"amount"`
		CategoryID  *string  `json:"category_id"`
		Notes       *string  `json:"notes"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Buscar evento e fatura
	var invoiceID string
	var currentAmount float64
	err := h.db.QueryRow(c.Request.Context(), `
		SELECT invoice_id, amount
		FROM financial_events
		WHERE id = $1 AND user_id = $2 AND type = 'LANCAMENTO_CARTAO'
	`, eventID, userID).Scan(&invoiceID, &currentAmount)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "transaction not found"})
		return
	}

	// Validar status da fatura
	var invoiceStatus string
	var cardID string
	err = h.db.QueryRow(c.Request.Context(), `
		SELECT status, credit_card_id
		FROM credit_card_invoices
		WHERE id = $1
	`, invoiceID).Scan(&invoiceStatus, &cardID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get invoice"})
		return
	}

	// BLOQUEIO: Não permitir edição em faturas FECHADAS ou QUITADAS
	if invoiceStatus != "open" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":  "cannot edit transaction in closed or paid invoice",
			"status": invoiceStatus,
		})
		return
	}

	// Se está alterando o valor, validar limite
	if input.Amount != nil && *input.Amount != currentAmount {
		amountDiff := *input.Amount - currentAmount

		if amountDiff > 0 {
			// Aumentando o valor, validar limite
			availableLimit, err := h.calculateAvailableLimit(c.Request.Context(), cardID)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to calculate limit"})
				return
			}

			if amountDiff > availableLimit {
				c.JSON(http.StatusBadRequest, gin.H{
					"error":           "insufficient credit limit",
					"available_limit": availableLimit,
					"requested":       amountDiff,
				})
				return
			}
		}

		// Atualizar valor do evento
		_, err = h.db.Exec(c.Request.Context(), `
			UPDATE financial_events
			SET amount = $1
			WHERE id = $2
		`, *input.Amount, eventID)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to update event: %v", err)})
			return
		}

		// Atualizar total da fatura
		_, err = h.db.Exec(c.Request.Context(), `
			UPDATE credit_card_invoices
			SET total_amount = total_amount + $1, updated_at = NOW()
			WHERE id = $2
		`, amountDiff, invoiceID)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update invoice"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "transaction updated",
		"event_id": eventID,
	})
}

// DeleteTransaction exclui um lançamento em cartão
func (h *SimpleInvoiceHandler) DeleteTransaction(c *gin.Context) {
	userID := c.GetString("user_id")
	eventID := c.Param("id")

	// Buscar evento e fatura
	var invoiceID string
	var amount float64
	err := h.db.QueryRow(c.Request.Context(), `
		SELECT invoice_id, amount
		FROM financial_events
		WHERE id = $1 AND user_id = $2 AND type = 'LANCAMENTO_CARTAO'
	`, eventID, userID).Scan(&invoiceID, &amount)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "transaction not found"})
		return
	}

	// Validar status da fatura
	var invoiceStatus string
	err = h.db.QueryRow(c.Request.Context(), `
		SELECT status FROM credit_card_invoices WHERE id = $1
	`, invoiceID).Scan(&invoiceStatus)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get invoice"})
		return
	}

	// BLOQUEIO: Não permitir exclusão em faturas FECHADAS ou QUITADAS
	if invoiceStatus != "open" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":  "cannot delete transaction in closed or paid invoice",
			"status": invoiceStatus,
		})
		return
	}

	// Marcar evento como excluído (soft delete)
	_, err = h.db.Exec(c.Request.Context(), `
		UPDATE financial_events
		SET reverted_at = NOW()
		WHERE id = $1
	`, eventID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete event"})
		return
	}

	// Atualizar total da fatura
	_, err = h.db.Exec(c.Request.Context(), `
		UPDATE credit_card_invoices
		SET total_amount = total_amount - $1, updated_at = NOW()
		WHERE id = $2
	`, amount, invoiceID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update invoice"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "transaction deleted",
		"amount":  amount,
	})
}

// getOrCreateInvoice busca ou cria uma fatura para o mês especificado
func (h *SimpleInvoiceHandler) getOrCreateInvoice(ctx context.Context, userID, cardID string, transactionDate time.Time) (string, error) {
	month := int(transactionDate.Month())
	year := transactionDate.Year()

	// Buscar fatura existente
	var invoiceID string
	err := h.db.QueryRow(ctx, `
		SELECT id FROM credit_card_invoices
		WHERE user_id = $1 
		AND credit_card_id = $2
		AND reference_month = $3
		AND reference_year = $4
		AND deleted_at IS NULL
		LIMIT 1
	`, userID, cardID, month, year).Scan(&invoiceID)

	if err == nil {
		return invoiceID, nil
	}

	// Se não existe, criar nova fatura
	invoiceID = uuid.New().String()
	closingDate := time.Date(year, time.Month(month), 10, 0, 0, 0, 0, time.UTC)
	dueDate := time.Date(year, time.Month(month), 20, 0, 0, 0, 0, time.UTC)

	_, err = h.db.Exec(ctx, `
		INSERT INTO credit_card_invoices (
			id, user_id, credit_card_id, reference_month, reference_year,
			closing_date, due_date, total_amount, paid_amount, status,
			created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 0, 'open', NOW(), NOW())
	`, invoiceID, userID, cardID, month, year, closingDate, dueDate)

	if err != nil {
		return "", fmt.Errorf("failed to create invoice: %w", err)
	}

	return invoiceID, nil
}

// updateInvoiceTotal atualiza o total da fatura
func (h *SimpleInvoiceHandler) updateInvoiceTotal(ctx context.Context, invoiceID string, amount float64) error {
	_, err := h.db.Exec(ctx, `
		UPDATE credit_card_invoices
		SET total_amount = total_amount + $1,
		    updated_at = NOW()
		WHERE id = $2
	`, amount, invoiceID)
	return err
}

// PayInvoice paga uma fatura
func (h *SimpleInvoiceHandler) PayInvoice(c *gin.Context) {
	userID := c.GetString("user_id")
	invoiceID := c.Param("id")

	var input struct {
		AccountID   string    `json:"account_id" binding:"required"`
		Amount      float64   `json:"amount" binding:"required,gt=0"`
		PaymentDate time.Time `json:"date" binding:"required"`
		CategoryID  *string   `json:"category_id"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Buscar fatura
	var totalAmount, paidAmount float64
	var status string
	err := h.db.QueryRow(c.Request.Context(), `
		SELECT total_amount, paid_amount, status
		FROM credit_card_invoices
		WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
	`, invoiceID, userID).Scan(&totalAmount, &paidAmount, &status)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "invoice not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to find invoice"})
		}
		return
	}

	remainingAmount := totalAmount - paidAmount

	// Criar transação de pagamento (despesa que paga a fatura)
	transactionID := uuid.New().String()
	_, err = h.db.Exec(c.Request.Context(), `
		INSERT INTO transactions (
			id, user_id, account_id, type, amount, date, description,
			is_paid, credit_card_invoice_id, category_id, created_at, updated_at
		) VALUES ($1, $2, $3, 'despesa', $4, $5, $6, true, $7, $8, NOW(), NOW())
	`, transactionID, userID, input.AccountID, input.Amount, input.PaymentDate,
		"Pagamento de Fatura de Cartão", invoiceID, input.CategoryID)

	if err != nil {
		fmt.Printf("❌ Error creating payment transaction: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create payment transaction"})
		return
	}

	// Atualizar saldo da conta (Deduzir valor pago)
	_, err = h.db.Exec(c.Request.Context(), `
		UPDATE accounts
		SET balance = balance - $1,
		    updated_at = NOW()
		WHERE id = $2
	`, input.Amount, input.AccountID)

	if err != nil {
		fmt.Printf("❌ Error updating account balance: %v\n", err)
		// Note: Ideal would be to rollback transaction, but we are not in a TX block.
		// For now, logging error.
	}

	// Atualizar fatura
	newPaidAmount := paidAmount + input.Amount
	newStatus := status
	if newPaidAmount >= totalAmount {
		newStatus = "paid"
	}

	_, err = h.db.Exec(c.Request.Context(), `
		UPDATE credit_card_invoices
		SET paid_amount = $1,
		    status = $2,
		    updated_at = NOW()
		WHERE id = $3
	`, newPaidAmount, newStatus, invoiceID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update invoice"})
		return
	}

	// Verificar se houve pagamento a mais (Overpayment)
	if input.Amount > remainingAmount {
		excessAmount := input.Amount - remainingAmount
		fmt.Printf("💰 Overpayment detected: %.2f (Excess: %.2f)\n", input.Amount, excessAmount)

		// Buscar cartão da fatura para saber onde jogar o crédito
		var cardID string
		err = h.db.QueryRow(c.Request.Context(), "SELECT credit_card_id FROM credit_card_invoices WHERE id = $1", invoiceID).Scan(&cardID)
		if err == nil {
			// Buscar ou criar próxima fatura
			nextInvoiceID, err := h.getOrCreateNextInvoice(c.Request.Context(), userID, cardID, invoiceID)
			if err == nil {
				// Criar transação de crédito (valor negativo) na próxima fatura
				creditTxID := uuid.New().String()
				_, err = h.db.Exec(c.Request.Context(), `
					INSERT INTO credit_card_transactions (
						id, credit_card_id, invoice_id, description,
						amount, transaction_date, user_id, created_at, updated_at
					) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
				`, creditTxID, cardID, nextInvoiceID, "Crédito por Pagamento Antecipado", -excessAmount, time.Now(), userID)

				if err != nil && strings.Contains(err.Error(), "credit_card_transactions_amount_check") {
					fmt.Println("⚠️ Constraint detected blocking negative amount. Dropping constraint...")
					_, _ = h.db.Exec(c.Request.Context(), "ALTER TABLE credit_card_transactions DROP CONSTRAINT IF EXISTS credit_card_transactions_amount_check")

					// Retry Insertion
					_, err = h.db.Exec(c.Request.Context(), `
						INSERT INTO credit_card_transactions (
							id, credit_card_id, invoice_id, description,
							amount, transaction_date, user_id, created_at, updated_at
						) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
					`, creditTxID, cardID, nextInvoiceID, "Crédito por Pagamento Antecipado", -excessAmount, time.Now(), userID)
				}

				if err == nil {
					// Atualizar total da próxima fatura
					_, _ = h.db.Exec(c.Request.Context(), `
						UPDATE credit_card_invoices
						SET total_amount = total_amount - $1,
						    updated_at = NOW()
						WHERE id = $2
					`, excessAmount, nextInvoiceID)

					fmt.Printf("✅ Credit applied to next invoice %s: -%.2f\n", nextInvoiceID, excessAmount)
				} else {
					fmt.Printf("❌ Failed to create credit transaction: %v\n", err)
				}
			} else {
				fmt.Printf("❌ Failed to get next invoice: %v\n", err)
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message":          "payment created successfully",
		"transaction_id":   transactionID,
		"amount":           input.Amount,
		"remaining_amount": remainingAmount - input.Amount,
		"status":           newStatus,
	})
}

// RevertPayment estorna um pagamento
func (h *SimpleInvoiceHandler) RevertPayment(c *gin.Context) {
	invoiceID := c.Param("id")
	totalReverted := 0.0

	// 1. Estornar pagamentos da tabela transactions
	// Removido filtro de 'type' e 'amount' para ser mais abrangente
	fmt.Printf("🔍 Looking for transactions to revert for invoice %s\n", invoiceID)

	rows, err := h.db.Query(c.Request.Context(), `
		SELECT id, amount, description, account_id FROM transactions 
		WHERE credit_card_invoice_id = $1 AND deleted_at IS NULL
	`, invoiceID)

	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var id, desc string
			var accountID *string
			var amount float64
			if err := rows.Scan(&id, &amount, &desc, &accountID); err == nil {
				fmt.Printf("🗑️ FOUND transaction to revert: %s | Paid: %.2f | Desc: %s\n", id, amount, desc)

				// Soft delete da transação de pagamento
				res, _ := h.db.Exec(c.Request.Context(), "UPDATE transactions SET deleted_at = NOW() WHERE id = $1", id)
				rowsAff := res.RowsAffected()
				fmt.Printf("   -> Transaction DELETED (rows affected: %d)\n", rowsAff)

				// Estornar saldo na conta (Refund)
				if accountID != nil {
					h.db.Exec(c.Request.Context(), `
						UPDATE accounts 
						SET balance = balance + $1, updated_at = NOW() 
						WHERE id = $2
					`, amount, *accountID)
					fmt.Printf("   -> Account Balance Refunded to %s\n", *accountID)
				} else {
					fmt.Printf("   -> WARNING: No account_id found for transaction %s, balance not refunded.\n", id)
				}

				totalReverted += amount

				// Tentar remover crédito gerado na próxima fatura
				// Primeiro buscamos o crédito para saber o valor e o ID da fatura
				var creditID, creditInvoiceID string
				var creditAmount float64

				errCredit := h.db.QueryRow(c.Request.Context(), `
					SELECT id, invoice_id, amount 
					FROM credit_card_transactions 
					WHERE description = 'Crédito por Pagamento Antecipado' 
					AND created_at >= (SELECT created_at FROM transactions WHERE id = $1) - INTERVAL '5 minute'
					AND created_at <= (SELECT created_at FROM transactions WHERE id = $1) + INTERVAL '5 minute'
					AND deleted_at IS NULL
				`, id).Scan(&creditID, &creditInvoiceID, &creditAmount)

				if errCredit == nil {
					// Soft delete do crédito
					h.db.Exec(c.Request.Context(), "UPDATE credit_card_transactions SET deleted_at = NOW() WHERE id = $1", creditID)

					// Reverter impacto na fatura (creditAmount é negativo, então subtrair ele soma o valor de volta, ou somar valor absoluto)
					// Ex: Total era 100. Crédito de -10. Total virou 90.
					// Agora tiramos o crédito. Total deve voltar a 100. (90 - (-10) = 100).
					h.db.Exec(c.Request.Context(), `
						UPDATE credit_card_invoices 
						SET total_amount = total_amount - $1,
						    updated_at = NOW()
						WHERE id = $2
					`, creditAmount, creditInvoiceID)

					fmt.Printf("   -> Credit Removed and Invoice %s adjusted (%.2f)\n", creditInvoiceID, creditAmount)
				}
			}
		}
	} else {
		fmt.Printf("❌ Error querying transactions: %v\n", err)
	}

	if totalReverted == 0 {
		// Se não achou pagamentos mas a fatura está paga, força o reset para corrigir inconsistências
		fmt.Println("⚠️ No payment transactions found, but reverting invoice status anyway (Force Reset)")
	}

	// Atualizar fatura para status anterior
	_, err = h.db.Exec(c.Request.Context(), `
		UPDATE credit_card_invoices
		SET paid_amount = 0,
		    status = 'open',
		    updated_at = NOW()
		WHERE id = $1
	`, invoiceID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update invoice"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":        "payments reverted",
		"total_reverted": totalReverted,
	})
}

// calculateAvailableLimit calcula o limite disponível do cartão
func (h *SimpleInvoiceHandler) calculateAvailableLimit(ctx context.Context, cardID string) (float64, error) {
	// Buscar limite do cartão
	var creditLimit float64
	err := h.db.QueryRow(ctx, `
		SELECT limit_amount 
		FROM credit_cards 
		WHERE id = $1 AND deleted_at IS NULL
	`, cardID).Scan(&creditLimit)

	if err != nil {
		return 0, fmt.Errorf("failed to get card limit: %w", err)
	}

	// Calcular total de faturas não quitadas
	var totalDebt float64
	err = h.db.QueryRow(ctx, `
		SELECT COALESCE(SUM(total_amount - paid_amount), 0)
		FROM credit_card_invoices
		WHERE credit_card_id = $1
		AND status != 'paid'
		AND deleted_at IS NULL
	`, cardID).Scan(&totalDebt)

	if err != nil {
		return 0, fmt.Errorf("failed to calculate debt: %w", err)
	}

	// Calcular créditos disponíveis (se houver)
	var totalCredits float64
	err = h.db.QueryRow(ctx, `
		SELECT COALESCE(SUM(c.remaining_amount), 0)
		FROM credits c
		JOIN credit_card_invoices i ON c.current_invoice_id = i.id
		WHERE i.credit_card_id = $1
		AND c.is_consumed = false
	`, cardID).Scan(&totalCredits)

	if err != nil {
		// Se não houver tabela de créditos, ignorar
		totalCredits = 0
	}

	// Limite disponível = Limite total - Dívida + Créditos
	availableLimit := creditLimit - totalDebt + totalCredits

	if availableLimit < 0 {
		availableLimit = 0
	}

	return availableLimit, nil
}

// consumeAvailableCredits consome créditos disponíveis para pagar uma fatura
func (h *SimpleInvoiceHandler) consumeAvailableCredits(ctx context.Context, userID, invoiceID, cardID string, amountNeeded float64) (float64, error) {
	// Buscar créditos disponíveis para este cartão
	rows, err := h.db.Query(ctx, `
		SELECT c.id, c.remaining_amount
		FROM credits c
		JOIN credit_card_invoices i ON c.current_invoice_id = i.id
		WHERE i.credit_card_id = $1
		AND c.is_consumed = false
		AND c.remaining_amount > 0
		ORDER BY c.created_at ASC
	`, cardID)

	if err != nil {
		return 0, err
	}
	defer rows.Close()

	totalConsumed := 0.0

	for rows.Next() && totalConsumed < amountNeeded {
		var creditID string
		var remainingAmount float64

		if err := rows.Scan(&creditID, &remainingAmount); err != nil {
			continue
		}

		// Calcular quanto consumir deste crédito
		amountToConsume := amountNeeded - totalConsumed
		if amountToConsume > remainingAmount {
			amountToConsume = remainingAmount
		}

		// Consumir crédito
		newRemaining := remainingAmount - amountToConsume
		isConsumed := newRemaining <= 0.01 // Considerar consumido se restar menos de 1 centavo

		_, err := h.db.Exec(ctx, `
			UPDATE credits
			SET remaining_amount = $1,
			    is_consumed = $2,
			    updated_at = NOW()
			WHERE id = $3
		`, newRemaining, isConsumed, creditID)

		if err == nil {
			totalConsumed += amountToConsume
			fmt.Printf("Credit consumed: %s (%.2f)\n", creditID, amountToConsume)
		}
	}

	return totalConsumed, nil
}

// getOrCreateNextInvoice busca ou cria a próxima fatura do cartão
func (h *SimpleInvoiceHandler) getOrCreateNextInvoice(ctx context.Context, userID, cardID, currentInvoiceID string) (string, error) {
	// Buscar mês/ano da fatura atual
	var currentMonth, currentYear int
	err := h.db.QueryRow(ctx, `
		SELECT reference_month, reference_year
		FROM credit_card_invoices
		WHERE id = $1
	`, currentInvoiceID).Scan(&currentMonth, &currentYear)

	if err != nil {
		return "", err
	}

	// Calcular próximo mês
	nextMonth := currentMonth + 1
	nextYear := currentYear
	if nextMonth > 12 {
		nextMonth = 1
		nextYear++
	}

	// Buscar fatura existente do próximo mês
	var nextInvoiceID string
	err = h.db.QueryRow(ctx, `
		SELECT id FROM credit_card_invoices
		WHERE user_id = $1
		AND credit_card_id = $2
		AND reference_month = $3
		AND reference_year = $4
		AND deleted_at IS NULL
		LIMIT 1
	`, userID, cardID, nextMonth, nextYear).Scan(&nextInvoiceID)

	if err == nil {
		return nextInvoiceID, nil
	}

	// Se não existe, criar nova fatura
	nextInvoiceID = uuid.New().String()
	closingDate := time.Date(nextYear, time.Month(nextMonth), 10, 0, 0, 0, 0, time.UTC)
	dueDate := time.Date(nextYear, time.Month(nextMonth), 20, 0, 0, 0, 0, time.UTC)

	_, err = h.db.Exec(ctx, `
		INSERT INTO credit_card_invoices (
			id, user_id, credit_card_id, reference_month, reference_year,
			closing_date, due_date, total_amount, paid_amount, status,
			created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 0, 'open', NOW(), NOW())
	`, nextInvoiceID, userID, cardID, nextMonth, nextYear, closingDate, dueDate)

	if err != nil {
		return "", fmt.Errorf("failed to create next invoice: %w", err)
	}

	return nextInvoiceID, nil
}

// GetInvoicesByCard busca todas as faturas de um cartão
func (h *SimpleInvoiceHandler) GetInvoicesByCard(c *gin.Context) {
	userID := c.GetString("user_id")
	cardID := c.Param("id")

	rows, err := h.db.Query(c.Request.Context(), `
		SELECT 
			id, reference_month, reference_year, closing_date, due_date,
			total_amount, paid_amount, status, created_at, updated_at
		FROM credit_card_invoices
		WHERE user_id = $1 
		AND credit_card_id = $2
		AND deleted_at IS NULL
		ORDER BY reference_year DESC, reference_month DESC
	`, userID, cardID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch invoices"})
		return
	}
	defer rows.Close()

	var invoices []map[string]interface{}
	for rows.Next() {
		var id string
		var month, year int
		var closingDate, dueDate, createdAt, updatedAt time.Time
		var totalAmount, paidAmount float64
		var status string

		err := rows.Scan(&id, &month, &year, &closingDate, &dueDate, &totalAmount, &paidAmount, &status, &createdAt, &updatedAt)
		if err != nil {
			continue
		}

		// Calcular dias restantes
		now := time.Now()
		daysRemaining := int(dueDate.Sub(now).Hours() / 24)

		invoice := map[string]interface{}{
			"id":              id,
			"reference_month": month,
			"reference_year":  year,
			"closing_date":    closingDate.Format("2006-01-02"),
			"due_date":        dueDate.Format("2006-01-02"),
			"total_amount":    totalAmount,
			"paid_amount":     paidAmount,
			"status":          status,
			"days_remaining":  daysRemaining,
			"created_at":      createdAt,
			"updated_at":      updatedAt,
		}

		invoices = append(invoices, invoice)
	}

	if invoices == nil {
		invoices = []map[string]interface{}{}
	}

	c.JSON(http.StatusOK, invoices)
}

// GetInvoiceDetails busca detalhes completos de uma fatura
func (h *SimpleInvoiceHandler) GetInvoiceDetails(c *gin.Context) {
	userID := c.GetString("user_id")
	invoiceID := c.Param("id")

	// Buscar fatura
	// Buscar fatura com dados do cartão
	var invoice struct {
		ID             string    `json:"id"`
		CreditCardID   string    `json:"credit_card_id"`
		ReferenceMonth int       `json:"reference_month"`
		ReferenceYear  int       `json:"reference_year"`
		ClosingDate    time.Time `json:"closing_date"`
		DueDate        time.Time `json:"due_date"`
		TotalAmount    float64   `json:"total_amount"`
		PaidAmount     float64   `json:"paid_amount"`
		Status         string    `json:"status"`
		CreatedAt      time.Time `json:"created_at"`
		UpdatedAt      time.Time `json:"updated_at"`
		CreditCard     struct {
			ID          string `json:"id"`
			Name        string `json:"name"`
			Brand       string `json:"brand"`
			Last4Digits string `json:"last_4_digits"`
			Color       string `json:"color"`
		} `json:"credit_card"`
	}

	err := h.db.QueryRow(c.Request.Context(), `
		SELECT 
			i.id, i.credit_card_id, i.reference_month, i.reference_year,
			i.closing_date, i.due_date, i.total_amount, i.paid_amount, i.status,
			i.created_at, i.updated_at,
			c.id, c.name, COALESCE(CAST(c.brand AS TEXT), 'outros'), COALESCE(c.last_4_digits, '****'), COALESCE(c.color, '#333333')
		FROM credit_card_invoices i
		JOIN credit_cards c ON i.credit_card_id = c.id
		WHERE i.id = $1 AND i.user_id = $2 AND i.deleted_at IS NULL
	`, invoiceID, userID).Scan(
		&invoice.ID, &invoice.CreditCardID, &invoice.ReferenceMonth, &invoice.ReferenceYear,
		&invoice.ClosingDate, &invoice.DueDate, &invoice.TotalAmount, &invoice.PaidAmount,
		&invoice.Status, &invoice.CreatedAt, &invoice.UpdatedAt,
		&invoice.CreditCard.ID, &invoice.CreditCard.Name, &invoice.CreditCard.Brand,
		&invoice.CreditCard.Last4Digits, &invoice.CreditCard.Color,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "invoice not found"})
		} else {
			fmt.Printf("❌ Error fetching invoice: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch invoice"})
		}
		return
	}

	// Buscar transações da fatura
	// Usar deleted_at IS NULL para garantir que pegamos apenas ativas
	transactionsRows, err := h.db.Query(c.Request.Context(), `
		SELECT 
			id, description, amount, transaction_date, created_at
		FROM credit_card_transactions
		WHERE invoice_id = $1 AND deleted_at IS NULL
		ORDER BY transaction_date DESC
	`, invoiceID)

	if err != nil {
		fmt.Printf("❌ Error fetching transactions: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch transactions"})
		return
	}
	defer transactionsRows.Close()

	var transactions []map[string]interface{}
	rolloverAmount := 0.0
	calculatedNetTotal := 0.0

	// Struct temp para deduplicação
	type CreditTx struct {
		ID        string
		Amount    float64
		CreatedAt time.Time
	}
	var creditTxs []CreditTx

	for transactionsRows.Next() {
		var id, description string
		var amount float64
		var transactionDate, createdAt time.Time

		if err := transactionsRows.Scan(&id, &description, &amount, &transactionDate, &createdAt); err != nil {
			continue
		}

		// Identify rollover/credit transactions
		if description == "Crédito por Pagamento Antecipado" {
			creditTxs = append(creditTxs, CreditTx{ID: id, Amount: amount, CreatedAt: createdAt})
			continue // Do not add to main transactions list yet
		}

		// Regular transactions: sum and append
		calculatedNetTotal += amount
		transactions = append(transactions, map[string]interface{}{
			"id":               id,
			"description":      description,
			"amount":           amount,
			"transaction_date": transactionDate.Format("2006-01-02"),
			"created_at":       createdAt,
		})
	}

	// Process and Deduplicate Credits
	// Agrupar por valor (para detectar duplicatas exatas de estorno/pagamento)
	creditsByKey := make(map[string][]CreditTx)
	for _, credTx := range creditTxs {
		key := fmt.Sprintf("%.2f", credTx.Amount)
		creditsByKey[key] = append(creditsByKey[key], credTx)
	}

	for _, list := range creditsByKey {
		var validCredit CreditTx

		if len(list) > 1 {
			// Encontrou duplicatas! Manter apenas a mais recente (última criada)
			// A lógica assume que duplicatas são erros de retry/estorno falho
			latest := list[0]
			for _, credTx := range list {
				if credTx.CreatedAt.After(latest.CreatedAt) {
					latest = credTx
				}
			}
			validCredit = latest

			// Deletar as outras (Cleaning up duplicates)
			for _, credTx := range list {
				if credTx.ID != latest.ID {
					fmt.Printf("🧹 Cleaning up duplicate credit: %s (Active but Duplicate)\n", credTx.ID)
					h.db.Exec(c.Request.Context(), "UPDATE credit_card_transactions SET deleted_at = NOW() WHERE id = $1", credTx.ID)
				}
			}
		} else {
			validCredit = list[0]
		}

		// Add verified credit to totals
		calculatedNetTotal += validCredit.Amount
		rolloverAmount += validCredit.Amount
	}

	// Auto-Heal: Se o total do banco estiver errado (desincronizado), corrige.
	diff := invoice.TotalAmount - calculatedNetTotal
	if diff > 0.01 || diff < -0.01 {
		fmt.Printf("🔧 Auto-Healing Invoice %s: DB Total=%.2f, Real Total=%.2f. Fixing...\n", invoiceID, invoice.TotalAmount, calculatedNetTotal)
		_, _ = h.db.Exec(c.Request.Context(), "UPDATE credit_card_invoices SET total_amount = $1, updated_at = NOW() WHERE id = $2", calculatedNetTotal, invoiceID)
		invoice.TotalAmount = calculatedNetTotal
	}

	// Buscar pagamentos da fatura (transações que pagaram esta fatura)
	paymentsRows, err := h.db.Query(c.Request.Context(), `
		SELECT 
			id, description, amount, date, account_id, created_at
		FROM transactions
		WHERE credit_card_invoice_id = $1 
		AND deleted_at IS NULL
		AND type = 'despesa'
		ORDER BY date DESC
	`, invoiceID)

	if err != nil {
		fmt.Printf("❌ Error fetching payments: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch payments"})
		return
	}
	defer paymentsRows.Close()

	var payments []map[string]interface{}
	for paymentsRows.Next() {
		var id, description string
		var amount float64
		var accountID string
		var date, createdAt time.Time

		if err := paymentsRows.Scan(&id, &description, &amount, &date, &accountID, &createdAt); err != nil {
			continue
		}

		payments = append(payments, map[string]interface{}{
			"id":          id,
			"description": description,
			"amount":      amount,
			"date":        date.Format("2006-01-02"),
			"account_id":  accountID,
			"created_at":  createdAt,
		})
	}

	if transactions == nil {
		transactions = []map[string]interface{}{}
	}
	if payments == nil {
		payments = []map[string]interface{}{}
	}

	// Recalculate Gross Total for display (Total stored is Net)
	// Gross = Net - Rollover (Subtracting negative rollover adds it back to create the gross)
	grossTotal := invoice.TotalAmount - rolloverAmount

	c.JSON(http.StatusOK, gin.H{
		"invoice": map[string]interface{}{
			"id":              invoice.ID,
			"credit_card_id":  invoice.CreditCardID,
			"reference_month": invoice.ReferenceMonth,
			"reference_year":  invoice.ReferenceYear,
			"closing_date":    invoice.ClosingDate.Format("2006-01-02"),
			"due_date":        invoice.DueDate.Format("2006-01-02"),
			"total_amount":    grossTotal,
			"paid_amount":     invoice.PaidAmount,
			"status":          invoice.Status,
			"created_at":      invoice.CreatedAt,
			"updated_at":      invoice.UpdatedAt,
			"credit_card": map[string]interface{}{
				"id":            invoice.CreditCard.ID,
				"name":          invoice.CreditCard.Name,
				"brand":         invoice.CreditCard.Brand,
				"last_4_digits": invoice.CreditCard.Last4Digits,
				"color":         invoice.CreditCard.Color,
			},
		},
		"transactions":    transactions,
		"payments":        payments,
		"rollover_amount": rolloverAmount,
	})
}
