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
	pool, err := pgxpool.New(context.Background(), os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()

	fmt.Println("🔍 VERIFICANDO ESTRUTURA DE POCKETS")
	fmt.Println("=" + string(make([]byte, 50)))
	fmt.Println()

	ctx := context.Background()

	// Ver colunas da tabela pockets
	fmt.Println("📋 Colunas da tabela 'pockets':")
	rows, err := pool.Query(ctx, `
		SELECT column_name, data_type 
		FROM information_schema.columns 
		WHERE table_name = 'pockets'
		ORDER BY ordinal_position
	`)
	if err != nil {
		log.Fatalf("Erro: %v\n", err)
	}
	defer rows.Close()

	for rows.Next() {
		var colName, dataType string
		rows.Scan(&colName, &dataType)
		fmt.Printf("   - %s (%s)\n", colName, dataType)
	}

	// Contar pockets
	fmt.Println()
	var count int
	pool.QueryRow(ctx, "SELECT COUNT(*) FROM pockets").Scan(&count)
	fmt.Printf("📊 Total de pockets: %d\n", count)

	// Ver alguns pockets
	if count > 0 {
		fmt.Println()
		fmt.Println("📝 Primeiros 5 pockets:")
		rows2, _ := pool.Query(ctx, `
			SELECT id, name, balance, account_id
			FROM pockets
			LIMIT 5
		`)
		defer rows2.Close()

		for rows2.Next() {
			var id, name string
			var balance float64
			var accountID *string
			rows2.Scan(&id, &name, &balance, &accountID)
			fmt.Printf("   - %s: R$ %.2f (account_id: %v)\n", name, balance, accountID)
		}
	}
}
