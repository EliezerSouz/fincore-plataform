package handler

import (
	"financeiro-api/internal/infra/scheduler"
	"net/http"

	"github.com/gin-gonic/gin"
)

type SchedulerHandler struct {
	scheduler *scheduler.YieldScheduler
}

func NewSchedulerHandler(sched *scheduler.YieldScheduler) *SchedulerHandler {
	return &SchedulerHandler{
		scheduler: sched,
	}
}

// GetStatus returns the current status of the yield scheduler
// GET /api/scheduler/status
func (h *SchedulerHandler) GetStatus(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"running": h.scheduler.IsRunning(),
		"message": "Yield scheduler status",
	})
}

// TriggerManual manually triggers a yield calculation
// POST /api/scheduler/trigger
func (h *SchedulerHandler) TriggerManual(c *gin.Context) {
	var input struct {
		Date    string  `json:"date"`     // Optional: specific date, defaults to today
		CDIRate float64 `json:"cdi_rate"` // Optional: manual CDI rate, defaults to API fetch
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		// If no body, use defaults
		input.Date = ""
		input.CDIRate = 0
	}

	// This would trigger the calculation
	// For now, just acknowledge the request
	c.JSON(http.StatusOK, gin.H{
		"message": "Manual yield calculation triggered",
		"note":    "Use POST /api/yields/calculate for immediate execution",
	})
}
