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

	userID := "2b94dd60-8550-4dbe-9705-9ff0540179c4"

	fmt.Println("⚠️  LIMPEZA - TENTATIVA 3 (Principais) ⚠️")

	// Removidas tabelas filhas que podem não ter user_id direto
	tables := []string{
		"investments",
		"account_balance_adjustments",
		"transactions",
		"credit_card_invoices",
		"payables",
		"pockets",
		"parent_accounts",
		"accounts",
		"credit_cards",
	}

	tx, err := db.Begin()
	if err != nil {
		panic(err)
	}

	for _, table := range tables {
		fmt.Printf("Limpando %s... ", table)
		_, err := tx.Exec(fmt.Sprintf("DELETE FROM %s WHERE user_id = $1", table), userID)
		if err != nil {
			tx.Rollback()
			fmt.Printf("\n❌ Erro em %s: %v\n", table, err)
			return
		}
		fmt.Println("OK")
	}

	err = tx.Commit()
	if err != nil {
		fmt.Printf("❌ Erro no Commit: %v\n", err)
	} else {
		fmt.Println("\n✅ DADOS ZERADOS COM SUCESSO.")
	}
}
