package main

import (
	"database/sql"
	"fmt"
	"os"
	"time"

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

	fmt.Println("=== TODAS AS TRANSFERÊNCIAS (ÚLTIMAS 20) ===\n")

	rows, err := db.Query(`
		SELECT 
			t.id,
			t.description,
			t.amount,
			p.name as pocket_name,
			t.created_at,
			t.deleted_at
		FROM transactions t
		LEFT JOIN pockets p ON t.pocket_id = p.id
		WHERE t.type = 'transferencia'
		ORDER BY t.created_at DESC
		LIMIT 20
	`)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var id, desc string
		var pocketName sql.NullString
		var amount float64
		var createdAt time.Time
		var deletedAt sql.NullTime

		err := rows.Scan(&id, &desc, &amount, &pocketName, &createdAt, &deletedAt)
		if err != nil {
			fmt.Printf("Scan error: %v\n", err)
			continue
		}

		status := "✅ ATIVA"
		if deletedAt.Valid {
			status = "❌ DELETADA"
		}

		pName := "N/A"
		if pocketName.Valid {
			pName = pocketName.String
		}

		fmt.Printf("%s | R$ %8.2f | %-16s | %s | %s\n",
			createdAt.Format("2006-01-02 15:04:05"), amount, pName, status, desc)
	}
}
