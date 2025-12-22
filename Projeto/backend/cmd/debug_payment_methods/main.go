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

	userID := "91c0f2da-205d-4f1a-b47a-621c575e7230" // edu@edu.com

	rows, err := conn.Query(context.Background(), `
		SELECT id, user_id, name, type, slug 
		FROM payment_methods 
		WHERE user_id = $1 OR user_id IS NULL
		ORDER BY name
	`, userID)
	if err != nil {
		log.Fatalf("Query failed: %v", err)
	}
	defer rows.Close()

	fmt.Println("--- Payment Methods ---")
	fmt.Printf("%-36s | %-36s | %-20s | %-15s | %-20s\n", "ID", "UserID", "Name", "Type", "Slug")
	for rows.Next() {
		var id, uidPtr *string
		var name, pType, slug string
		err := rows.Scan(&id, &uidPtr, &name, &pType, &slug)
		if err != nil {
			log.Fatalf("Scan failed: %v", err)
		}
		uid := "NULL"
		if uidPtr != nil {
			uid = *uidPtr
		}
		fmt.Printf("%s | %s | %s | %s | %s\n", *id, uid, name, pType, slug)
	}
}
