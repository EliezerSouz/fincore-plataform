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

	_ "financeiro-api/docs"
)

// @title           FinCore API
// @version         1.0
// @description     API de Gestão Financeira Pessoal e Empresarial.
// @termsOfService  http://swagger.io/terms/

// @contact.name   API Support
// @contact.url    http://www.swagger.io/support
// @contact.email  support@swagger.io

// @license.name  Apache 2.0
// @license.url   http://www.apache.org/licenses/LICENSE-2.0.html

// @host      localhost:8080
// @BasePath  /api

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
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
	payableRepo := repository.NewPayableRepository(dbPool)
	invoiceRepo := repository.NewInvoiceRepository(dbPool)
	balanceAdjustmentRepo := repository.NewBalanceAdjustmentRepository(dbPool)
	paymentMethodRepo := repository.NewPaymentMethodRepository(dbPool)

	// Initialize use cases/services
	userService := usecase.NewUserService(userRepo)
	invoiceService := usecase.NewInvoiceService(invoiceRepo, transactionRepo)
	payableService := usecase.NewPayableService(payableRepo, transactionRepo)

	// Initialize handlers
	userHandler := handler.NewUserHandler(userService)
	accountHandler := handler.NewAccountHandler(accountRepo)
	transactionHandler := handler.NewTransactionHandler(transactionRepo)
	categoryHandler := handler.NewCategoryHandler(categoryRepo)
	dashboardHandler := handler.NewDashboardHandler(dashboardRepo)
	cardHandler := handler.NewCardHandler(cardRepo)
	payableHandler := handler.NewPayableHandler(payableRepo, payableService)
	invoiceHandler := handler.NewInvoiceHandler(invoiceService)
	balanceAdjustmentHandler := handler.NewBalanceAdjustmentHandler(balanceAdjustmentRepo)
	paymentMethodHandler := handler.NewPaymentMethodHandler(paymentMethodRepo)
	aiHandler := handler.NewAIHandler()

	// Setup Gin
	r := gin.Default()

	// Apply Logger middleware
	r.Use(middleware.LoggerMiddleware())

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
	// TEMPORÁRIO: Bypass de autenticação para testes
	// TODO: REMOVER ANTES DE PRODUÇÃO!
	api.Use(middleware.AuthBypass())
	// api.Use(middleware.AuthMiddleware()) // Comentado temporariamente
	{
		// User routes
		api.GET("/users/me", userHandler.GetMe)
		api.POST("/users/setup", userHandler.Setup)
		api.PUT("/users/primary-card", userHandler.SetPrimaryCard)

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
		api.POST("/transfers", transactionHandler.CreateTransfer)

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

		// Payables routes
		payables := api.Group("/payables")
		{
			payables.GET("", payableHandler.List)
			payables.POST("", payableHandler.Create)
			payables.POST("/:id/pay", payableHandler.Pay)
			payables.POST("/:id/revert", payableHandler.Revert)
			payables.PUT("/:id", payableHandler.Update)
			payables.DELETE("/:id", payableHandler.Delete)
		}

		// Balance Adjustment routes
		api.GET("/balance-adjustments", balanceAdjustmentHandler.ListByAccount)
		api.POST("/balance-adjustments", balanceAdjustmentHandler.Create)
		api.PUT("/balance-adjustments/:id", balanceAdjustmentHandler.Update)
		api.DELETE("/balance-adjustments/:id", balanceAdjustmentHandler.Delete)

		// Payment Method routes
		api.GET("/payment-methods", paymentMethodHandler.List)

		// Invoice routes
		api.GET("/cards/:id/invoices", invoiceHandler.GetInvoicesByCard)
		api.GET("/invoices/:id", invoiceHandler.GetInvoiceDetails)
		api.POST("/invoices/transactions", invoiceHandler.CreateTransaction)
		api.PUT("/invoices/transactions/:id", invoiceHandler.UpdateTransaction)
		api.DELETE("/invoices/transactions/:id", invoiceHandler.DeleteTransaction)
		api.POST("/invoices/:id/pay", invoiceHandler.PayInvoice)
		api.POST("/invoices/:id/revert", invoiceHandler.RevertPayment)

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
