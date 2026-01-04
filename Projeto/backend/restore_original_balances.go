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

	fmt.Println("=== RESTAURANDO SALDOS ORIGINAIS ===\n")

	// Baseado nas imagens:
	// Banco do Brasil - Caixa: R$ 30,00 (estava correto, tinha 1 transação de R$ 30)
	// Mercado Pago - EMERGENCIA: R$ 2.007,69 (precisa restaurar)
	// Mercado Pago - Caixa: R$ 0,00 (estava correto)

	updates := []struct {
		Name    string
		Balance float64
		Reason  string
	}{
		// EMERGENCIA tinha R$ 2.007,69 antes
		{"EMERGENCIA", 2007.69, "Saldo inicial de reserva de emergência"},
	}

	for _, u := range updates {
		fmt.Printf("Restaurando pocket '%s' para R$ %.2f\n", u.Name, u.Balance)
		fmt.Printf("  Motivo: %s\n", u.Reason)

		result, err := db.Exec(`
			UPDATE pockets
			SET balance = $1, updated_at = NOW()
			WHERE name = $2
		`, u.Balance, u.Name)

		if err != nil {
			fmt.Printf("  ❌ Erro: %v\n", err)
			continue
		}

		rows, _ := result.RowsAffected()
		if rows > 0 {
			fmt.Printf("  ✅ Restaurado com sucesso (%d pocket(s) atualizado(s))\n", rows)
		} else {
			fmt.Printf("  ⚠️  Nenhum pocket encontrado com esse nome\n")
		}
		fmt.Println()
	}

	// Verificar estado atual
	fmt.Println("\n=== ESTADO ATUAL DOS POCKETS ===")
	rows, _ := db.Query(`
		SELECT name, pocket_type, balance
		FROM pockets
		ORDER BY created_at
	`)
	defer rows.Close()

	for rows.Next() {
		var name, pType string
		var balance float64
		rows.Scan(&name, &pType, &balance)
		fmt.Printf("%-20s | %-15s | R$ %.2f\n", name, pType, balance)
	}

	fmt.Println("\n⚠️  IMPORTANTE: Se algum saldo ainda estiver errado, me informe o valor correto!")
}
