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

	accountID := "242ad7f8-f479-45a6-8fb2-cfe8f6cf923d"

	fmt.Println("=== CHECKING ACCOUNT ===")
	var name, accType string
	var balance float64
	err = db.QueryRow(`
		SELECT name, type, balance 
		FROM accounts 
		WHERE id = $1
	`, accountID).Scan(&name, &accType, &balance)

	if err != nil {
		fmt.Printf("❌ Account NOT found in accounts table: %v\n", err)

		// Check if it's a parent account
		fmt.Println("\n=== CHECKING PARENT ACCOUNTS ===")
		var paName string
		err = db.QueryRow(`
			SELECT name 
			FROM parent_accounts 
			WHERE id = $1
		`, accountID).Scan(&paName)

		if err != nil {
			fmt.Printf("❌ Also NOT found in parent_accounts: %v\n", err)
		} else {
			fmt.Printf("✅ Found in parent_accounts: %s\n", paName)

			// List pockets for this parent account
			fmt.Println("\n=== POCKETS FOR THIS PARENT ACCOUNT ===")
			rows, _ := db.Query(`
				SELECT id, name, pocket_type, balance 
				FROM pockets 
				WHERE parent_account_id = $1 AND deleted_at IS NULL
			`, accountID)
			defer rows.Close()

			count := 0
			for rows.Next() {
				var id, name, pType string
				var bal float64
				rows.Scan(&id, &name, &pType, &bal)
				fmt.Printf("Pocket: %s | %s | Type: %s | Balance: %.2f\n", id, name, pType, bal)
				count++
			}

			if count == 0 {
				fmt.Println("❌ NO POCKETS found for this parent account!")
			}
		}
	} else {
		fmt.Printf("✅ Found in accounts: %s | Type: %s | Balance: %.2f\n", name, accType, balance)
	}

	// Check all tables to understand the structure
	fmt.Println("\n=== ALL TABLES IN DATABASE ===")
	rows, _ := db.Query(`
		SELECT table_name 
		FROM information_schema.tables 
		WHERE table_schema = 'public' 
		  AND table_type = 'BASE TABLE'
		ORDER BY table_name
	`)
	defer rows.Close()

	for rows.Next() {
		var tableName string
		rows.Scan(&tableName)
		fmt.Println(tableName)
	}
}
