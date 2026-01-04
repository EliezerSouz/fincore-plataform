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

	// Get user
	var userID string
	err = db.QueryRow("SELECT id FROM users LIMIT 1").Scan(&userID)
	if err != nil {
		fmt.Printf("Error getting user: %v\n", err)
		return
	}

	fmt.Println("=== SALDOS ORIGINAIS DAS ACCOUNTS (Legado) ===\n")

	// Get accounts with their original balances
	rows, err := db.Query(`
		SELECT id, name, type, balance
		FROM accounts
		WHERE user_id = $1 AND deleted_at IS NULL
		ORDER BY created_at
	`, userID)

	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}
	defer rows.Close()

	type AccountInfo struct {
		ID      string
		Name    string
		Type    string
		Balance float64
	}

	var accounts []AccountInfo

	fmt.Println("ID                                   | NOME                | TIPO       | SALDO")
	fmt.Println("-------------------------------------|---------------------|------------|----------")

	for rows.Next() {
		var acc AccountInfo
		rows.Scan(&acc.ID, &acc.Name, &acc.Type, &acc.Balance)
		accounts = append(accounts, acc)
		fmt.Printf("%-36s | %-19s | %-10s | R$ %.2f\n",
			acc.ID[:36], acc.Name, acc.Type, acc.Balance)
	}

	fmt.Println("\n=== MAPEAMENTO ACCOUNTS → POCKETS ===\n")

	// For each account, find corresponding pocket and restore balance
	for _, acc := range accounts {
		fmt.Printf("Account: %s (R$ %.2f)\n", acc.Name, acc.Balance)

		// Find pocket with same parent_account_id
		var pocketID, pocketName string
		var currentBalance float64

		err := db.QueryRow(`
			SELECT p.id, p.name, p.balance
			FROM pockets p
			WHERE p.parent_account_id = $1
			  AND p.pocket_type = 'CAIXA'
			ORDER BY p.created_at ASC
			LIMIT 1
		`, acc.ID).Scan(&pocketID, &pocketName, &currentBalance)

		if err != nil {
			if err == sql.ErrNoRows {
				fmt.Printf("  ⚠️  Nenhum pocket encontrado para esta account\n\n")
			} else {
				fmt.Printf("  ❌ Erro: %v\n\n", err)
			}
			continue
		}

		fmt.Printf("  → Pocket: %s (Saldo atual: R$ %.2f)\n", pocketName, currentBalance)

		if currentBalance != acc.Balance {
			fmt.Printf("  ⚠️  DIFERENÇA: R$ %.2f\n", acc.Balance-currentBalance)
			fmt.Printf("  🔧 Restaurando para R$ %.2f...\n", acc.Balance)

			_, err = db.Exec(`
				UPDATE pockets
				SET balance = $1, updated_at = NOW()
				WHERE id = $2
			`, acc.Balance, pocketID)

			if err != nil {
				fmt.Printf("  ❌ Erro ao restaurar: %v\n", err)
			} else {
				fmt.Printf("  ✅ Restaurado com sucesso!\n")
			}
		} else {
			fmt.Printf("  ✅ Saldo já está correto\n")
		}
		fmt.Println()
	}

	fmt.Println("\n=== VERIFICAÇÃO FINAL ===\n")

	// Show final state
	rows2, _ := db.Query(`
		SELECT pa.id, p.name, p.pocket_type, p.balance
		FROM pockets p
		LEFT JOIN parent_accounts pa ON p.parent_account_id = pa.id
		WHERE p.user_id = $1
		ORDER BY p.created_at
	`, userID)
	defer rows2.Close()

	fmt.Println("PARENT ACCOUNT ID                    | POCKET NAME         | TIPO           | SALDO")
	fmt.Println("-------------------------------------|---------------------|----------------|----------")

	for rows2.Next() {
		var paID sql.NullString
		var pName, pType string
		var balance float64
		rows2.Scan(&paID, &pName, &pType, &balance)

		paIDStr := "N/A"
		if paID.Valid {
			paIDStr = paID.String[:36]
		}

		fmt.Printf("%-36s | %-19s | %-14s | R$ %.2f\n",
			paIDStr, pName, pType, balance)
	}
}
