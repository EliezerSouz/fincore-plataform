package main

import (
	"context"
	"fmt"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()
	pool, _ := pgxpool.New(context.Background(), os.Getenv("DATABASE_URL"))
	defer pool.Close()

	// Verificar tabelas de invoice
	rows, _ := pool.Query(context.Background(), `
		SELECT table_name 
		FROM information_schema.tables 
		WHERE table_schema = 'public' 
		AND table_name LIKE '%invoice%' 
		ORDER BY table_name
	`)
	defer rows.Close()

	fmt.Println("Tabelas de invoices:")
	for rows.Next() {
		var name string
		rows.Scan(&name)
		fmt.Println("  -", name)
	}

	// Verificar colunas da tabela credit_card_invoices se existir
	rows2, _ := pool.Query(context.Background(), `
		SELECT column_name, data_type 
		FROM information_schema.columns 
		WHERE table_name = 'credit_card_invoices' 
		ORDER BY ordinal_position
	`)
	defer rows2.Close()

	fmt.Println("\nColunas de credit_card_invoices:")
	for rows2.Next() {
		var name, dtype string
		rows2.Scan(&name, &dtype)
		fmt.Printf("  - %s (%s)\n", name, dtype)
	}
}
