package handler

import (
	"context"
	"database/sql"
	"financeiro-api/internal/entity"
	"financeiro-api/internal/infra/repository"
	"fmt"
	"net/http"
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
		CreditCardID    string    `json:"credit_card_id" binding:"required"`
		Description     string    `json:"description" binding:"required"`
		Amount          float64   `json:"amount" binding:"required,gt=0"`
		TransactionDate time.Time `json:"transaction_date" binding:"required"`
		CategoryID      *string   `json:"category_id"`
		Notes           *string   `json:"notes"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validar limite disponível
	availableLimit, err := h.calculateAvailableLimit(c.Request.Context(), input.CreditCardID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to calculate available limit"})
		return
	}

	if input.Amount > availableLimit {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":           "insufficient credit limit",
			"available_limit": availableLimit,
			"requested":       input.Amount,
		})
		return
	}

	// Buscar ou criar fatura para o mês da transação
	invoiceID, err := h.getOrCreateInvoice(c.Request.Context(), userID, input.CreditCardID, input.TransactionDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to get/create invoice: %v", err)})
		return
	}

	// Criar evento financeiro
	eventInput := entity.CreateFinancialEventInput{
		Type:      entity.EventTypeTransaction,
		InvoiceID: invoiceID,
		Amount:    input.Amount,
	}

	event, err := h.eventRepo.Create(c.Request.Context(), userID, eventInput)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create transaction event"})
		return
	}

	// Atualizar total da fatura
	if err := h.updateInvoiceTotal(c.Request.Context(), invoiceID, input.Amount); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update invoice total"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":         "transaction created",
		"event_id":        event.ID,
		"invoice_id":      invoiceID,
		"amount":          input.Amount,
		"available_limit": availableLimit - input.Amount,
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
		PaymentDate time.Time `json:"payment_date" binding:"required"`
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

	// Criar evento de pagamento
	eventInput := entity.CreateFinancialEventInput{
		Type:          entity.EventTypePayment,
		InvoiceID:     invoiceID,
		Amount:        input.Amount,
		AccountID:     &input.AccountID,
		BalanceImpact: -input.Amount,
	}

	event, err := h.eventRepo.Create(c.Request.Context(), userID, eventInput)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create payment event"})
		return
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

	// Buscar créditos disponíveis para esta fatura
	var cardID string
	err = h.db.QueryRow(c.Request.Context(), `
		SELECT credit_card_id FROM credit_card_invoices WHERE id = $1
	`, invoiceID).Scan(&cardID)

	if err == nil {
		// Tentar consumir créditos disponíveis automaticamente
		creditsConsumed, _ := h.consumeAvailableCredits(c.Request.Context(), userID, invoiceID, cardID, remainingAmount)
		if creditsConsumed > 0 {
			// Atualizar fatura com crédito consumido
			newPaidAmount += creditsConsumed
			if newPaidAmount >= totalAmount {
				newStatus = "paid"
			}

			_, _ = h.db.Exec(c.Request.Context(), `
				UPDATE credit_card_invoices
				SET paid_amount = $1, status = $2, updated_at = NOW()
				WHERE id = $3
			`, newPaidAmount, newStatus, invoiceID)
		}
	}

	// Se pagou a mais, gerar crédito e migrar para próxima fatura
	var creditGenerated float64
	if input.Amount > remainingAmount {
		creditGenerated = input.Amount - remainingAmount

		// Buscar próxima fatura ou criar
		nextInvoiceID, err := h.getOrCreateNextInvoice(c.Request.Context(), userID, cardID, invoiceID)
		if err != nil {
			nextInvoiceID = "" // Se falhar, crédito fica sem fatura destino
		}

		creditInput := entity.CreateCreditInput{
			OriginInvoiceID:  invoiceID,
			CurrentInvoiceID: &nextInvoiceID,
			OriginalAmount:   creditGenerated,
			RemainingAmount:  creditGenerated,
		}

		credit, err := h.creditRepo.Create(c.Request.Context(), userID, creditInput)
		if err != nil {
			fmt.Printf("Warning: failed to create credit: %v\n", err)
		} else if nextInvoiceID != "" {
			// Aplicar crédito automaticamente na próxima fatura
			_, _ = h.db.Exec(c.Request.Context(), `
				UPDATE credit_card_invoices
				SET paid_amount = paid_amount + $1,
				    updated_at = NOW()
				WHERE id = $2
			`, creditGenerated, nextInvoiceID)

			fmt.Printf("Credit migrated to next invoice: %s -> %s (%.2f)\n",
				credit.ID, nextInvoiceID, creditGenerated)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message":          "payment created",
		"event_id":         event.ID,
		"amount":           input.Amount,
		"remaining_amount": remainingAmount - input.Amount,
		"credit_generated": creditGenerated,
		"status":           newStatus,
	})
}

// RevertPayment estorna um pagamento
func (h *SimpleInvoiceHandler) RevertPayment(c *gin.Context) {
	userID := c.GetString("user_id")
	invoiceID := c.Param("id")

	// Buscar pagamentos da fatura
	payments, err := h.eventRepo.FindPaymentsByInvoice(c.Request.Context(), invoiceID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to find payments"})
		return
	}

	if len(payments) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no payments to revert"})
		return
	}

	totalReverted := 0.0

	// Estornar todos os pagamentos
	for _, payment := range payments {
		if err := h.eventRepo.Revert(c.Request.Context(), payment.ID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to revert payment"})
			return
		}

		// Criar evento de estorno
		eventInput := entity.CreateFinancialEventInput{
			Type:           entity.EventTypeReversal,
			InvoiceID:      invoiceID,
			Amount:         payment.Amount,
			RelatedEventID: &payment.ID,
			BalanceImpact:  payment.Amount, // Reverter o impacto
		}

		_, err := h.eventRepo.Create(c.Request.Context(), userID, eventInput)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create reversal event"})
			return
		}

		totalReverted += payment.Amount
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
		"count":          len(payments),
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
