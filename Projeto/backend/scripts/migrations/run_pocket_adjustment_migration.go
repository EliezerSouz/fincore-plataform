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

	fmt.Println("=== RUNNING MIGRATION: Add pocket_id to account_balance_adjustments ===\n")

	// Add pocket_id column
	fmt.Println("1. Adding pocket_id column...")
	_, err = db.Exec(`
		ALTER TABLE account_balance_adjustments 
		ADD COLUMN IF NOT EXISTS pocket_id UUID REFERENCES pockets(id)
	`)
	if err != nil {
		fmt.Printf("❌ Error: %v\n", err)
		return
	}
	fmt.Println("✅ Column added")

	// Create index
	fmt.Println("\n2. Creating index...")
	_, err = db.Exec(`
		CREATE INDEX IF NOT EXISTS idx_account_balance_adjustments_pocket_id 
		ON account_balance_adjustments(pocket_id)
	`)
	if err != nil {
		fmt.Printf("❌ Error: %v\n", err)
		return
	}
	fmt.Println("✅ Index created")

	// Make account_id nullable
	fmt.Println("\n3. Making account_id nullable...")
	_, err = db.Exec(`
		ALTER TABLE account_balance_adjustments 
		ALTER COLUMN account_id DROP NOT NULL
	`)
	if err != nil {
		fmt.Printf("❌ Error: %v\n", err)
		return
	}
	fmt.Println("✅ account_id is now nullable")

	fmt.Println("\n=== MIGRATION COMPLETED SUCCESSFULLY ===")
}
