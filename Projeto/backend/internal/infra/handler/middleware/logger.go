package middleware

import (
	"log"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// LoggerMiddleware adds structured logging to requests
func LoggerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		// Generate or reuse Request ID for tracing
		reqID := c.GetHeader("X-Request-ID")
		if reqID == "" {
			reqID = uuid.New().String()
		}

		c.Set("RequestID", reqID)
		c.Header("X-Request-ID", reqID)

		// DEBUG: Log ALL POST requests to see what's coming
		if c.Request.Method == "POST" {
			log.Printf("🟡 DEBUG: POST request to: %s", c.Request.URL.Path)
		}

		// DEBUG: Log incoming request details
		if c.Request.Method == "POST" && c.Request.URL.Path == "/api/invoices/transactions" {
			log.Printf("🟢 DEBUG MIDDLEWARE: POST /api/invoices/transactions detected!")
			log.Printf("🟢 DEBUG MIDDLEWARE: Content-Type: %s", c.GetHeader("Content-Type"))
			log.Printf("🟢 DEBUG MIDDLEWARE: Content-Length: %d", c.Request.ContentLength)
		}

		// Process request
		c.Next()

		duration := time.Since(start)
		status := c.Writer.Status()

		// Log format: [REQ_ID] STATUS | DURATION | IP | METHOD PATH
		log.Printf("[REQ] %s | %3d | %13v | %15s | %-7s %s",
			reqID,
			status,
			duration,
			c.ClientIP(),
			c.Request.Method,
			c.Request.URL.Path,
		)

		// DEBUG: Log response status for our endpoint
		if c.Request.Method == "POST" && c.Request.URL.Path == "/api/invoices/transactions" {
			log.Printf("🔴 DEBUG MIDDLEWARE: Response status: %d", status)
		}
	}
}
