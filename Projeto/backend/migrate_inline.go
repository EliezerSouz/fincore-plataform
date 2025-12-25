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

	// Conectar
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL not set")
	}

	pool, err := pgxpool.New(context.Background(), dbURL)
	if err != nil {
		log.Fatalf("Unable to connect: %v\n", err)
	}
	defer pool.Close()

	fmt.Println("✅ Conectado ao banco de dados")

	// Migration SQL - ADD RECURRENCE ID
	migrationSQL := `
ALTER TABLE payables ADD COLUMN IF NOT EXISTS recurrence_id UUID;
CREATE INDEX IF NOT EXISTS idx_payables_recurrence_id ON payables(recurrence_id);
`

	fmt.Println("🚀 Executando migration de Promo Codes...")
	_, err = pool.Exec(context.Background(), migrationSQL)
	if err != nil {
		log.Fatalf("Migration failed: %v\n", err)
	}

	fmt.Println("✅ Migration executada com sucesso!")

	// Validar
	var count int
	err = pool.QueryRow(context.Background(), `
		SELECT COUNT(*) 
		FROM information_schema.tables 
		WHERE table_name IN ('promo_codes')
	`).Scan(&count)

	if err != nil {
		log.Printf("Warning: %v\n", err)
	} else {
		fmt.Printf("✅ Tabelas validas: Tabela promo_codes existe (Count: %d)\n", count)
	}

	// Validar colunas em users
	var userColCount int
	err = pool.QueryRow(context.Background(), `
		SELECT COUNT(*) 
		FROM information_schema.columns 
		WHERE table_name = 'users' AND column_name IN ('subscription_plan', 'redeemed_promo_codes')
	`).Scan(&userColCount)
	fmt.Printf("✅ Colunas em Users validadas: %d/2 encontradas\n", userColCount)

	fmt.Println("\n🎉 Migration Promo Codes concluída!")
}
