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

	fmt.Println("========================================")
	fmt.Println("🔍 Checking Migration Errors")
	fmt.Println("========================================")
	fmt.Println()

	// Get error details
	rows, err := pool.Query(ctx, `
		SELECT 
			old_account_id,
			status,
			error_message,
			created_at
		FROM migration_audit
		WHERE migration_name = 'accounts_to_pockets'
		AND status = 'ERROR'
		ORDER BY created_at DESC
	`)

	if err != nil {
		log.Fatalf("Failed to query errors: %v\n", err)
	}
	defer rows.Close()

	errorCount := 0
	for rows.Next() {
		var accountID, status, errorMsg string
		var createdAt interface{}

		if err := rows.Scan(&accountID, &status, &errorMsg, &createdAt); err != nil {
			continue
		}

		errorCount++
		fmt.Printf("❌ Error #%d:\n", errorCount)
		fmt.Printf("   Account ID: %s\n", accountID)
		fmt.Printf("   Error: %s\n", errorMsg)
		fmt.Printf("   Time: %v\n", createdAt)
		fmt.Println()
	}

	if errorCount == 0 {
		fmt.Println("✅ No errors found!")
	} else {
		fmt.Printf("Found %d error(s)\n", errorCount)
	}

	fmt.Println("========================================")
}
