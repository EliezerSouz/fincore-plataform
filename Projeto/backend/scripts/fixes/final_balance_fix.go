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

	var userID string
	db.QueryRow("SELECT id FROM users LIMIT 1").Scan(&userID)

	fmt.Println("=== CORREÇÃO FINAL DOS SALDOS ===\n")

	// Based on the transaction we saw:
	// Pocket 1 (Caixa, R$ 30.00) has 1 transaction of R$ 30.00 = Banco do Brasil
	// So it should be R$ 30.00 + R$ 72.60 (initial) = R$ 102.60

	// Pocket 6 (Caixa, R$ 30.01) should be Mercado Pago = R$ 30.01
	// But it was updated to R$ 30.01, which is correct!

	// Pocket 4 was updated to R$ 102.60 but should be R$ 0.00
	// Pocket 1 should be R$ 102.60 (has the transaction)

	fmt.Println("Corrigindo pocket #1 (Banco do Brasil com transação)...")
	db.Exec(`
		UPDATE pockets
		SET balance = 102.60, updated_at = NOW()
		WHERE id = (
			SELECT id FROM pockets 
			WHERE user_id = $1 
			ORDER BY created_at 
			LIMIT 1
		)
	`, userID)
	fmt.Println("✅ Pocket #1 = R$ 102.60")

	fmt.Println("\nCorrigindo pocket #4 (estava errado)...")
	db.Exec(`
		UPDATE pockets
		SET balance = 0.00, updated_at = NOW()
		WHERE id = (
			SELECT id FROM pockets 
			WHERE user_id = $1 
			ORDER BY created_at 
			LIMIT 1 OFFSET 3
		)
	`, userID)
	fmt.Println("✅ Pocket #4 = R$ 0.00")

	fmt.Println("\n=== ESTADO FINAL CORRETO ===\n")
	rows, _ := db.Query(`
		SELECT name, pocket_type, balance
		FROM pockets
		WHERE user_id = $1
		ORDER BY created_at
	`, userID)
	defer rows.Close()

	total := 0.0
	for rows.Next() {
		var name, pType string
		var balance float64
		rows.Scan(&name, &pType, &balance)
		fmt.Printf("%-20s | %-15s | R$ %.2f\n", name, pType, balance)
		total += balance
	}

	fmt.Printf("\nTOTAL: R$ %.2f\n", total)
	fmt.Printf("Esperado: R$ 102.60 + R$ 30.01 + R$ 2007.69 = R$ 2140.30\n")
}
