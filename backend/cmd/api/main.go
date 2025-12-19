package main

import (
	"log"
	"os"

	"financeiro-api/internal/infra/database"

	"financeiro-api/internal/infra/handler"
	"financeiro-api/internal/infra/handler/middleware"
	"financeiro-api/internal/infra/repository"
	"financeiro-api/internal/usecase"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found (using system envs)")
	}

	// Database connection
	dbPool, err := database.NewPostgresConnection()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer dbPool.Close()

	// Initialize repositories
	userRepo := repository.NewUserRepository(dbPool)
	accountRepo := repository.NewAccountRepository(dbPool)
	transactionRepo := repository.NewTransactionRepository(dbPool)
	categoryRepo := repository.NewCategoryRepository(dbPool)
	dashboardRepo := repository.NewDashboardRepository(dbPool)
	cardRepo := repository.NewCardRepository(dbPool)

	// Initialize use cases/services
	userService := usecase.NewUserService(userRepo)

	// Initialize handlers
	userHandler := handler.NewUserHandler(userService)
	accountHandler := handler.NewAccountHandler(accountRepo)
	transactionHandler := handler.NewTransactionHandler(transactionRepo)
	categoryHandler := handler.NewCategoryHandler(categoryRepo)
	dashboardHandler := handler.NewDashboardHandler(dashboardRepo)
	cardHandler := handler.NewCardHandler(cardRepo)
	aiHandler := handler.NewAIHandler()

	// Setup Gin
	r := gin.Default()

	// Apply CORS middleware
	r.Use(middleware.CORSMiddleware())

	// Public routes
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "pong"})
	})

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"service": "financeiro-api",
			"version": "1.0.0",
		})
	})

	// Protected API routes
	api := r.Group("/api")
	api.Use(middleware.AuthMiddleware())
	{
		// User routes
		api.GET("/me", userHandler.GetMe)
		api.POST("/setup", userHandler.Setup)

		// Account routes
		api.GET("/accounts", accountHandler.List)
		api.GET("/accounts/:id", accountHandler.Get)
		api.POST("/accounts", accountHandler.Create)
		api.PUT("/accounts/:id", accountHandler.Update)
		api.DELETE("/accounts/:id", accountHandler.Delete)

		// Transaction routes
		api.GET("/transactions", transactionHandler.List)
		api.GET("/transactions/:id", transactionHandler.Get)
		api.POST("/transactions", transactionHandler.Create)
		api.PUT("/transactions/:id", transactionHandler.Update)
		api.DELETE("/transactions/:id", transactionHandler.Delete)

		// AI Routes
		api.POST("/ai/insight", aiHandler.GenerateInsight)

		// TODO: Add more routes
		// Category routes
		api.GET("/categories", categoryHandler.List)
		api.POST("/categories", categoryHandler.Create)
		api.PUT("/categories/:id", categoryHandler.Update)
		api.DELETE("/categories/:id", categoryHandler.Delete)

		// Subcategory routes
		api.POST("/subcategories", categoryHandler.CreateSubcategory)
		api.PUT("/subcategories/:id", categoryHandler.UpdateSubcategory)
		api.DELETE("/subcategories/:id", categoryHandler.DeleteSubcategory)

		// Dashboard routes
		api.GET("/dashboard/summary", dashboardHandler.GetSummary)

		// Credit Card routes
		api.GET("/cards", cardHandler.List)
		api.GET("/cards/:id", cardHandler.Get)
		api.POST("/cards", cardHandler.Create)
		api.PUT("/cards/:id", cardHandler.Update)
		api.DELETE("/cards/:id", cardHandler.Delete)

		// TODO: Add more routes
		// - Invoices
		// - Payables
		// - Dashboard
	}

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 Server starting on port %s", port)
	log.Printf("📊 API available at http://localhost:%s/api", port)
	log.Printf("💚 Health check at http://localhost:%s/health", port)

	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
