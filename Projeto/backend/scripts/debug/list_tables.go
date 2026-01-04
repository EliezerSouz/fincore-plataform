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

	rows, _ := db.Query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
	for rows.Next() {
		var name string
		rows.Scan(&name)
		fmt.Println(name)
	}
}
