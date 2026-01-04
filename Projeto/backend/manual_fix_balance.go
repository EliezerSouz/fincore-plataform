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

	fmt.Println("=== CORREÇÃO MANUAL DE SALDOS ===\n")
	fmt.Println("Revertendo transferência excluída que não estornou saldo devido à descrição antiga.")
	fmt.Println("Valor: R$ 881.56")
	fmt.Println("Origem: EMERGENCIA (deveria voltar o dinheiro)")
	fmt.Println("Destino: Caixa (deveria sair o dinheiro)\n")

	// 1. Devolver dinheiro para EMERGENCIA
	var currentEmergencia float64
	err = db.QueryRow("SELECT balance FROM pockets WHERE name = 'EMERGENCIA'").Scan(&currentEmergencia)
	if err != nil {
		fmt.Printf("❌ Erro ao buscar saldo EMERGENCIA: %v\n", err)
		return
	}

	fmt.Printf("EMERGENCIA: R$ %.2f → R$ %.2f\n", currentEmergencia, currentEmergencia+881.56)
	_, err = db.Exec("UPDATE pockets SET balance = balance + 881.56 WHERE name = 'EMERGENCIA'")
	if err != nil {
		fmt.Printf("❌ Erro ao atualizar EMERGENCIA: %v\n", err)
		return
	}

	// 2. Tirar dinheiro do Caixa
	// Precisamos identificar QUAL caixa (o que tem R$ 911.57)
	var caixaID string
	var currentCaixa float64
	err = db.QueryRow("SELECT id, balance FROM pockets WHERE name = 'Caixa' AND balance > 800 ORDER BY balance DESC LIMIT 1").Scan(&caixaID, &currentCaixa)
	if err != nil {
		fmt.Printf("❌ Erro ao buscar saldo Caixa: %v\n", err)
		return
	}

	fmt.Printf("Caixa (%s): R$ %.2f → R$ %.2f\n", caixaID, currentCaixa, currentCaixa-881.56)
	_, err = db.Exec("UPDATE pockets SET balance = balance - 881.56 WHERE id = $1", caixaID)
	if err != nil {
		fmt.Printf("❌ Erro ao atualizar Caixa: %v\n", err)
		return
	}

	fmt.Println("\n✅ Saldos corrigidos com sucesso!")
}
