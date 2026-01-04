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
	db, err := sql.Open("pgx", connStr)
	if err != nil {
		panic(err)
	}
	defer db.Close()

	rows, err := db.Query(`
		SELECT column_name, data_type, is_nullable
		FROM information_schema.columns
		WHERE table_name = 'account_balance_adjustments'
	`)
	if err != nil {
		panic(err)
	}
	defer rows.Close()

	fmt.Println("Table: account_balance_adjustments")
	for rows.Next() {
		var col, dtype, null string
		rows.Scan(&col, &dtype, &null)
		fmt.Printf("- %s (%s, %s)\n", col, dtype, null)
	}
}
