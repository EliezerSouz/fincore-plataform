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

	fmt.Println("=== VERIFICANDO TRANSAÇÕES DELETADAS RECENTEMENTE ===\n")

	// Check for deleted transactions in the last 10 minutes
	rows, err := db.Query(`
		SELECT 
			t.id,
			t.description,
			t.amount,
			t.type,
			t.pocket_id,
			p.name as pocket_name,
			t.deleted_at,
			t.created_at
		FROM transactions t
		LEFT JOIN pockets p ON t.pocket_id = p.id
		WHERE t.deleted_at IS NOT NULL
		  AND t.deleted_at >= NOW() - INTERVAL '10 minutes'
		ORDER BY t.deleted_at DESC
	`)

	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}
	defer rows.Close()

	count := 0
	for rows.Next() {
		var id, desc, txType string
		var amount float64
		var pocketID sql.NullString
		var pocketName sql.NullString
		var deletedAt, createdAt time.Time

		rows.Scan(&id, &desc, &amount, &txType, &pocketID, &pocketName, &deletedAt, &createdAt)
		count++

		fmt.Printf("\n--- Transação Deletada %d ---\n", count)
		fmt.Printf("ID: %s\n", id)
		fmt.Printf("Descrição: %s\n", desc)
		fmt.Printf("Valor: R$ %.2f\n", amount)
		fmt.Printf("Tipo: %s\n", txType)

		if pocketName.Valid {
			fmt.Printf("Pocket: %s\n", pocketName.String)
		} else {
			fmt.Printf("Pocket: N/A\n")
		}

		fmt.Printf("Criada em: %s\n", createdAt.Format("2006-01-02 15:04:05"))
		fmt.Printf("Deletada em: %s\n", deletedAt.Format("2006-01-02 15:04:05"))
	}

	if count == 0 {
		fmt.Println("❌ Nenhuma transação deletada nos últimos 10 minutos")
	} else {
		fmt.Printf("\n✅ Total de transações deletadas: %d\n", count)
	}

	fmt.Println("\n=== SALDOS ATUAIS DOS POCKETS ===\n")
	rows2, _ := db.Query(`
		SELECT name, balance, updated_at
		FROM pockets
		ORDER BY created_at
	`)
	defer rows2.Close()

	for rows2.Next() {
		var name string
		var balance float64
		var updatedAt time.Time
		rows2.Scan(&name, &balance, &updatedAt)
		fmt.Printf("%-20s: R$ %8.2f (atualizado: %s)\n",
			name, balance, updatedAt.Format("15:04:05"))
	}

	fmt.Println("\n=== VERIFICANDO LÓGICA DE DELETE ===")
	fmt.Println("Quando uma transação é deletada (soft delete):")
	fmt.Println("1. Campo deleted_at é preenchido")
	fmt.Println("2. ❓ O saldo do pocket DEVERIA ser revertido?")
	fmt.Println("\nVamos verificar se há lógica de reversão de saldo...")
}
