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

	rows, err := conn.Query(context.Background(), "select policyname, cmd, roles, qual, with_check from pg_policies where tablename = 'users'")
	if err != nil {
		log.Fatalf("Query failed: %v", err)
	}
	defer rows.Close()

    fmt.Println("--- Policies on users table ---")
	for rows.Next() {
		var name, cmd string
        var roles []string
        var qual, withCheck *string
		err := rows.Scan(&name, &cmd, &roles, &qual, &withCheck)
		if err != nil {
			log.Fatalf("Scan failed: %v", err)
		}
        q := "NULL"
        if qual != nil { q = *qual }
        wc := "NULL"
        if withCheck != nil { wc = *withCheck }
		fmt.Printf("Policy: %s | Cmd: %s | Roles: %v | Qual: %s | WithCheck: %s\n", name, cmd, roles, q, wc)
	}
}
