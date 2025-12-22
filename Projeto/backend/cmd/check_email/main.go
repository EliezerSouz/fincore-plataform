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

	var email string
	err = conn.QueryRow(context.Background(), `SELECT email FROM users WHERE id = $1`, userID).Scan(&email)
	if err != nil {
		log.Fatalf("Query failed: %v", err)
	}

	fmt.Printf("Email for ID %s is: %s\n", userID, email)
}
