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

	fmt.Println("--- POCKETS DISPONÍVEIS ---")
	rows, _ := db.Query(`SELECT p.parent_account_id, p.id, p.name FROM pockets p WHERE p.user_id=$1 AND p.pocket_type='CAIXA'`, userID)
	for rows.Next() {
		var accID sql.NullString
		var pid, pname string
		rows.Scan(&accID, &pid, &pname)

		accStr := "NULL"
		if accID.Valid {
			accStr = accID.String
		}

		fmt.Printf("Account: %s | PocketID: %s | Nome: %s\n", accStr, pid, pname)
	}
}
