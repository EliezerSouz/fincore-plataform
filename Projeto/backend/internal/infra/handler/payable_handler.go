package handler

import (
	"financeiro-api/internal/entity"
	"financeiro-api/internal/infra/repository"
	"financeiro-api/internal/usecase"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type PayableHandler struct {
	repo    *repository.PayableRepository
	service *usecase.PayableService
}

func NewPayableHandler(repo *repository.PayableRepository, service *usecase.PayableService) *PayableHandler {
	return &PayableHandler{repo: repo, service: service}
}

// @Summary List Payables
// @Description List payables filtered by date range
// @Tags payables
// @Accept json
// @Produce json
// @Param from query string true "Start Date (YYYY-MM-DD)"
// @Param to query string true "End Date (YYYY-MM-DD)"
// @Success 200 {array} entity.Payable
// @Router /payables [get]
func (h *PayableHandler) List(c *gin.Context) {
	userID := c.GetString("user_id")
	fromStr := c.Query("from")
	toStr := c.Query("to")

	if fromStr == "" || toStr == "" {
		// Default to current month
		now := time.Now()
		fromStr = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC).Format("2006-01-02")
		toStr = time.Date(now.Year(), now.Month()+1, 0, 0, 0, 0, 0, time.UTC).Format("2006-01-02")
	}

	from, err := time.Parse("2006-01-02", fromStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid from date"})
		return
	}
	to, err := time.Parse("2006-01-02", toStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid to date"})
		return
	}

	payables, err := h.repo.FindAllByDateRange(c.Request.Context(), userID, from, to)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, payables)
}

// @Summary Create Payable
// @Description Create one or more payables (installments)
// @Tags payables
// @Accept json
// @Produce json
// @Param input body entity.CreatePayableInput true "Input"
// @Success 201 {object} map[string]string
// @Router /payables [post]
func (h *PayableHandler) Create(c *gin.Context) {
	userID := c.GetString("user_id")
	var input entity.CreatePayableInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.Create(c.Request.Context(), userID, input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "created"})
}

// @Summary Pay Payable
// @Description Mark payable as paid and create transaction
// @Tags payables
// @Accept json
// @Produce json
// @Param id path string true "Payable ID"
// @Param input body entity.PayPayableInput true "Input"
// @Success 200 {object} map[string]string
// @Router /payables/{id}/pay [post]
func (h *PayableHandler) Pay(c *gin.Context) {
	userID := c.GetString("user_id")
	id := c.Param("id")

	var input entity.PayPayableInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.Pay(c.Request.Context(), userID, id, input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "paid"})
}

// @Summary Revert Payment
// @Description Revert payment status and delete transaction
// @Tags payables
// @Accept json
// @Produce json
// @Param id path string true "Payable ID"
// @Success 200 {object} map[string]string
// @Router /payables/{id}/revert [post]
func (h *PayableHandler) Revert(c *gin.Context) {
	userID := c.GetString("user_id")
	id := c.Param("id")

	if err := h.service.RevertPayment(c.Request.Context(), userID, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "reverted"})
}

// @Summary Update Payable
// @Description Update payable details
// @Tags payables
// @Accept json
// @Produce json
// @Param id path string true "Payable ID"
// @Param input body entity.UpdatePayableInput true "Input"
// @Success 200 {object} map[string]string
// @Router /payables/{id} [put]
func (h *PayableHandler) Update(c *gin.Context) {
	userID := c.GetString("user_id")
	id := c.Param("id")

	var input entity.UpdatePayableInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.Update(c.Request.Context(), userID, id, input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

// @Summary Delete Payable
// @Description Delete a payable
// @Tags payables
// @Accept json
// @Produce json
// @Param id path string true "Payable ID"
// @Success 200 {object} map[string]string
// @Router /payables/{id} [delete]
func (h *PayableHandler) Delete(c *gin.Context) {
	userID := c.GetString("user_id")
	id := c.Param("id")

	if err := h.service.Delete(c.Request.Context(), userID, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}
