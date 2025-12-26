package handler

import (
	"financeiro-api/internal/infra/repository"
	"financeiro-api/internal/usecase"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type LiquidityYieldHandler struct {
	service *usecase.LiquidityYieldService
}

func NewLiquidityYieldHandler(db *pgxpool.Pool) *LiquidityYieldHandler {
	yieldRepo := repository.NewLiquidityYieldRepository(db)
	accountRepo := repository.NewAccountRepository(db)
	pocketRepo := repository.NewPocketRepository(db)
	service := usecase.NewLiquidityYieldService(yieldRepo, accountRepo, pocketRepo)

	return &LiquidityYieldHandler{
		service: service,
	}
}

// CalculateDailyYields processes yield calculation for all eligible accounts
// POST /api/yields/calculate
func (h *LiquidityYieldHandler) CalculateDailyYields(c *gin.Context) {
	var input struct {
		Date    string  `json:"date"`     // Format: "2006-01-02"
		CDIRate float64 `json:"cdi_rate"` // Annual CDI rate (e.g., 13.65)
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parse date
	targetDate, err := time.Parse("2006-01-02", input.Date)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date format, use YYYY-MM-DD"})
		return
	}

	// Validate CDI rate
	if input.CDIRate <= 0 || input.CDIRate > 100 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "CDI rate must be between 0 and 100"})
		return
	}

	// Execute calculation
	err = h.service.CalculateDailyYields(c.Request.Context(), targetDate, input.CDIRate)
	if err != nil {
		fmt.Printf("❌ Error calculating yields: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to calculate yields"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Yields calculated successfully",
		"date":    input.Date,
	})
}

// GetAccountYieldSummary returns yield summary for a specific account
// GET /api/yields/account/:id
func (h *LiquidityYieldHandler) GetAccountYieldSummary(c *gin.Context) {
	userID := c.GetString("user_id")
	accountID := c.Param("id")

	summary, err := h.service.GetAccountYieldSummary(c.Request.Context(), accountID, userID)
	if err != nil {
		fmt.Printf("❌ Error getting yield summary: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get yield summary"})
		return
	}

	c.JSON(http.StatusOK, summary)
}

// ReprocessYield allows reprocessing a specific date for an account
// POST /api/yields/reprocess
func (h *LiquidityYieldHandler) ReprocessYield(c *gin.Context) {
	userID := c.GetString("user_id")

	var input struct {
		AccountID string  `json:"account_id" binding:"required"`
		Date      string  `json:"date" binding:"required"`
		CDIRate   float64 `json:"cdi_rate" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parse date
	targetDate, err := time.Parse("2006-01-02", input.Date)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date format, use YYYY-MM-DD"})
		return
	}

	// Execute reprocessing
	err = h.service.ReprocessYield(c.Request.Context(), input.AccountID, userID, targetDate, input.CDIRate)
	if err != nil {
		fmt.Printf("❌ Error reprocessing yield: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Yield reprocessed successfully",
		"account_id": input.AccountID,
		"date":       input.Date,
	})
}
