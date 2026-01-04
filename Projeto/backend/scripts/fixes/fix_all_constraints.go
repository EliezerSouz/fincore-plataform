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

	fmt.Println("🔍 VERIFICANDO TODOS OS CONSTRAINTS")
	fmt.Println("=" + string(make([]byte, 50)))
	fmt.Println()

	ctx := context.Background()

	// 1. Listar todos os constraints
	fmt.Println("📋 Constraints atuais:")
	rows, err := pool.Query(ctx, `
		SELECT 
			conname,
			pg_get_constraintdef(oid) as definition
		FROM pg_constraint
		WHERE conrelid = 'transactions'::regclass
		  AND contype = 'c'
		ORDER BY conname
	`)

	if err != nil {
		log.Fatalf("Erro ao listar constraints: %v\n", err)
	}
	defer rows.Close()

	var constraints []string
	for rows.Next() {
		var name, def string
		if err := rows.Scan(&name, &def); err != nil {
			log.Printf("Erro ao ler constraint: %v\n", err)
			continue
		}
		fmt.Printf("   - %s: %s\n", name, def)
		constraints = append(constraints, name)
	}

	fmt.Println()

	// 2. Remover constraints relacionados a tipo
	fmt.Println("🗑️  Removendo constraints relacionados a tipo...")

	typeConstraints := []string{
		"transactions_transfer_check",
		"transactions_type_check",
		"check_transaction_type",
		"transfer_has_destination",
		"transfer_has_related",
	}

	for _, constraint := range typeConstraints {
		_, err := pool.Exec(ctx, fmt.Sprintf("ALTER TABLE transactions DROP CONSTRAINT IF EXISTS %s CASCADE", constraint))
		if err != nil {
			fmt.Printf("   ⚠️  Erro ao remover %s: %v\n", constraint, err)
		} else {
			fmt.Printf("   ✅ %s removido\n", constraint)
		}
	}

	fmt.Println()

	// 3. Adicionar novo constraint simples
	fmt.Println("➕ Adicionando novo constraint...")

	_, err = pool.Exec(ctx, `
		ALTER TABLE transactions
		ADD CONSTRAINT transactions_type_check 
		CHECK (type IN ('receita', 'despesa', 'transferencia'))
	`)

	if err != nil {
		fmt.Printf("   ⚠️  Erro ao adicionar constraint: %v\n", err)
		fmt.Println("   (Pode ser que já exista)")
	} else {
		fmt.Println("   ✅ Novo constraint adicionado!")
	}

	fmt.Println()
	fmt.Println("🎉 Constraints atualizados!")
	fmt.Println()
	fmt.Println("📝 Próximo passo:")
	fmt.Println("   Execute: go run migrate_transferencias.go")
}
