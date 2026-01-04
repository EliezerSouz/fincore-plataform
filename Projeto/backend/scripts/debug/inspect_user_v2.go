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

	// 1. Mostrar quais Accounts ESTÃO Mapeadas para Pockets CAIXA
	fmt.Println("--- CONTAS COM POCKETS (Mapeadas) ---")
	rowsP, _ := db.Query(`SELECT p.parent_account_id, p.name FROM pockets p WHERE p.user_id=$1 AND p.pocket_type='CAIXA' AND p.parent_account_id IS NOT NULL`, userID)
	mappedIDs := make(map[string]bool)
	for rowsP.Next() {
		var pid, pname string
		rowsP.Scan(&pid, &pname)
		mappedIDs[pid] = true
		fmt.Printf("AccountID: %s -> Pocket: %s\n", pid, pname)
	}
	rowsP.Close()

	// 2. Mostrar Accounts das Transações Falhas
	fmt.Println("\n--- TRANSAÇÕES SEM POCKET (Amostra) ---")
	rowsTx, _ := db.Query(`SELECT id, description, account_id FROM transactions WHERE user_id=$1 AND pocket_id IS NULL AND deleted_at IS NULL LIMIT 20`, userID)
	for rowsTx.Next() {
		var tid, desc string
		var accID sql.NullString
		rowsTx.Scan(&tid, &desc, &accID)

		accStr := "NULL"
		match := "NÃO"
		if accID.Valid {
			accStr = accID.String
			if mappedIDs[accStr] {
				match = "SIM"
			}
		}

		fmt.Printf("Tx: %-20s | AccID: %s | Match: %s\n", desc[:min(len(desc), 20)], accStr, match)
	}
}
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
