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
	// Load .env
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Connect to database
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL not set")
	}

	pool, err := pgxpool.New(context.Background(), dbURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
	defer pool.Close()

	fmt.Println("🔧 ATUALIZANDO CONSTRAINT DE TIPO DE TRANSAÇÃO")
	fmt.Println("=" + string(make([]byte, 50)))
	fmt.Println()

	ctx := context.Background()

	// 1. Remover constraints antigos
	fmt.Println("🗑️  Removendo constraints antigos...")

	constraints := []string{
		"transactions_transfer_check",
		"transactions_type_check",
		"check_transaction_type",
	}

	for _, constraint := range constraints {
		_, err := pool.Exec(ctx, fmt.Sprintf("ALTER TABLE transactions DROP CONSTRAINT IF EXISTS %s", constraint))
		if err != nil {
			fmt.Printf("   ⚠️  Erro ao remover %s: %v\n", constraint, err)
		} else {
			fmt.Printf("   ✅ Constraint %s removido (se existia)\n", constraint)
		}
	}

	fmt.Println()

	// 2. Adicionar novo constraint
	fmt.Println("➕ Adicionando novo constraint...")

	_, err = pool.Exec(ctx, `
		ALTER TABLE transactions
		ADD CONSTRAINT transactions_type_check 
		CHECK (type IN ('receita', 'despesa', 'transferencia'))
	`)

	if err != nil {
		log.Fatalf("❌ Erro ao adicionar constraint: %v\n", err)
	}

	fmt.Println("   ✅ Novo constraint adicionado!")
	fmt.Println()

	// 3. Verificar constraint
	fmt.Println("🔍 Verificando constraint...")

	var constraintName, constraintDef string
	err = pool.QueryRow(ctx, `
		SELECT 
			conname,
			pg_get_constraintdef(oid)
		FROM pg_constraint
		WHERE conrelid = 'transactions'::regclass
		  AND conname = 'transactions_type_check'
	`).Scan(&constraintName, &constraintDef)

	if err != nil {
		log.Fatalf("❌ Erro ao verificar constraint: %v\n", err)
	}

	fmt.Printf("   ✅ Constraint: %s\n", constraintName)
	fmt.Printf("   ✅ Definição: %s\n", constraintDef)
	fmt.Println()

	fmt.Println("🎉 Constraint atualizado com sucesso!")
	fmt.Println()
	fmt.Println("📝 Próximo passo:")
	fmt.Println("   Execute: go run migrate_transferencias.go")
}
