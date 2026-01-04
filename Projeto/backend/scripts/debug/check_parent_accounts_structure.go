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

	fmt.Println("=== PARENT_ACCOUNTS TABLE STRUCTURE ===")
	rows, err := db.Query(`
		SELECT column_name, data_type, is_nullable
		FROM information_schema.columns
		WHERE table_name = 'parent_accounts'
		ORDER BY ordinal_position
	`)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var colName, dataType, nullable string
		rows.Scan(&colName, &dataType, &nullable)
		fmt.Printf("%-30s %-20s %s\n", colName, dataType, nullable)
	}

	// Check if table has any data
	var count int
	db.QueryRow("SELECT COUNT(*) FROM parent_accounts").Scan(&count)
	fmt.Printf("\nTotal records: %d\n", count)
}
