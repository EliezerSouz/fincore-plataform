package handler

import (
	"financeiro-api/internal/entity"
	"financeiro-api/internal/infra/repository"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type TransactionHandler struct {
	repo *repository.TransactionRepository
}

func NewTransactionHandler(repo *repository.TransactionRepository) *TransactionHandler {
	return &TransactionHandler{repo: repo}
}

// GET /api/transactions
func (h *TransactionHandler) List(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	// Pagination
	fmt.Printf("DEBUG HANDLER: Query Params: %v\n", c.Request.URL.Query())
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	if limit > 2000 {
		limit = 2000
	}

	// Filters
	filter := repository.TransactionFilter{
		AccountID:  c.Query("account_id"),
		CategoryID: c.Query("category_id"),
		Type:       c.Query("type"),
		DateStart:  c.Query("from"),
		DateEnd:    c.Query("to"),
		SortBy:     c.Query("sort_by"),
		SortOrder:  c.Query("sort_order"),
	}

	transactions, err := h.repo.FindAll(c.Request.Context(), userID, filter, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if transactions == nil {
		transactions = []entity.Transaction{}
	}

	c.JSON(http.StatusOK, transactions)
}

// GET /api/transactions/:id
func (h *TransactionHandler) Get(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	id := c.Param("id")
	transaction, err := h.repo.FindByID(c.Request.Context(), id, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "transaction not found"})
		return
	}

	c.JSON(http.StatusOK, transaction)
}

// POST /api/transactions
func (h *TransactionHandler) Create(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var input entity.CreateTransactionInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Auto-resolve AccountID from PocketID if missing
	if input.AccountID == "" && input.PocketID != nil && *input.PocketID != "" {
		var parentAccountID string
		err := h.repo.GetDB().QueryRow(c.Request.Context(),
			"SELECT parent_account_id FROM pockets WHERE id = $1",
			*input.PocketID).Scan(&parentAccountID)

		if err == nil && parentAccountID != "" {
			input.AccountID = parentAccountID
		}
	}

	transaction, err := h.repo.Create(c.Request.Context(), userID, input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, transaction)
}

type CreateTransferRequest struct {
	Source entity.CreateTransactionInput `json:"source" binding:"required"`
	Target entity.CreateTransactionInput `json:"target" binding:"required"`
}

// POST /api/transfers
func (h *TransactionHandler) CreateTransfer(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var input CreateTransferRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Auto-resolve Source AccountID
	if input.Source.AccountID == "" && input.Source.PocketID != nil && *input.Source.PocketID != "" {
		var parentAccountID string
		err := h.repo.GetDB().QueryRow(c.Request.Context(),
			"SELECT parent_account_id FROM pockets WHERE id = $1",
			*input.Source.PocketID).Scan(&parentAccountID)
		if err == nil && parentAccountID != "" {
			input.Source.AccountID = parentAccountID
		}
	}

	// Auto-resolve Target AccountID
	if input.Target.AccountID == "" && input.Target.PocketID != nil && *input.Target.PocketID != "" {
		var parentAccountID string
		err := h.repo.GetDB().QueryRow(c.Request.Context(),
			"SELECT parent_account_id FROM pockets WHERE id = $1",
			*input.Target.PocketID).Scan(&parentAccountID)
		if err == nil && parentAccountID != "" {
			input.Target.AccountID = parentAccountID
		}
	}

	sourceTx, targetTx, err := h.repo.CreateTransfer(c.Request.Context(), userID, input.Source, input.Target)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"source": sourceTx,
		"target": targetTx,
	})
}

type CreatePocketTransferRequest struct {
	SourcePocketID string  `json:"source_pocket_id" binding:"required"`
	TargetPocketID string  `json:"target_pocket_id" binding:"required"`
	Amount         float64 `json:"amount" binding:"required,gt=0"`
	Description    string  `json:"description"`
	Date           string  `json:"date" binding:"required"`
}

// POST /api/transactions/pocket-transfer
func (h *TransactionHandler) CreatePocketTransfer(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var input CreatePocketTransferRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validation: source != target
	if input.SourcePocketID == input.TargetPocketID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "source and target pockets must be different"})
		return
	}

	// Get pocket names for proper descriptions
	// Get pocket names and parent accounts
	var sourcePocketName, sourceParentAccountID string
	err := h.repo.GetDB().QueryRow(c.Request.Context(),
		"SELECT name, parent_account_id FROM pockets WHERE id = $1",
		input.SourcePocketID).Scan(&sourcePocketName, &sourceParentAccountID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "source pocket not found"})
		return
	}

	var targetPocketName, targetParentAccountID string
	err = h.repo.GetDB().QueryRow(c.Request.Context(),
		"SELECT name, parent_account_id FROM pockets WHERE id = $1",
		input.TargetPocketID).Scan(&targetPocketName, &targetParentAccountID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "target pocket not found"})
		return
	}

	// Get category ID for "MOVIMENTAÇÃO INTERNA"
	var categoryID *string
	var catID string
	err = h.repo.GetDB().QueryRow(c.Request.Context(),
		"SELECT id FROM categories WHERE user_id = $1 AND name = 'MOVIMENTAÇÃO INTERNA'",
		userID).Scan(&catID)
	if err == nil {
		categoryID = &catID
	}

	// Create descriptions that match the pattern expected by the repository
	// Source: "Transferência para [target]" → will decrease balance
	// Target: "Transferência de [source]" → will increase balance
	sourceDescription := fmt.Sprintf("Transferência para %s", targetPocketName)
	targetDescription := fmt.Sprintf("Transferência de %s", sourcePocketName)

	// Add user's custom description if provided
	if input.Description != "" {
		sourceDescription = fmt.Sprintf("%s - %s", sourceDescription, input.Description)
		targetDescription = fmt.Sprintf("%s - %s", targetDescription, input.Description)
	}

	sourceInput := entity.CreateTransactionInput{
		AccountID:   sourceParentAccountID,
		PocketID:    &input.SourcePocketID,
		CategoryID:  categoryID,
		Amount:      input.Amount,
		Description: sourceDescription,
		Date:        parseDate(input.Date),
		Type:        "transferencia",
	}

	targetInput := entity.CreateTransactionInput{
		AccountID:   targetParentAccountID,
		PocketID:    &input.TargetPocketID,
		CategoryID:  categoryID,
		Amount:      input.Amount,
		Description: targetDescription,
		Date:        parseDate(input.Date),
		Type:        "transferencia",
	}

	sourceTx, targetTx, err := h.repo.CreateTransfer(c.Request.Context(), userID, sourceInput, targetInput)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"source":  sourceTx,
		"target":  targetTx,
		"message": "Transfer completed successfully",
	})
}

// PUT /api/transactions/:id
func (h *TransactionHandler) Update(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	id := c.Param("id")
	var input entity.UpdateTransactionInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	transaction, err := h.repo.Update(c.Request.Context(), id, userID, input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, transaction)
}

// DELETE /api/transactions/:id
func (h *TransactionHandler) Delete(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	id := c.Param("id")
	if err := h.repo.Delete(c.Request.Context(), id, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "transaction deleted successfully"})
}

// Helper function to parse date string
func parseDate(dateStr string) time.Time {
	// Try parsing as "2006-01-02"
	t, err := time.Parse("2006-01-02", dateStr)
	if err == nil {
		return t
	}

	// Try parsing as RFC3339
	t, err = time.Parse(time.RFC3339, dateStr)
	if err == nil {
		return t
	}

	// Default to now if parsing fails
	return time.Now()
}
