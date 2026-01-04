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

	fmt.Printf("Conectando ao DB...\n")

	db, err := sql.Open("pgx", connStr)
	if err != nil {
		fmt.Printf("Erro driver: %v\n", err)
		return
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		fmt.Printf("Erro ping: %v\n", err)
		return
	}

	// 1. Pegar User ID
	var userID string
	var email string
	// Busca usuario com transacao em Dezembro
	err = db.QueryRow("SELECT DISTINCT t.user_id, u.email FROM transactions t JOIN users u ON t.user_id = u.id WHERE t.date >= '2025-12-01' LIMIT 1").Scan(&userID, &email)
	if err != nil {
		// Fallback user
		err = db.QueryRow("SELECT id, email FROM users LIMIT 1").Scan(&userID, &email)
		if err != nil {
			fmt.Printf("Erro buscando usuario: %v\n", err)
			return
		}
	}
	fmt.Printf("Usuario Alvo: %s (%s)\n", email, userID)

	// Arquivo
	f, _ := os.Create("dashboard_audit.txt")
	defer f.Close()

	startDate := "2025-12-01"
	endDate := "2025-12-31"

	// 2. Query Detalhada
	query := `
        SELECT t.date, t.description, COALESCE(c.name, 'Sem Categoria'), t.amount, 
               t.credit_card_invoice_id, t.type
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
		fmt.Printf("Erro query: %v\n", err)
		return
	}
	defer rows.Close()

	fmt.Fprintln(f, "DATA;DESCRICAO;CATEGORIA;TIPO;VALOR;INVOICE_ID")
	var totalDespesa float64

	for rows.Next() {
		var date time.Time
		var desc, cat, tipo string
		var val float64
		var invID sql.NullString

		rows.Scan(&date, &desc, &cat, &val, &invID, &tipo)

		invStr := "NULL"
		if invID.Valid {
			invStr = invID.String
		}

		fmt.Fprintf(f, "%s;%s;%s;%s;%.2f;%s\n", date.Format("2006-01-02"), desc, cat, tipo, val, invStr)

		if tipo == "despesa" {
			totalDespesa += val
		}
	}
	fmt.Fprintf(f, "\nTOTAL DESPESAS:;%.2f\n", totalDespesa)

	// 3. Categorias
	fmt.Fprintln(f, "\n--- POR CATEGORIA ---")
	queryCat := `
        SELECT COALESCE(c.name, 'Outros'), COALESCE(SUM(t.amount), 0)
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = $1 
          AND t.date >= $2 AND t.date <= $3
          AND t.type = 'despesa'
          AND t.related_transaction_id IS NULL
          AND (c.name IS NULL OR c.name NOT ILIKE 'Transferência%')
        GROUP BY c.name
        ORDER BY SUM(t.amount) DESC
    `
	rowsCat, _ := db.Query(queryCat, userID, startDate, endDate)
	defer rowsCat.Close()
	for rowsCat.Next() {
		var cat string
		var val float64
		rowsCat.Scan(&cat, &val)
		fmt.Fprintf(f, "%s;%.2f\n", cat, val)
	}
	fmt.Println("Relatorio gerado: dashboard_audit.txt")
}
