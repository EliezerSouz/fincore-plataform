package handler

import (
	"financeiro-api/internal/entity"
	"financeiro-api/internal/usecase"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type InvoiceHandler struct {
	Service *usecase.InvoiceService
}

func NewInvoiceHandler(service *usecase.InvoiceService) *InvoiceHandler {
	return &InvoiceHandler{Service: service}
}

func (h *InvoiceHandler) GetInvoicesByCard(c *gin.Context) {
	cardID := c.Param("id")
	if cardID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "card_id is required"})
		return
	}

	invoices, err := h.Service.InvoiceRepo.FindByCardID(c.Request.Context(), cardID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, invoices)
}

func (h *InvoiceHandler) GetInvoiceDetails(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id is required"})
		return
	}

	invoice, err := h.Service.InvoiceRepo.FindByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	transactions, err := h.Service.InvoiceRepo.FindTransactionsByInvoiceID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	payments, err := h.Service.InvoiceRepo.FindPaymentsByInvoiceID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Calculate Rollover Amount (Prior Balance)
	prevMonth := invoice.ReferenceMonth - 1
	prevYear := invoice.ReferenceYear
	if prevMonth < 1 {
		prevMonth = 12
		prevYear--
	}

	var rolloverAmount float64 = 0
	// We need CreditCardID from invoice, which is available in invoice struct
	if invoice.CreditCardID != "" {
		prevInvoice, err := h.Service.InvoiceRepo.FindOneByCardAndMonthYear(c.Request.Context(), invoice.CreditCardID, prevMonth, prevYear)
		if err == nil && prevInvoice != nil {
			// Rollover = Total - Paid
			// If positive: Debt. If negative: Credit (overpaid).
			rolloverAmount = prevInvoice.TotalAmount - prevInvoice.PaidAmount
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"invoice":         invoice,
		"transactions":    transactions,
		"payments":        payments,
		"rollover_amount": rolloverAmount,
	})
}

func (h *InvoiceHandler) CreateTransaction(c *gin.Context) {
	userIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDStr.(string)

	var input entity.CreateCreditCardTransactionInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.Service.CreateTransaction(c.Request.Context(), input, userID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"status": "success"})
}

func (h *InvoiceHandler) DeleteTransaction(c *gin.Context) {
	userIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDStr.(string)

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id is required"})
		return
	}

	// Series delete support via query param
	series := c.Query("series")
	if series == "true" {
		if err := h.Service.InvoiceRepo.DeleteSeriesByTransactionID(c.Request.Context(), id, userID); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": "success"})
		return
	}

	if err := h.Service.DeleteTransaction(c.Request.Context(), id, userID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success"})
}

type PayInvoiceRequest struct {
	Amount     float64   `json:"amount" binding:"required,gt=0"`
	AccountID  string    `json:"account_id" binding:"required"`
	Date       time.Time `json:"date" binding:"required"`
	CategoryID string    `json:"category_id"`
}

func (h *InvoiceHandler) PayInvoice(c *gin.Context) {
	userIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDStr.(string)

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id is required"})
		return
	}

	var req PayInvoiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.Service.PayInvoice(c.Request.Context(), id, req.Amount, req.AccountID, req.Date, req.CategoryID, userID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success"})
}

func (h *InvoiceHandler) UpdateTransaction(c *gin.Context) {
	userIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDStr.(string)

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id is required"})
		return
	}

	var input entity.UpdateCreditCardTransactionInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	input.ID = id

	if err := h.Service.InvoiceRepo.UpdateTransaction(c.Request.Context(), input, userID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success"})
}

func (h *InvoiceHandler) RevertPayment(c *gin.Context) {
	userIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDStr.(string)

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id is required"})
		return
	}

	if err := h.Service.InvoiceRepo.RevertLatestPayment(c.Request.Context(), id, userID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success"})
}
