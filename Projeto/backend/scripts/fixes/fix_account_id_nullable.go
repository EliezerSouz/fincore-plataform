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

	fmt.Println("🔧 CORRIGINDO CONSTRAINT account_id")
	fmt.Println("=" + string(make([]byte, 50)))
	fmt.Println()

	ctx := context.Background()

	// Tornar account_id opcional (nullable)
	fmt.Println("🔄 Tornando account_id opcional...")
	_, err = pool.Exec(ctx, `
		ALTER TABLE liquidity_yields 
		ALTER COLUMN account_id DROP NOT NULL
	`)
	if err != nil {
		log.Fatalf("Erro: %v\n", err)
	}
	fmt.Println("   ✅ account_id agora é opcional")

	fmt.Println()
	fmt.Println("🎉 Correção concluída!")
	fmt.Println()
	fmt.Println("📝 Agora você pode executar:")
	fmt.Println("   go run cmd/test_yields/main.go")
}
