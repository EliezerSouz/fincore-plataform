package handler

import (
	"financeiro-api/internal/entity"
	"financeiro-api/internal/infra/repository"
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

	methods, err := h.repo.FindAll(c.Request.Context(), userID, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, methods)
}
