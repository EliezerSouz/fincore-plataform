package handler

import (
	"financeiro-api/internal/entity"
	"financeiro-api/internal/infra/repository"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type BalanceAdjustmentHandler struct {
	repo *repository.BalanceAdjustmentRepository
}

func NewBalanceAdjustmentHandler(repo *repository.BalanceAdjustmentRepository) *BalanceAdjustmentHandler {
	return &BalanceAdjustmentHandler{repo: repo}
}

// ListByAccount lists balance adjustments for an account
func (h *BalanceAdjustmentHandler) ListByAccount(c *gin.Context) {
	userID := c.GetString("user_id")
	accountID := c.Query("account_id")

	if accountID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "account_id is required"})
		return
	}

	adjustments, err := h.repo.FindAllByAccount(c.Request.Context(), accountID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, adjustments)
}

// Create creates a new balance adjustment
func (h *BalanceAdjustmentHandler) Create(c *gin.Context) {
	userID := c.GetString("user_id")
	var input entity.CreateBalanceAdjustmentInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	adjustment := &entity.BalanceAdjustment{
		ID:                     uuid.New().String(),
		UserID:                 userID,
		AccountID:              input.AccountID,
		AdjustmentDate:         input.AdjustmentDate,
		Balance:                input.Balance,
		Type:                   input.Type,
		Notes:                  input.Notes,
		StartsControlledPeriod: input.StartsControlledPeriod,
		CreatedAt:              time.Now(),
		UpdatedAt:              time.Now(),
	}

	if err := h.repo.Create(c.Request.Context(), adjustment); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, adjustment)
}

// Update updates a balance adjustment
func (h *BalanceAdjustmentHandler) Update(c *gin.Context) {
	userID := c.GetString("user_id")
	id := c.Param("id")
	var input entity.UpdateBalanceAdjustmentInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	adjustment, err := h.repo.FindByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "adjustment not found"})
		return
	}

	if adjustment.UserID != userID {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	if input.AdjustmentDate != nil {
		adjustment.AdjustmentDate = *input.AdjustmentDate
	}
	if input.Balance != nil {
		adjustment.Balance = *input.Balance
	}
	if input.Type != nil {
		adjustment.Type = *input.Type
	}
	if input.Notes != nil {
		adjustment.Notes = input.Notes
	}
	if input.StartsControlledPeriod != nil {
		adjustment.StartsControlledPeriod = *input.StartsControlledPeriod
	}

	adjustment.UpdatedAt = time.Now()

	if err := h.repo.Update(c.Request.Context(), adjustment); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, adjustment)
}

// Delete deletes a balance adjustment
func (h *BalanceAdjustmentHandler) Delete(c *gin.Context) {
	userID := c.GetString("user_id")
	id := c.Param("id")

	if err := h.repo.Delete(c.Request.Context(), id, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}
