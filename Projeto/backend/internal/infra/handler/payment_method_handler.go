package handler

import (
	"financeiro-api/internal/entity"
	"financeiro-api/internal/infra/repository"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

type PaymentMethodHandler struct {
	repo *repository.PaymentMethodRepository
}

func NewPaymentMethodHandler(repo *repository.PaymentMethodRepository) *PaymentMethodHandler {
	return &PaymentMethodHandler{repo: repo}
}

// GET /api/payment-methods
func (h *PaymentMethodHandler) List(c *gin.Context) {
	userID := c.GetString("user_id")

	// Default active=true if not specified? Or all?
	// Usually for dropdowns we want active only.
	active := c.DefaultQuery("active", "true") == "true"

	filter := entity.PaymentMethodFilter{
		OnlyActive:      active,
		TransactionType: c.Query("type"),
	}

	fmt.Printf("Fetching payment methods for user %s. Active: %v, Type: %s\n", userID, active, filter.TransactionType)

	methods, err := h.repo.FindAll(c.Request.Context(), userID, filter)
	if err != nil {
		fmt.Printf("Error fetching methods: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	fmt.Printf("Found %d methods for user %s\n", len(methods), userID)
	for _, m := range methods {
		fmt.Printf("  - %s (Type: %s, Active: %v, Income: %v, Expense: %v)\n", m.Name, m.Type, m.IsActive, m.AllowsIncome, m.AllowsExpense)
	}

	c.JSON(http.StatusOK, methods)
}
