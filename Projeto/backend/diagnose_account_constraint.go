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

	fmt.Println("=== CHECKING TRANSACTIONS TABLE CONSTRAINTS ===\n")

	// Check current constraint
	rows, err := db.Query(`
		SELECT 
			tc.constraint_name,
			tc.table_name,
			kcu.column_name,
			ccu.table_name AS foreign_table_name,
			ccu.column_name AS foreign_column_name
		FROM information_schema.table_constraints AS tc
		JOIN information_schema.key_column_usage AS kcu
			ON tc.constraint_name = kcu.constraint_name
		JOIN information_schema.constraint_column_usage AS ccu
			ON ccu.constraint_name = tc.constraint_name
		WHERE tc.table_name = 'transactions'
			AND tc.constraint_type = 'FOREIGN KEY'
			AND kcu.column_name = 'account_id'
	`)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}
	defer rows.Close()

	fmt.Println("Current constraint:")
	for rows.Next() {
		var constraintName, tableName, columnName, foreignTable, foreignColumn string
		rows.Scan(&constraintName, &tableName, &columnName, &foreignTable, &foreignColumn)
		fmt.Printf("  %s: %s.%s -> %s.%s\n",
			constraintName, tableName, columnName, foreignTable, foreignColumn)
	}

	fmt.Println("\n=== SOLUTION ===")
	fmt.Println("The transactions.account_id currently points to 'accounts' table.")
	fmt.Println("But we're using 'parent_accounts' IDs for pocket transfers.")
	fmt.Println("\nOptions:")
	fmt.Println("1. Make account_id nullable and use only pocket_id for new transactions")
	fmt.Println("2. Update constraint to allow both accounts and parent_accounts")
	fmt.Println("3. Always use a valid account_id from the accounts table")

	fmt.Println("\n=== RECOMMENDATION ===")
	fmt.Println("Since pocket_id is already being used, we should:")
	fmt.Println("1. Make account_id nullable")
	fmt.Println("2. Remove the foreign key constraint on account_id")
	fmt.Println("3. Rely on pocket_id for new transactions")
}
