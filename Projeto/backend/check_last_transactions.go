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

	fmt.Println("=== ÚLTIMAS TRANSAÇÕES CRIADAS ===\n")

	rows, err := db.Query(`
		SELECT 
			t.id,
			t.description,
			t.amount,
			t.type,
			t.date,
			t.pocket_id,
			p.name as pocket_name,
			t.category_id,
			c.name as category_name,
			t.related_transaction_id,
			t.created_at
		FROM transactions t
		LEFT JOIN pockets p ON t.pocket_id = p.id
		LEFT JOIN categories c ON t.category_id = c.id
		ORDER BY t.created_at DESC
		LIMIT 10
	`)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}
	defer rows.Close()

	fmt.Println("ID                                   | DESCRIÇÃO                | VALOR    | TIPO      | POCKET           | CATEGORIA        | RELACIONADA")
	fmt.Println("-------------------------------------|--------------------------|----------|-----------|------------------|------------------|-------------")

	for rows.Next() {
		var id, desc, txType, date string
		var amount float64
		var pocketID, pocketName, categoryID, categoryName, relatedID sql.NullString
		var createdAt string

		rows.Scan(&id, &desc, &amount, &txType, &date, &pocketID, &pocketName, &categoryID, &categoryName, &relatedID, &createdAt)

		pocketStr := "N/A"
		if pocketName.Valid {
			pocketStr = pocketName.String
		}

		categoryStr := "SEM CATEGORIA"
		if categoryName.Valid {
			categoryStr = categoryName.String
		}

		relatedStr := "N/A"
		if relatedID.Valid {
			relatedStr = relatedID.String[:8] + "..."
		}

		fmt.Printf("%-36s | %-24s | %8.2f | %-9s | %-16s | %-16s | %s\n",
			id[:36], truncate(desc, 24), amount, txType, truncate(pocketStr, 16), truncate(categoryStr, 16), relatedStr)
	}

	fmt.Println("\n=== SALDOS ATUAIS DOS POCKETS ===\n")

	rows2, _ := db.Query(`
		SELECT id, name, pocket_type, balance
		FROM pockets
		ORDER BY created_at
	`)
	defer rows2.Close()

	fmt.Println("ID                                   | NOME                 | TIPO           | SALDO")
	fmt.Println("-------------------------------------|----------------------|----------------|----------")

	for rows2.Next() {
		var id, name, pType string
		var balance float64
		rows2.Scan(&id, &name, &pType, &balance)
		fmt.Printf("%-36s | %-20s | %-14s | R$ %.2f\n", id[:36], name, pType, balance)
	}
}

func truncate(s string, max int) string {
	if len(s) <= max {
		return s
	}
	return s[:max-3] + "..."
}
