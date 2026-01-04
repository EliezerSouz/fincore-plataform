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

	// Get user
	var userID string
	db.QueryRow("SELECT id FROM users LIMIT 1").Scan(&userID)

	// Get category ID
	var categoryID string
	err = db.QueryRow(`
		SELECT id FROM categories 
		WHERE user_id = $1 AND name = 'MOVIMENTAÇÃO INTERNA'
	`, userID).Scan(&categoryID)

	if err != nil {
		fmt.Printf("❌ Categoria 'MOVIMENTAÇÃO INTERNA' não encontrada: %v\n", err)
		return
	}

	fmt.Printf("✅ Categoria ID: %s\n\n", categoryID)

	// Update recent transfers without category
	fmt.Println("Atualizando transferências sem categoria...")

	result, err := db.Exec(`
		UPDATE transactions
		SET category_id = $1
		WHERE type = 'transferencia'
		  AND category_id IS NULL
		  AND created_at >= NOW() - INTERVAL '1 hour'
	`, categoryID)

	if err != nil {
		fmt.Printf("❌ Erro: %v\n", err)
		return
	}

	rows, _ := result.RowsAffected()
	fmt.Printf("✅ %d transações atualizadas com a categoria\n", rows)
}
