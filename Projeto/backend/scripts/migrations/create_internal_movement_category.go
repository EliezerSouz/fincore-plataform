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

	fmt.Println("=== CRIANDO CATEGORIA 'MOVIMENTAÇÃO INTERNA' ===\n")

	// Get all users
	rows, err := db.Query("SELECT id FROM users")
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var userID string
		rows.Scan(&userID)

		// Check if category already exists
		var exists bool
		err = db.QueryRow(`
			SELECT EXISTS(
				SELECT 1 FROM categories 
				WHERE user_id = $1 AND name = 'MOVIMENTAÇÃO INTERNA'
			)
		`, userID).Scan(&exists)

		if exists {
			fmt.Printf("User %s: Categoria já existe ✓\n", userID[:8]+"...")
			continue
		}

		// Create category
		_, err = db.Exec(`
			INSERT INTO categories (user_id, name, type, icon, color, created_at, updated_at)
			VALUES ($1, 'MOVIMENTAÇÃO INTERNA', 'ambas', 'arrow-left-right', '#6366f1', NOW(), NOW())
		`, userID)

		if err != nil {
			fmt.Printf("User %s: ❌ Erro ao criar categoria: %v\n", userID[:8]+"...", err)
		} else {
			fmt.Printf("User %s: ✅ Categoria criada com sucesso\n", userID[:8]+"...")
		}
	}

	fmt.Println("\n=== CONCLUÍDO ===")
}
