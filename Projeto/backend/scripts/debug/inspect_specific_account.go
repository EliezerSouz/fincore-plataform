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

	targetID := "242ad7f8-f479-45a6-8fb2-cfe8f6cf923d"

	fmt.Printf("Buscando Parent Account %s...\n", targetID)

	var name, itype string
	err = db.QueryRow("SELECT institution_name, institution_type FROM parent_accounts WHERE id=$1", targetID).Scan(&name, &itype)
	if err != nil {
		fmt.Printf("❌ Parent Account NÃO encontrada: %v\n", err)
	} else {
		fmt.Printf("✅ Parent Account encontrada: %s (%s)\n", name, itype)

		fmt.Println("--- POCKETS DESTA CONTA ---")
		rows, _ := db.Query("SELECT id, name, pocket_type FROM pockets WHERE parent_account_id=$1", targetID)
		count := 0
		for rows.Next() {
			var pid, pname, ptype string
			rows.Scan(&pid, &pname, &ptype)
			fmt.Printf("Pocket: %s | ID: %s | Type: %s\n", pname, pid, ptype)
			count++
		}
		if count == 0 {
			fmt.Println("⚠️  Nenhum pocket associado a esta conta.")
		}
	}
}
