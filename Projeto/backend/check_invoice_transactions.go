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

	invoiceID := "ccc1d751-1b75-4e38-8849-2c4b7663735b"

	fmt.Println("=== CHECKING INVOICE AND TRANSACTIONS ===")

	// Check invoice
	var total, paid float64
	var status string
	err = db.QueryRow(`
		SELECT total_amount, paid_amount, status 
		FROM credit_card_invoices 
		WHERE id = $1
	`, invoiceID).Scan(&total, &paid, &status)

	if err != nil {
		fmt.Printf("Invoice not found: %v\n", err)
		return
	}

	fmt.Printf("Invoice: Total=%.2f, Paid=%.2f, Status=%s\n\n", total, paid, status)

	// Check transactions
	fmt.Println("=== TRANSACTIONS FOR THIS INVOICE ===")
	rows, err := db.Query(`
		SELECT id, description, amount, date, deleted_at
		FROM transactions
		WHERE credit_card_invoice_id = $1
		ORDER BY date
	`, invoiceID)

	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}
	defer rows.Close()

	count := 0
	for rows.Next() {
		var id, desc string
		var amount float64
		var date string
		var deletedAt sql.NullString

		rows.Scan(&id, &desc, &amount, &date, &deletedAt)

		status := "ACTIVE"
		if deletedAt.Valid {
			status = "DELETED"
		}

		fmt.Printf("ID: %s\n", id)
		fmt.Printf("  Description: %s\n", desc)
		fmt.Printf("  Amount: %.2f\n", amount)
		fmt.Printf("  Date: %s\n", date)
		fmt.Printf("  Status: %s\n", status)
		if deletedAt.Valid {
			fmt.Printf("  Deleted At: %s\n", deletedAt.String)
		}
		fmt.Println()

		count++
	}

	fmt.Printf("Total transactions found: %d\n", count)

	if count == 0 {
		fmt.Println("\n❌ NO TRANSACTIONS FOUND!")
		fmt.Println("This means the payment transaction was deleted.")
		fmt.Println("The invoice shows paid_amount=1236.14 but has no transaction!")
		fmt.Println("\nSOLUTION: Need to recreate the payment transaction.")
	}
}
