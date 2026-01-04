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
	err = db.QueryRow("SELECT id FROM users LIMIT 1").Scan(&userID)
	if err != nil {
		fmt.Printf("Error getting user: %v\n", err)
		return
	}

	fmt.Printf("User ID: %s\n\n", userID)

	startDate := "2025-11-01"
	endDate := "2025-11-30"

	fmt.Println("=== TRANSAÇÕES DE NOVEMBRO 2025 ===\n")

	// Query similar to dashboard (excluding transfers)
	query := `
		SELECT t.date, t.description, COALESCE(c.name, 'Sem Categoria'), t.amount, 
		       t.type, t.related_transaction_id, t.deleted_at
		FROM transactions t
		LEFT JOIN categories c ON t.category_id = c.id
		WHERE t.user_id = $1 
		  AND t.date >= $2 AND t.date <= $3
		  AND t.related_transaction_id IS NULL
		  AND (c.name IS NULL OR c.name NOT ILIKE 'Transferência%')
		ORDER BY t.date, t.description
	`

	rows, err := db.Query(query, userID, startDate, endDate)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}
	defer rows.Close()

	fmt.Println("DATA       | TIPO      | CATEGORIA              | DESCRIÇÃO                              | VALOR    | STATUS")
	fmt.Println("-----------|-----------|------------------------|----------------------------------------|----------|--------")

	var totalReceitas float64
	var totalDespesas float64
	countReceitas := 0
	countDespesas := 0

	for rows.Next() {
		var date, desc, cat, txType string
		var amount float64
		var relatedID sql.NullString
		var deletedAt sql.NullString

		rows.Scan(&date, &desc, &cat, &amount, &txType, &relatedID, &deletedAt)

		status := "ACTIVE"
		if deletedAt.Valid {
			status = "DELETED"
		}

		fmt.Printf("%-10s | %-9s | %-22s | %-38s | %8.2f | %s\n",
			date[:10],
			txType,
			truncate(cat, 22),
			truncate(desc, 38),
			amount,
			status)

		if deletedAt.Valid {
			continue // Skip deleted transactions from totals
		}

		if txType == "receita" {
			totalReceitas += amount
			countReceitas++
		} else if txType == "despesa" {
			totalDespesas += amount
			countDespesas++
		}
	}

	fmt.Println("-----------|-----------|------------------------|----------------------------------------|----------|--------")
	fmt.Printf("\nRESUMO:\n")
	fmt.Printf("Receitas: R$ %.2f (%d transações)\n", totalReceitas, countReceitas)
	fmt.Printf("Despesas: R$ %.2f (%d transações)\n", totalDespesas, countDespesas)
	fmt.Printf("Resultado: R$ %.2f\n", totalReceitas-totalDespesas)

	// Check if there are deleted transactions
	var deletedCount int
	db.QueryRow(`
		SELECT COUNT(*)
		FROM transactions
		WHERE user_id = $1 
		  AND date >= $2 AND date <= $3
		  AND deleted_at IS NOT NULL
	`, userID, startDate, endDate).Scan(&deletedCount)

	if deletedCount > 0 {
		fmt.Printf("\n⚠️  Há %d transações DELETADAS em Novembro (não contadas no total)\n", deletedCount)
	}
}

func truncate(s string, max int) string {
	if len(s) <= max {
		return s
	}
	return s[:max-3] + "..."
}
