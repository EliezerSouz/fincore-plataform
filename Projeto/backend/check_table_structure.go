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

	fmt.Println("=== POCKETS TABLE STRUCTURE ===")
	rows, err := db.Query(`
		SELECT column_name, data_type, is_nullable
		FROM information_schema.columns
		WHERE table_name = 'pockets'
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

	fmt.Println("\n=== ACCOUNTS TABLE STRUCTURE ===")
	rows2, err := db.Query(`
		SELECT column_name, data_type, is_nullable
		FROM information_schema.columns
		WHERE table_name = 'accounts'
		ORDER BY ordinal_position
	`)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}
	defer rows2.Close()

	for rows2.Next() {
		var colName, dataType, nullable string
		rows2.Scan(&colName, &dataType, &nullable)
		fmt.Printf("%-30s %-20s %s\n", colName, dataType, nullable)
	}
}
