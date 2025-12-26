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
	// Load .env
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Get database URL
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL not set")
	}

	// Connect to database
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
	defer pool.Close()

	fmt.Println("✅ Connected to database")
	fmt.Println("========================================")
	fmt.Println("🚀 Executing Pockets Migrations")
	fmt.Println("========================================")
	fmt.Println()

	// Read migration file 1
	fmt.Println("📝 Reading migration: 20251226000000_create_pockets_model.sql")
	migration1, err := os.ReadFile("migrations/20251226000000_create_pockets_model.sql")
	if err != nil {
		log.Fatalf("Failed to read migration file 1: %v\n", err)
	}

	// Execute migration 1
	fmt.Println("⚙️  Executing migration 1...")
	_, err = pool.Exec(ctx, string(migration1))
	if err != nil {
		log.Fatalf("Failed to execute migration 1: %v\n", err)
	}
	fmt.Println("✅ Migration 1 executed successfully!")
	fmt.Println()

	// Read migration file 2
	fmt.Println("📝 Reading migration: 20251226000001_migrate_accounts_to_pockets.sql")
	migration2, err := os.ReadFile("migrations/20251226000001_migrate_accounts_to_pockets.sql")
	if err != nil {
		log.Fatalf("Failed to read migration file 2: %v\n", err)
	}

	// Execute migration 2
	fmt.Println("⚙️  Executing migration 2 (data migration)...")
	fmt.Println("⏳ This may take a few moments...")
	_, err = pool.Exec(ctx, string(migration2))
	if err != nil {
		log.Fatalf("Failed to execute migration 2: %v\n", err)
	}
	fmt.Println("✅ Migration 2 executed successfully!")
	fmt.Println()

	// Validation queries
	fmt.Println("========================================")
	fmt.Println("🔍 Validating Migration Results")
	fmt.Println("========================================")
	fmt.Println()

	// Count parent accounts
	var parentAccountCount int
	err = pool.QueryRow(ctx, "SELECT COUNT(*) FROM parent_accounts").Scan(&parentAccountCount)
	if err != nil {
		log.Printf("Warning: Could not count parent accounts: %v\n", err)
	} else {
		fmt.Printf("✅ Parent Accounts created: %d\n", parentAccountCount)
	}

	// Count pockets
	var pocketCount int
	err = pool.QueryRow(ctx, "SELECT COUNT(*) FROM pockets").Scan(&pocketCount)
	if err != nil {
		log.Printf("Warning: Could not count pockets: %v\n", err)
	} else {
		fmt.Printf("✅ Pockets created: %d\n", pocketCount)
	}

	// Count by pocket type
	rows, err := pool.Query(ctx, "SELECT pocket_type, COUNT(*) FROM pockets GROUP BY pocket_type ORDER BY pocket_type")
	if err != nil {
		log.Printf("Warning: Could not get pocket distribution: %v\n", err)
	} else {
		defer rows.Close()
		fmt.Println("\n📊 Pocket Distribution:")
		for rows.Next() {
			var pocketType string
			var count int
			if err := rows.Scan(&pocketType, &count); err != nil {
				continue
			}
			fmt.Printf("   - %s: %d\n", pocketType, count)
		}
	}

	// Check migration status
	var successCount, errorCount int
	err = pool.QueryRow(ctx, `
		SELECT 
			COUNT(CASE WHEN status = 'SUCCESS' THEN 1 END),
			COUNT(CASE WHEN status = 'ERROR' THEN 1 END)
		FROM migration_audit
		WHERE migration_name = 'accounts_to_pockets'
	`).Scan(&successCount, &errorCount)

	if err != nil {
		log.Printf("Warning: Could not check migration audit: %v\n", err)
	} else {
		fmt.Println("\n📋 Migration Audit:")
		fmt.Printf("   ✅ Success: %d\n", successCount)
		fmt.Printf("   ❌ Errors: %d\n", errorCount)
	}

	fmt.Println()
	fmt.Println("========================================")
	if errorCount == 0 {
		fmt.Println("🎉 ALL MIGRATIONS COMPLETED SUCCESSFULLY!")
	} else {
		fmt.Printf("⚠️  COMPLETED WITH %d ERRORS - Check migration_audit table\n", errorCount)
	}
	fmt.Println("========================================")
	fmt.Println()
	fmt.Println("Next steps:")
	fmt.Println("1. Run validation script: go run cmd/migrate/validate.go")
	fmt.Println("2. Test APIs with the backend running")
	fmt.Println("3. Check TESTING_POCKETS.md for detailed tests")
}
