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

	// Get all pockets
	rows, err := db.Query(`
		SELECT id, name, balance
		FROM pockets
		WHERE user_id = $1
	`, userID)

	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}
	defer rows.Close()

	fmt.Println("=== RECALCULATING POCKET BALANCES ===\n")

	for rows.Next() {
		var pocketID, name string
		var currentBalance float64
		rows.Scan(&pocketID, &name, &currentBalance)

		// Calculate correct balance from transactions
		var calculatedBalance float64
		err = db.QueryRow(`
			SELECT COALESCE(SUM(CASE 
				WHEN type = 'receita' THEN amount 
				WHEN type = 'despesa' THEN -amount 
				WHEN type = 'transferencia' THEN 
					CASE 
						WHEN description ILIKE '%recebida%' OR description ILIKE '%de %' THEN amount
						ELSE -amount
					END
				ELSE 0 
			END), 0)
			FROM transactions
			WHERE pocket_id = $1
		`, pocketID).Scan(&calculatedBalance)

		if err != nil {
			fmt.Printf("Error calculating balance for %s: %v\n", name, err)
			continue
		}

		fmt.Printf("Pocket: %s\n", name)
		fmt.Printf("  Current Balance: %.2f\n", currentBalance)
		fmt.Printf("  Calculated Balance: %.2f\n", calculatedBalance)

		if currentBalance != calculatedBalance {
			fmt.Printf("  ⚠️  MISMATCH! Updating...\n")

			_, err = db.Exec(`
				UPDATE pockets
				SET balance = $1, updated_at = NOW()
				WHERE id = $2
			`, calculatedBalance, pocketID)

			if err != nil {
				fmt.Printf("  ❌ Error updating: %v\n", err)
			} else {
				fmt.Printf("  ✅ Updated to %.2f\n", calculatedBalance)
			}
		} else {
			fmt.Printf("  ✅ Balance is correct\n")
		}
		fmt.Println()
	}

	fmt.Println("=== DONE ===")
}
