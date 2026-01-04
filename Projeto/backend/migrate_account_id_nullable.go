package main

import (
	"database/sql"
	"fmt"
	"os"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()
	connStr := os.Getenv("DATABASE_URL")
	if connStr == "" {
		connStr = "postgres://postgres:postgres@localhost:5432/financeiro?sslmode=disable"
	}

	db, err := sql.Open("pgx", connStr)
	if err != nil {
		panic(err)
	}
	defer db.Close()

	fmt.Println("=== MIGRATION: Make account_id nullable in transactions ===\n")

	// Step 1: Drop foreign key constraint
	fmt.Println("1. Dropping foreign key constraint...")
	_, err = db.Exec(`
		ALTER TABLE transactions 
		DROP CONSTRAINT IF EXISTS transactions_account_id_fkey
	`)
	if err != nil {
		fmt.Printf("❌ Error: %v\n", err)
		return
	}
	fmt.Println("✅ Constraint dropped")

	// Step 2: Make account_id nullable
	fmt.Println("\n2. Making account_id nullable...")
	_, err = db.Exec(`
		ALTER TABLE transactions 
		ALTER COLUMN account_id DROP NOT NULL
	`)
	if err != nil {
		fmt.Printf("❌ Error: %v\n", err)
		return
	}
	fmt.Println("✅ account_id is now nullable")

	// Step 3: Add comment
	fmt.Println("\n3. Adding comment...")
	_, err = db.Exec(`
		COMMENT ON COLUMN transactions.account_id IS 
		'Legacy account ID. For new transactions, use pocket_id instead. Can be null.'
	`)
	if err != nil {
		fmt.Printf("❌ Error: %v\n", err)
		return
	}
	fmt.Println("✅ Comment added")

	fmt.Println("\n=== MIGRATION COMPLETED SUCCESSFULLY ===")
	fmt.Println("\nNow transactions can be created with:")
	fmt.Println("- pocket_id (required for new structure)")
	fmt.Println("- account_id (optional, for legacy compatibility)")
}
