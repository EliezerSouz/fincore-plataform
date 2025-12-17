package handler

import (
	"financeiro-api/internal/infra/repository"
	"net/http"

	"github.com/gin-gonic/gin"
)

type DashboardHandler struct {
	repo *repository.DashboardRepository
}

func NewDashboardHandler(repo *repository.DashboardRepository) *DashboardHandler {
	return &DashboardHandler{repo: repo}
}

// GET /api/dashboard/summary
func (h *DashboardHandler) GetSummary(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	summary, err := h.repo.GetSummary(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, summary)
}
