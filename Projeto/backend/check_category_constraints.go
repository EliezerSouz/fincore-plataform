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

	fmt.Println("🔍 VERIFICANDO CONSTRAINTS EM categories")
	fmt.Println("=" + string(make([]byte, 50)))
	fmt.Println()

	ctx := context.Background()

	// Buscar constraints
	rows, err := pool.Query(ctx, `
		SELECT 
			conname as constraint_name, 
			pg_get_constraintdef(c.oid) as definition
		FROM pg_constraint c 
		JOIN pg_namespace n ON n.oid = c.connamespace 
		WHERE conrelid = 'categories'::regclass
	`)
	if err != nil {
		log.Fatalf("Erro ao buscar constraints: %v\n", err)
	}
	defer rows.Close()

	found := false
	for rows.Next() {
		var name, def string
		rows.Scan(&name, &def)
		fmt.Printf("🔒 Constraint: %s\n", name)
		fmt.Printf("   Definição: %s\n\n", def)
		found = true
	}

	if !found {
		fmt.Println("✅ Nenhuma constraint encontrada (provavelmente texto livre ou enum sem check)")
	}
}
