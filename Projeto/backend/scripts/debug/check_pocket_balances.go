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

	// List all pockets
	fmt.Println("=== POCKETS ===")
	rows, err := db.Query(`
		SELECT p.id, p.name, p.pocket_type, p.balance, p.parent_account_id
		FROM pockets p
		WHERE p.user_id = $1
		ORDER BY p.created_at
	`, userID)

	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}
	defer rows.Close()

	var pockets []struct {
		ID              string
		Name            string
		Type            string
		Balance         float64
		ParentAccountID string
	}

	for rows.Next() {
		var p struct {
			ID              string
			Name            string
			Type            string
			Balance         float64
			ParentAccountID string
		}
		rows.Scan(&p.ID, &p.Name, &p.Type, &p.Balance, &p.ParentAccountID)
		pockets = append(pockets, p)
		fmt.Printf("ID: %s\n", p.ID)
		fmt.Printf("  Name: %s\n", p.Name)
		fmt.Printf("  Type: %s\n", p.Type)
		fmt.Printf("  Balance: %.2f\n", p.Balance)
		fmt.Printf("  Parent Account: %s\n\n", p.ParentAccountID)
	}

	// For each pocket, show recent transactions
	for _, pocket := range pockets {
		fmt.Printf("=== TRANSACTIONS FOR POCKET: %s ===\n", pocket.Name)

		var txCount int
		var txTotal float64

		err = db.QueryRow(`
			SELECT COUNT(*), COALESCE(SUM(CASE 
				WHEN type = 'receita' THEN amount 
				WHEN type = 'despesa' THEN -amount 
				ELSE 0 
			END), 0)
			FROM transactions
			WHERE pocket_id = $1
		`, pocket.ID).Scan(&txCount, &txTotal)

		if err != nil {
			fmt.Printf("Error: %v\n", err)
			continue
		}

		fmt.Printf("Transaction Count: %d\n", txCount)
		fmt.Printf("Calculated Balance (from transactions): %.2f\n", txTotal)
		fmt.Printf("Pocket Balance (stored): %.2f\n", pocket.Balance)

		if txTotal != pocket.Balance {
			fmt.Printf("⚠️  MISMATCH! Difference: %.2f\n", pocket.Balance-txTotal)
		} else {
			fmt.Printf("✅ Balance matches!\n")
		}

		// Show last 5 transactions
		fmt.Println("\nLast 5 transactions:")
		rows2, _ := db.Query(`
			SELECT date, description, type, amount
			FROM transactions
			WHERE pocket_id = $1
			ORDER BY date DESC, created_at DESC
			LIMIT 5
		`, pocket.ID)
		defer rows2.Close()

		for rows2.Next() {
			var date, desc, txType string
			var amount float64
			rows2.Scan(&date, &desc, &txType, &amount)

			sign := "+"
			if txType == "despesa" {
				sign = "-"
			}

			fmt.Printf("  %s | %s | %s%.2f | %s\n",
				date[:10], txType, sign, amount, truncate(desc, 30))
		}
		fmt.Println()
	}
}

func truncate(s string, max int) string {
	if len(s) <= max {
		return s
	}
	return s[:max-3] + "..."
}
