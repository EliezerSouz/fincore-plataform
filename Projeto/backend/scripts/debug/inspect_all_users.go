package main

import (
	"database/sql"
	"fmt"
	"os"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()
	connStr := os.Getenv("DATABASE_URL")
	if connStr == "" {
		connStr = "postgres://postgres:postgres@localhost:5432/financeiro?sslmode=disable"
	}

	db, err := sql.Open("pgx", connStr)
	if err != nil {
		panic(err)
	}
	defer db.Close()

	fmt.Println("Listando Usuários:")
	rows, err := db.Query("SELECT id, full_name, email FROM users LIMIT 10")
	if err != nil {
		panic(err)
	}

	for rows.Next() {
		var id, name, email sql.NullString
		rows.Scan(&id, &name, &email)
		fmt.Printf("%s | %s | %s\n", id.String, name.String, email.String)
	}
}
