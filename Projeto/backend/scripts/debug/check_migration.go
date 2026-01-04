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

	var total, receitas, despesas, corretas int
	err = pool.QueryRow(context.Background(), `
		SELECT 
			COUNT(*),
			COUNT(CASE WHEN type = 'receita' THEN 1 END),
			COUNT(CASE WHEN type = 'despesa' THEN 1 END),
			COUNT(CASE WHEN type = 'transferencia' THEN 1 END)
		FROM transactions
		WHERE related_transaction_id IS NOT NULL
		  AND deleted_at IS NULL
	`).Scan(&total, &receitas, &despesas, &corretas)

	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("\n📊 RESULTADO DA MIGRAÇÃO:")
	fmt.Println("=" + string(make([]byte, 40)))
	fmt.Printf("Total de transferências: %d\n", total)
	fmt.Printf("❌ Receitas: %d\n", receitas)
	fmt.Printf("❌ Despesas: %d\n", despesas)
	fmt.Printf("✅ Transferências: %d\n", corretas)
	fmt.Println()

	if corretas == total && receitas == 0 && despesas == 0 {
		fmt.Println("🎉 MIGRAÇÃO 100% CONCLUÍDA!")
	} else {
		fmt.Println("⚠️  Ainda há transações para migrar")
	}
}
