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

	startDate := "2025-12-01"
	endDate := "2025-12-31"

	// Query EXATA usada no frontend (transactions-view.tsx linha 177-178)
	// Filtra: type = 'despesa' AND !related_transaction_id AND category.name != 'Transferência'

	fmt.Println("=== QUERY DO FRONTEND (chartTransactions para Cards) ===")
	query := `
		SELECT t.date, t.description, COALESCE(c.name, 'Sem Categoria'), t.amount, 
		       t.type, t.related_transaction_id
		FROM transactions t
		LEFT JOIN categories c ON t.category_id = c.id
		WHERE t.user_id = $1 
		  AND t.date >= $2 AND t.date <= $3
		  AND t.deleted_at IS NULL
		  AND t.type = 'despesa'
		  AND t.related_transaction_id IS NULL
		  AND (c.name IS NULL OR c.name NOT ILIKE 'Transferência%')
		ORDER BY t.date DESC
	`

	rows, err := db.Query(query, userID, startDate, endDate)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}
	defer rows.Close()

	fmt.Println("DATA       | DESCRIÇÃO                              | CATEGORIA              | VALOR")
	fmt.Println("-----------|----------------------------------------|------------------------|----------")

	var total float64
	count := 0

	for rows.Next() {
		var date, desc, cat string
		var amount float64
		var txType string
		var relatedID sql.NullString

		rows.Scan(&date, &desc, &cat, &amount, &txType, &relatedID)

		fmt.Printf("%-10s | %-38s | %-22s | %8.2f\n",
			date[:10],
			truncate(desc, 38),
			truncate(cat, 22),
			amount)

		total += amount
		count++
	}

	fmt.Println("-----------|----------------------------------------|------------------------|----------")
	fmt.Printf("TOTAL: %.2f (Count: %d)\n\n", total, count)

	// Verificar especificamente "Pagamento de Fatura"
	fmt.Println("=== VERIFICANDO 'PAGAMENTO DE FATURA' ===")
	var faturaCount int
	var faturaTotal float64

	err = db.QueryRow(`
		SELECT COUNT(*), COALESCE(SUM(amount), 0)
		FROM transactions t
		LEFT JOIN categories c ON t.category_id = c.id
		WHERE t.user_id = $1 
		  AND t.date >= $2 AND t.date <= $3
		  AND t.deleted_at IS NULL
		  AND t.type = 'despesa'
		  AND c.name ILIKE '%PAGAMENTO%FATURA%'
	`, userID, startDate, endDate).Scan(&faturaCount, &faturaTotal)

	if err != nil {
		fmt.Printf("Error: %v\n", err)
	} else {
		fmt.Printf("Transações de Pagamento de Fatura: %d\n", faturaCount)
		fmt.Printf("Total: %.2f\n", faturaTotal)

		if faturaCount > 0 {
			fmt.Println("\nDetalhes:")
			rows2, _ := db.Query(`
				SELECT t.date, t.description, c.name, t.amount, t.related_transaction_id
				FROM transactions t
				LEFT JOIN categories c ON t.category_id = c.id
				WHERE t.user_id = $1 
				  AND t.date >= $2 AND t.date <= $3
				  AND t.deleted_at IS NULL
				  AND t.type = 'despesa'
				  AND c.name ILIKE '%PAGAMENTO%FATURA%'
			`, userID, startDate, endDate)
			defer rows2.Close()

			for rows2.Next() {
				var date, desc, cat string
				var amount float64
				var relatedID sql.NullString
				rows2.Scan(&date, &desc, &cat, &amount, &relatedID)

				relStr := "NULL"
				if relatedID.Valid {
					relStr = relatedID.String[:8] + "..."
				}

				fmt.Printf("  %s | %s | %.2f | related_id: %s\n",
					date[:10], truncate(desc, 30), amount, relStr)
			}
		}
	}

	// Verificar se tem related_transaction_id
	fmt.Println("\n=== VERIFICANDO TRANSAÇÕES COM related_transaction_id ===")
	var relatedCount int
	db.QueryRow(`
		SELECT COUNT(*)
		FROM transactions
		WHERE user_id = $1 
		  AND date >= $2 AND date <= $3
		  AND deleted_at IS NULL
		  AND type = 'despesa'
		  AND related_transaction_id IS NOT NULL
	`, userID, startDate, endDate).Scan(&relatedCount)

	fmt.Printf("Despesas com related_transaction_id: %d\n", relatedCount)
	fmt.Println("(Essas são EXCLUÍDAS do cálculo do frontend)")
}

func truncate(s string, max int) string {
	if len(s) <= max {
		return s
	}
	return s[:max-3] + "..."
}
