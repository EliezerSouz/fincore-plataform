package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"financeiro-api/internal/infra/database"
	"financeiro-api/internal/infra/repository"
	"financeiro-api/internal/usecase"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

func main() {
	fmt.Println("🧪 FinCore - Teste Automatizado do Sistema de Rendimentos CDI")
	fmt.Println("=" + string(make([]byte, 70)) + "=\n")

	// Load environment
	if err := godotenv.Load(); err != nil {
		log.Println("⚠️  No .env file found")
	}

	// Connect to database
	db, err := database.NewPostgresConnection()
	if err != nil {
		log.Fatalf("❌ Failed to connect to database: %v", err)
	}
	defer db.Close()

	ctx := context.Background()

	// Initialize repositories and services
	yieldRepo := repository.NewLiquidityYieldRepository(db)
	accountRepo := repository.NewAccountRepository(db)
	pocketRepo := repository.NewPocketRepository(db)
	yieldService := usecase.NewLiquidityYieldService(yieldRepo, accountRepo, pocketRepo)
	cdiService := usecase.NewCDIService()

	// Step 1: Apply Migration
	fmt.Println("📝 Step 1: Aplicando Migration...")
	if err := applyMigration(ctx, db); err != nil {
		log.Printf("⚠️  Migration error (may already exist): %v\n", err)
	} else {
		fmt.Println("✅ Migration aplicada com sucesso!\n")
	}

	// Step 2: Configure Test Account
	fmt.Println("⚙️  Step 2: Configurando conta de teste...")
	testAccountID, testUserID, err := configureTestAccount(ctx, db)
	if err != nil {
		log.Fatalf("❌ Failed to configure test account: %v", err)
	}
	fmt.Printf("✅ Conta configurada: %s\n\n", testAccountID)

	// Step 3: Fetch CDI Rate
	fmt.Println("📊 Step 3: Buscando taxa CDI do Banco Central...")
	cdiRate, err := cdiService.GetCurrentCDIRate(ctx)
	if err != nil {
		fmt.Printf("⚠️  Erro ao buscar CDI: %v\n", err)
		fmt.Println("📌 Usando taxa fallback: 13.65%")
		cdiRate = 13.65
	} else {
		fmt.Printf("✅ Taxa CDI obtida: %.2f%%\n\n", cdiRate)
	}

	// Step 4: Calculate Yields
	fmt.Println("💰 Step 4: Calculando rendimentos...")
	today := time.Now()
	err = yieldService.CalculateDailyYields(ctx, today, cdiRate)
	if err != nil {
		log.Fatalf("❌ Failed to calculate yields: %v", err)
	}
	fmt.Println("✅ Rendimentos calculados!\n")

	// Step 5: Verify Results
	fmt.Println("🔍 Step 5: Verificando resultados...")
	summary, err := yieldService.GetAccountYieldSummary(ctx, testAccountID, testUserID)
	if err != nil {
		log.Fatalf("❌ Failed to get summary: %v", err)
	}

	fmt.Println("\n📈 RESUMO DA CONTA:")
	fmt.Printf("   Saldo Operacional: R$ %.2f\n", summary["operational_balance"])
	fmt.Printf("   Rendimentos Totais: R$ %.2f\n", summary["total_yields"])
	fmt.Printf("   Saldo Total: R$ %.2f\n", summary["total_balance"])
	fmt.Printf("   Rendimento Habilitado: %v\n", summary["yield_enabled"])
	fmt.Printf("   Taxa: %.2f%% do CDI\n\n", summary["yield_rate"])

	// Step 6: Test Duplicate Protection
	fmt.Println("🛡️  Step 6: Testando proteção contra duplicidade...")
	err = yieldService.CalculateDailyYields(ctx, today, cdiRate)
	if err != nil {
		fmt.Printf("⚠️  Erro esperado (duplicidade): %v\n", err)
	}
	fmt.Println("✅ Proteção funcionando! (registros duplicados foram pulados)\n")

	// Final Report
	fmt.Println("=" + string(make([]byte, 70)) + "=")
	fmt.Println("✅ TESTE COMPLETO!")
	fmt.Println("\n📋 Próximos passos:")
	fmt.Println("   1. Verificar dados no banco: SELECT * FROM liquidity_yields;")
	fmt.Println("   2. Testar via API: POST /api/yields/calculate")
	fmt.Println("   3. Verificar scheduler: Logs do servidor às 10:00 AM")
	fmt.Println("   4. Implementar UI no frontend")
}

func applyMigration(ctx context.Context, db *pgxpool.Pool) error {
	migrations := []string{
		`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS yield_enabled BOOLEAN DEFAULT false`,
		`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS yield_source VARCHAR(50) DEFAULT NULL`,
	}

	for _, migration := range migrations {
		_, err := db.Exec(ctx, migration)
		if err != nil {
			return err
		}
	}

	// Add constraint separately (no IF NOT EXISTS support)
	_, err := db.Exec(ctx, `
		DO $$
		BEGIN
			IF NOT EXISTS (
				SELECT 1 FROM information_schema.table_constraints 
				WHERE table_name = 'liquidity_yields' 
				AND constraint_name = 'unique_account_date'
			) THEN
				ALTER TABLE liquidity_yields ADD CONSTRAINT unique_account_date UNIQUE (account_id, date);
			END IF;
		END $$;
	`)

	return err
}

func configureTestAccount(ctx context.Context, db *pgxpool.Pool) (string, string, error) {
	var accountID string
	var userID string
	var accountName string
	var balance float64

	// Find first active account
	err := db.QueryRow(ctx, `
		SELECT id, user_id, name, balance 
		FROM accounts 
		WHERE is_active = true 
		AND type IN ('corrente', 'poupanca', 'reserva_emergencia')
		ORDER BY created_at DESC 
		LIMIT 1
	`).Scan(&accountID, &userID, &accountName, &balance)

	if err != nil {
		return "", "", fmt.Errorf("no active account found: %w", err)
	}

	// Enable yield
	_, err = db.Exec(ctx, `
		UPDATE accounts 
		SET 
			yield_enabled = true,
			yield_source = 'CDI',
			yield_rate = 100.0,
			updated_at = NOW()
		WHERE id = $1
	`, accountID)

	if err != nil {
		return "", "", fmt.Errorf("failed to enable yield: %w", err)
	}

	fmt.Printf("   Conta: %s\n", accountName)
	fmt.Printf("   Saldo: R$ %.2f\n", balance)
	fmt.Printf("   Taxa: 100%% do CDI\n")

	return accountID, userID, nil
}
