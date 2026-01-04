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

	transactionID := "f92c5c16-d9c5-4e51-8f90-94d7842a370c"

	fmt.Println("=== RESTORING DELETED TRANSACTION ===")

	// Restore transaction
	result, err := db.Exec(`
		UPDATE transactions
		SET deleted_at = NULL, updated_at = NOW()
		WHERE id = $1
	`, transactionID)

	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	rows, _ := result.RowsAffected()
	fmt.Printf("✅ Transaction restored! Rows affected: %d\n", rows)

	// Verify
	var desc string
	var amount float64
	var deletedAt sql.NullString

	err = db.QueryRow(`
		SELECT description, amount, deleted_at
		FROM transactions
		WHERE id = $1
	`, transactionID).Scan(&desc, &amount, &deletedAt)

	if err != nil {
		fmt.Printf("Error verifying: %v\n", err)
		return
	}

	fmt.Printf("\nVerification:\n")
	fmt.Printf("  Description: %s\n", desc)
	fmt.Printf("  Amount: %.2f\n", amount)
	if deletedAt.Valid {
		fmt.Printf("  ❌ Still deleted: %s\n", deletedAt.String)
	} else {
		fmt.Printf("  ✅ Active (deleted_at is NULL)\n")
	}
}
