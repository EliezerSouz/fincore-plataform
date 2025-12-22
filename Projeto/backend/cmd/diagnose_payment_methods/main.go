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
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found (using system envs)")
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL not set")
	}

	// Database connection
	config, err := pgxpool.ParseConfig(dbURL)
	if err != nil {
		log.Fatalf("Unable to parse database URL: %v", err)
	}

	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		log.Fatalf("Unable to create connection pool: %v", err)
	}
	defer pool.Close()

	ctx := context.Background()

	// 1. Get all users
	rows, err := pool.Query(ctx, "SELECT id, email FROM users")
	if err != nil {
		log.Fatalf("Failed to query users: %v", err)
	}
	defer rows.Close()

	var users []struct {
		ID    string
		Email string
	}

	for rows.Next() {
		var u struct {
			ID    string
			Email string
		}
		if err := rows.Scan(&u.ID, &u.Email); err != nil {
			log.Printf("Error scanning user: %v", err)
			continue
		}
		users = append(users, u)
	}
	rows.Close()

	fmt.Printf("Total Users Found: %d\n", len(users))

	// 2. Check payment methods for each user
	for _, u := range users {
		fmt.Printf("\nUser: %s (%s)\n", u.Email, u.ID)

		rows, err := pool.Query(ctx, "SELECT id, name, slug, type, is_active FROM payment_methods WHERE user_id = $1", u.ID)
		if err != nil {
			log.Printf("  Error querying payment methods: %v", err)
			continue
		}
		
		var count int
		for rows.Next() {
			var pm struct {
				ID       string
				Name     string
				Slug     string
				Type     string
				IsActive bool
			}
			if err := rows.Scan(&pm.ID, &pm.Name, &pm.Slug, &pm.Type, &pm.IsActive); err != nil {
				log.Printf("  Error scanning row: %v", err)
				continue
			}
			fmt.Printf("  - [%s] %s (Slug: %s, Type: %s, Active: %v)\n", pm.ID, pm.Name, pm.Slug, pm.Type, pm.IsActive)
			count++
		}
		rows.Close()

		if count == 0 {
			fmt.Println("  WARNING: No payment methods found!")
		} else {
			fmt.Printf("  Total: %d payment methods.\n", count)
		}
	}
}
