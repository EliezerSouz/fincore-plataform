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
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	databaseURL := os.Getenv("DATABASE_URL")
	pool, err := pgxpool.New(context.Background(), databaseURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
	defer pool.Close()

	accountID := "85f65c8b-9521-4ec4-9557-2a723614f04d"

	var name, typeStr string
	var yieldEnabled bool
	var yieldRate, yieldCdiRate float64

	err = pool.QueryRow(context.Background(), `
		SELECT name, type, yield_enabled, COALESCE(yield_rate, 0), COALESCE(yield_cdi_rate, 0)
		FROM accounts
		WHERE id = $1
	`, accountID).Scan(&name, &typeStr, &yieldEnabled, &yieldRate, &yieldCdiRate)

	if err != nil {
		log.Fatalf("Failed to query account: %v\n", err)
	}

	fmt.Println("🔍 Account Details:")
	fmt.Printf("Name: %s\n", name)
	fmt.Printf("Type: %s\n", typeStr)
	fmt.Printf("Yield Enabled: %v\n", yieldEnabled)
	fmt.Printf("Yield Rate: %f\n", yieldRate)
	fmt.Printf("Yield CDI Rate: %f\n", yieldCdiRate)
}
