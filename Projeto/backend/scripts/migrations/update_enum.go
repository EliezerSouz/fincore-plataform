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
	godotenv.Load()
	dbUrl := os.Getenv("DATABASE_URL")
	if dbUrl == "" {
		log.Fatal("DATABASE_URL is required")
	}

	config, err := pgxpool.ParseConfig(dbUrl)
	if err != nil {
		log.Fatal(err)
	}

	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()

	ctx := context.Background()

	fmt.Println("🚀 Atualizando ENUM category_type...")

	// Tentar adicionar o valor 'ambas'
	// Nota: ALTER TYPE ADD VALUE não pode ser rodado dentro de transaction block em algumas situações,
	// mas via Pool.Exec é uma query simples.
	query := "ALTER TYPE category_type ADD VALUE IF NOT EXISTS 'ambas'"

	_, err = pool.Exec(ctx, query)
	if err != nil {
		fmt.Printf("❌ Erro ao atualizar enum: %v\n", err)
		// Verificar se o erro é porque já existe ou outro motivo
		// Mas IF NOT EXISTS deve tratar duplicação (Postgres 12+)

		// Fallback para versões antigas se IF NOT EXISTS falhar de alguma forma sintática
		if err.Error() != "" {
			fmt.Println("⚠️ Tentando verificar se o valor já existe manualmente...")
		}
	} else {
		fmt.Println("✅ Valor 'ambas' adicionado com sucesso (ou já existia)!")
	}

	// Verificar se funcionou listando os valores
	fmt.Println("\n🔍 Verificando valores atuais do ENUM:")
	rows, err := pool.Query(ctx, "SELECT unnest(enum_range(NULL::category_type))")
	if err != nil {
		log.Fatalf("Erro ao listar enum: %v", err)
	}
	defer rows.Close()

	for rows.Next() {
		var val string
		rows.Scan(&val)
		fmt.Printf(" - %s\n", val)
	}
}
