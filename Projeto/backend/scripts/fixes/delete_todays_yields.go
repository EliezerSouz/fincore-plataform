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

	fmt.Println("🗑️  DELETANDO YIELDS DE HOJE")
	fmt.Println("=" + string(make([]byte, 40)))
	fmt.Println()

	ctx := context.Background()

	result, err := pool.Exec(ctx, `
		DELETE FROM liquidity_yields
		WHERE date = CURRENT_DATE
	`)

	if err != nil {
		log.Fatalf("Erro: %v\n", err)
	}

	fmt.Printf("✅ %d yields deletados\n", result.RowsAffected())
	fmt.Println()
	fmt.Println("Agora execute: go run cmd/test_yields/main.go")
}
