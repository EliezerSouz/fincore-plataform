package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

func main() {
	// Carregar .env
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Conectar ao banco
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL not set")
	}

	pool, err := pgxpool.New(context.Background(), dbURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
	defer pool.Close()

	fmt.Println("✅ Conectado ao banco de dados")

	// Ler migration
	migrationSQL, err := os.ReadFile("../../database/migrations/003_invoices_and_credits.sql")
	if err != nil {
		log.Fatalf("Failed to read migration file: %v\n", err)
	}

	fmt.Println("📄 Migration carregada")

	// Executar migration
	fmt.Println("🚀 Executando migration...")
	_, err = pool.Exec(context.Background(), string(migrationSQL))
	if err != nil {
		log.Fatalf("Failed to execute migration: %v\n", err)
	}

	fmt.Println("✅ Migration executada com sucesso!")

	// Validar tabelas criadas
	fmt.Println("\n📊 Validando estrutura...")

	var count int
	err = pool.QueryRow(context.Background(), `
		SELECT COUNT(*) 
		FROM information_schema.tables 
		WHERE table_name IN ('financial_events', 'credits')
	`).Scan(&count)

	if err != nil {
		log.Fatalf("Failed to validate tables: %v\n", err)
	}

	if count == 2 {
		fmt.Println("✅ Tabelas criadas: financial_events, credits")
	} else {
		fmt.Printf("⚠️  Apenas %d tabelas encontradas\n", count)
	}

	// Validar funções
	err = pool.QueryRow(context.Background(), `
		SELECT COUNT(*) 
		FROM pg_proc 
		WHERE proname IN ('calculate_available_limit', 'validate_invoice_total')
	`).Scan(&count)

	if err != nil {
		log.Fatalf("Failed to validate functions: %v\n", err)
	}

	if count == 2 {
		fmt.Println("✅ Funções SQL criadas: calculate_available_limit, validate_invoice_total")
	} else {
		fmt.Printf("⚠️  Apenas %d funções encontradas\n", count)
	}

	fmt.Println("\n🎉 Migration completa!")
}
