package main

import (
	"context"
	"fmt"
	"os"

	"github.com/jackc/pgx/v5"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load() // Load .env file
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		fmt.Println("DATABASE_URL not set")
		return
	}

	conn, err := pgx.Connect(context.Background(), dbURL)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Unable to connect to database: %v\n", err)
		os.Exit(1)
	}
	defer conn.Close(context.Background())

	rows, err := conn.Query(context.Background(), "SELECT name, allows_income, allows_expense, allows_transfer, is_active FROM payment_methods")
	if err != nil {
		fmt.Fprintf(os.Stderr, "Query failed: %v\n", err)
		os.Exit(1)
	}
	defer rows.Close()

	fmt.Printf("%-20s | %-6s | %-7s | %-8s | %-6s\n", "Name", "Income", "Expense", "Transfer", "Active")
	fmt.Println("-----------------------------------------------------------------------")

	for rows.Next() {
		var name string
		var income, expense, transfer, active bool
		err := rows.Scan(&name, &income, &expense, &transfer, &active)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Scan failed: %v\n", err)
			os.Exit(1)
		}
		fmt.Printf("%-20s | %-6v | %-7v | %-8v | %-6v\n", name, income, expense, transfer, active)
	}
}
