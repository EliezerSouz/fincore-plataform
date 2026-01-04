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

	// Get user
	var userID string
	err = db.QueryRow("SELECT id FROM users LIMIT 1").Scan(&userID)
	if err != nil {
		fmt.Printf("Error getting user: %v\n", err)
		return
	}

	fmt.Printf("User ID: %s\n\n", userID)

	// Check parent_accounts
	fmt.Println("=== PARENT ACCOUNTS (Nova Estrutura) ===")
	rows, err := db.Query(`
		SELECT pa.id, pa.name, 
		       (SELECT COUNT(*) FROM pockets WHERE parent_account_id = pa.id) as pocket_count,
		       (SELECT COALESCE(SUM(balance), 0) FROM pockets WHERE parent_account_id = pa.id) as total_balance
		FROM parent_accounts pa
		WHERE pa.user_id = $1
		ORDER BY pa.created_at
	`, userID)

	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var id, name string
		var pocketCount int
		var totalBalance float64
		rows.Scan(&id, &name, &pocketCount, &totalBalance)

		fmt.Printf("Parent Account: %s\n", name)
		fmt.Printf("  ID: %s\n", id)
		fmt.Printf("  Pockets: %d\n", pocketCount)
		fmt.Printf("  Total Balance (sum of pockets): R$ %.2f\n", totalBalance)

		// List pockets
		rows2, _ := db.Query(`
			SELECT id, name, pocket_type, balance
			FROM pockets
			WHERE parent_account_id = $1
			ORDER BY created_at
		`, id)

		for rows2.Next() {
			var pID, pName, pType string
			var pBalance float64
			rows2.Scan(&pID, &pName, &pType, &pBalance)
			fmt.Printf("    - %s (%s): R$ %.2f\n", pName, pType, pBalance)
		}
		rows2.Close()
		fmt.Println()
	}

	// Check legacy accounts
	fmt.Println("\n=== ACCOUNTS (Estrutura Legada) ===")
	rows3, err := db.Query(`
		SELECT id, name, type, balance, is_active
		FROM accounts
		WHERE user_id = $1 AND deleted_at IS NULL
		ORDER BY created_at
	`, userID)

	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}
	defer rows3.Close()

	for rows3.Next() {
		var id, name, accType string
		var balance float64
		var isActive bool
		rows3.Scan(&id, &name, &accType, &balance, &isActive)

		status := "ACTIVE"
		if !isActive {
			status = "INACTIVE"
		}

		fmt.Printf("Account: %s (%s) - %s\n", name, accType, status)
		fmt.Printf("  ID: %s\n", id)
		fmt.Printf("  Balance: R$ %.2f\n", balance)

		// Check if has transactions
		var txCount int
		var txTotal float64
		db.QueryRow(`
			SELECT COUNT(*), COALESCE(SUM(CASE 
				WHEN type = 'receita' THEN amount 
				WHEN type = 'despesa' THEN -amount 
				ELSE 0 
			END), 0)
			FROM transactions
			WHERE account_id = $1 AND deleted_at IS NULL
		`, id).Scan(&txCount, &txTotal)

		fmt.Printf("  Transactions: %d\n", txCount)
		fmt.Printf("  Calculated Balance: R$ %.2f\n", txTotal)

		if txTotal != balance {
			fmt.Printf("  ⚠️  MISMATCH! Difference: R$ %.2f\n", balance-txTotal)
		}
		fmt.Println()
	}
}
