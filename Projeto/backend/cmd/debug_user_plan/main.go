package main

import (
	"context"
	"fmt"
	"log"

	"github.com/jackc/pgx/v5"
)

func main() {
	dbURL := "postgresql://postgres:7UeEJR6rFxscG1Xa@db.dwcgzzqaajstzabjuqnw.supabase.co:5432/postgres?sslmode=require"
	conn, err := pgx.Connect(context.Background(), dbURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v", err)
	}
	defer conn.Close(context.Background())

	userID := "91c0f2da-205d-4f1a-b47a-621c575e7230"

	var plan, status string
    var isPremium bool
	err = conn.QueryRow(context.Background(), `
		SELECT subscription_plan, subscription_status 
		FROM users 
		WHERE id = $1
	`, userID).Scan(&plan, &status)
	if err != nil {
		log.Fatalf("Query failed: %v", err)
	}
    
    // Check logic
    isPremium = plan == "premium" || plan == "premium_ia" || plan == "enterprise"

	fmt.Printf("User ID: %s\n", userID)
	fmt.Printf("Plan: '%s'\n", plan)
	fmt.Printf("Status: '%s'\n", status)
    fmt.Printf("Is Premium (DB logic): %v\n", isPremium)
}
