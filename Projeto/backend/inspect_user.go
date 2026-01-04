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

	userID := "242ad7f8-f479-45a6-8fb2-cfe8f6cf923d"

	fmt.Println("=== INSPEÇÃO ===")

	rows, _ := db.Query("SELECT id, name FROM accounts WHERE user_id=$1 AND deleted_at IS NULL", userID)
	fmt.Println("\n--- ACCOUNTS (Legado) ---")
	for rows.Next() {
		var id, name string
		rows.Scan(&id, &name)
		fmt.Printf("ID: %s | Nome: %s\n", id, name)
	}
	rows.Close()

	rows2, _ := db.Query("SELECT id, name, parent_account_id, pocket_type FROM pockets WHERE user_id=$1", userID)
	fmt.Println("\n--- POCKETS ---")
	for rows2.Next() {
		var id, name, pType string
		var pid sql.NullString
		rows2.Scan(&id, &name, &pid, &pType)
		parentID := "NULL"
		if pid.Valid {
			parentID = pid.String
		}
		fmt.Printf("ID: %s | Nome: %s | Parent: %s | Type: %s\n", id, name, parentID, pType)
	}
	rows2.Close()

	rows3, _ := db.Query("SELECT COUNT(*) FROM transactions WHERE user_id=$1 AND pocket_id IS NULL", userID)
	var count int
	rows3.Next()
	rows3.Scan(&count)
	fmt.Printf("\n--- TRANSAÇÕES SEM POCKET: %d ---\n", count)
}
