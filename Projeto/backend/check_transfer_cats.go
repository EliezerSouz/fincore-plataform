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
	pool, err := pgxpool.New(context.Background(), dbUrl)
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()

	rows, _ := pool.Query(context.Background(), "SELECT id, name, type, is_system FROM categories WHERE name ILIKE '%transf%'")
	defer rows.Close()

	fmt.Println("🔍 Categorias encontradas:")
	for rows.Next() {
		var id, name, catType string
		var isSystem bool
		rows.Scan(&id, &name, &catType, &isSystem)
		fmt.Printf("- ID: %s | Nome: %s | Tipo: %s | Sistema: %v\n", id, name, catType, isSystem)
	}
}
