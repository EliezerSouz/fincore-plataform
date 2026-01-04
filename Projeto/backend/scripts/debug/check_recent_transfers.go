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

	// Get last 5 minutes
	fiveMinutesAgo := time.Now().Add(-5 * time.Minute)

	fmt.Println("=== TRANSFERÊNCIAS DOS ÚLTIMOS 5 MINUTOS ===\n")

	rows, err := db.Query(`
		SELECT 
			t.id,
			t.description,
			t.amount,
			t.type,
			t.pocket_id,
			p.name as pocket_name,
			p.balance as pocket_balance,
			t.category_id,
			c.name as category_name,
			t.related_transaction_id,
			t.is_historical,
			t.created_at
		FROM transactions t
		LEFT JOIN pockets p ON t.pocket_id = p.id
		LEFT JOIN categories c ON t.category_id = c.id
		WHERE t.type = 'transferencia'
		  AND t.created_at >= $1
		ORDER BY t.created_at DESC
	`, fiveMinutesAgo)

	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}
	defer rows.Close()

	count := 0
	for rows.Next() {
		var id, desc, txType string
		var amount float64
		var pocketID, pocketName, categoryID, categoryName, relatedID sql.NullString
		var pocketBalance sql.NullFloat64
		var isHistorical bool
		var createdAt time.Time

		rows.Scan(&id, &desc, &amount, &txType, &pocketID, &pocketName, &pocketBalance,
			&categoryID, &categoryName, &relatedID, &isHistorical, &createdAt)

		count++
		fmt.Printf("\n--- Transação %d ---\n", count)
		fmt.Printf("ID: %s\n", id)
		fmt.Printf("Descrição: %s\n", desc)
		fmt.Printf("Valor: R$ %.2f\n", amount)
		fmt.Printf("Tipo: %s\n", txType)

		if pocketName.Valid {
			fmt.Printf("Pocket: %s (Saldo atual: R$ %.2f)\n", pocketName.String, pocketBalance.Float64)
		} else {
			fmt.Printf("Pocket: N/A\n")
		}

		if categoryName.Valid {
			fmt.Printf("Categoria: %s\n", categoryName.String)
		} else {
			fmt.Printf("Categoria: ❌ SEM CATEGORIA\n")
		}

		if relatedID.Valid {
			fmt.Printf("Relacionada: %s\n", relatedID.String)
		}

		fmt.Printf("Histórica: %v\n", isHistorical)
		fmt.Printf("Criada em: %s\n", createdAt.Format("2006-01-02 15:04:05"))
	}

	if count == 0 {
		fmt.Println("❌ Nenhuma transferência encontrada nos últimos 5 minutos")
		fmt.Println("\nVerificando se há transferências hoje...")

		today := time.Now().Format("2006-01-02")
		var todayCount int
		db.QueryRow(`
			SELECT COUNT(*)
			FROM transactions
			WHERE type = 'transferencia'
			  AND DATE(created_at) = $1
		`, today).Scan(&todayCount)

		fmt.Printf("Transferências criadas hoje: %d\n", todayCount)
	} else {
		fmt.Printf("\n✅ Total de transferências encontradas: %d\n", count)
	}
}
