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

	var total, paid float64
	var status string
	err = db.QueryRow("SELECT total_amount, paid_amount, status FROM credit_card_invoices WHERE id=$1", invoiceID).Scan(&total, &paid, &status)
	if err != nil {
		fmt.Printf("Erro lendo invoice: %v\n", err)
		return
	}

	fmt.Printf("INVOICE DIAGNOSTIC:\n")
	fmt.Printf("ID: %s\n", invoiceID)
	fmt.Printf("Total Amount: %.2f\n", total)
	fmt.Printf("Paid Amount: %.2f\n", paid)
	fmt.Printf("Status: %s\n", status)

	// Listar pagamentos
	rows, _ := db.Query("SELECT id, amount, date FROM transactions WHERE credit_card_invoice_id=$1", invoiceID)
	defer rows.Close()
	fmt.Println("--- Transactions ---")
	count := 0
	var lastID string
	var lastAmount float64

	for rows.Next() {
		var id string
		var amount float64
		var date string
		rows.Scan(&id, &amount, &date)
		fmt.Printf("TxID: %s | Amount: %.2f | Date: %s\n", id, amount, date)
		count++
		lastID = id
		lastAmount = amount
	}

	if count > 1 {
		fmt.Println("\n--- AUTO-FIX INITIATED ---")
		// Deletar o último encontrado (arbitrário pois são iguais)
		fmt.Printf("Deleting Duplicate TxID: %s\n", lastID)

		tx, _ := db.Begin()
		_, err := tx.Exec("DELETE FROM transactions WHERE id=$1", lastID)
		if err != nil {
			fmt.Printf("Error deleting: %v\n", err)
			tx.Rollback()
			return
		}

		// Corrigir paid_amount SE ele estiver duplicado
		// Se paid > total (e total ~ lastAmount), entao foi contado duas vezes
		// Assumindo total = 1236.14. Se paid = 2472.28 -> Precisa subtrair.

		if paid > total+0.01 { // Margem de erro float
			fmt.Printf("Fixing Invoice Paid Amount (Reducing by %.2f)\n", lastAmount)
			_, err = tx.Exec("UPDATE credit_card_invoices SET paid_amount = paid_amount - $1 WHERE id=$2", lastAmount, invoiceID)
			if err != nil {
				fmt.Printf("Error updating invoice: %v\n", err)
				tx.Rollback()
				return
			}
		} else {
			fmt.Println("Invoice Paid Amount seems correct (was not double-counted?), only transaction deleted.")
		}

		err = tx.Commit()
		if err != nil {
			fmt.Println("Error commit:", err)
		} else {
			fmt.Println("✅ DUPLICIDADE CORRIGIDA COM SUCESSO!")
		}
	}
}
