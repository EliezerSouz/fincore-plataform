package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	databaseURL := os.Getenv("DATABASE_URL")
	pool, err := pgxpool.New(context.Background(), databaseURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
	defer pool.Close()

	ctx := context.Background()

	fmt.Println("========================================")
	fmt.Println("🔧 Executing Fix & Retry")
	fmt.Println("========================================")
	fmt.Println()

	// 1. Execute FIX
	fmt.Println("📝 Reading fix migration: fix_pockets_constraint.sql")
	fixMigration, err := os.ReadFile("migrations/fix_pockets_constraint.sql")
	if err != nil {
		log.Fatalf("Failed to read fix migration: %v\n", err)
	}

	fmt.Println("⚙️  Executing FIX...")
	_, err = pool.Exec(ctx, string(fixMigration))
	if err != nil {
		log.Fatalf("Failed to execute fix migration: %v\n", err)
	}
	fmt.Println("✅ Fix executed successfully!")
	fmt.Println()

	// 2. Retry Data Migration
	fmt.Println("📝 Reading data migration: 20251226000001_migrate_accounts_to_pockets.sql")
	dataMigration, err := os.ReadFile("migrations/20251226000001_migrate_accounts_to_pockets.sql")
	if err != nil {
		log.Fatalf("Failed to read data migration: %v\n", err)
	}

	fmt.Println("⚙️  Retrying data migration...")
	_, err = pool.Exec(ctx, string(dataMigration))
	if err != nil {
		log.Fatalf("Failed to retry execution: %v\n", err)
	}
	fmt.Println("✅ Data migration retry executed successfully!")
	fmt.Println()

	// 3. Check Results
	var successCount, errorCount int
	err = pool.QueryRow(ctx, `
		SELECT 
			COUNT(CASE WHEN status = 'SUCCESS' THEN 1 END),
			COUNT(CASE WHEN status = 'ERROR' THEN 1 END)
		FROM migration_audit
		WHERE migration_name = 'accounts_to_pockets'
	`).Scan(&successCount, &errorCount)

	fmt.Println("========================================")
	fmt.Println("📊 Final Results")
	fmt.Printf("   ✅ Success: %d\n", successCount)
	fmt.Printf("   ❌ Errors: %d\n", errorCount)
	fmt.Println("========================================")
}
