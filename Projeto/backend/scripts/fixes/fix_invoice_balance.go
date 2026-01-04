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

	// Restaurar valor correto (já que deletei a transação duplicada, sobrou uma valida de 1236.14)
	valorCorreto := 1236.14

	// Status 'paid' pois 1236.14 >= total (1176.59)
	_, err = db.Exec("UPDATE credit_card_invoices SET paid_amount = $1, status = 'paid' WHERE id=$2", valorCorreto, invoiceID)
	if err != nil {
		fmt.Println("Erro update:", err)
	} else {
		fmt.Println("✅ INVOICE SALDO RESTAURADO CORRETAMENTE!")
	}
}
