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

	fmt.Println("=== CORREÇÃO FINAL DE SALDOS ===\n")
	fmt.Println("Detectado que o saldo já havia sido revertido corretamente.")
	fmt.Println("Removendo o valor adicionado incorretamente em EMERGENCIA.\n")

	// 1. Corrigir EMERGENCIA
	var currentEmergencia float64
	err = db.QueryRow("SELECT balance FROM pockets WHERE name = 'EMERGENCIA'").Scan(&currentEmergencia)
	if err != nil {
		fmt.Printf("❌ Erro ao buscar saldo EMERGENCIA: %v\n", err)
		return
	}

	targetBalance := currentEmergencia - 881.56
	fmt.Printf("EMERGENCIA: R$ %.2f → R$ %.2f (Corrigido)\n", currentEmergencia, targetBalance)

	_, err = db.Exec("UPDATE pockets SET balance = balance - 881.56 WHERE name = 'EMERGENCIA'")
	if err != nil {
		fmt.Printf("❌ Erro ao atualizar EMERGENCIA: %v\n", err)
		return
	}

	fmt.Println("\n✅ Saldos normalizados!")
}
