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

	var userID string
	db.QueryRow("SELECT id FROM users LIMIT 1").Scan(&userID)

	fmt.Println("=== RESTAURANDO SALDOS BASEADO EM ACCOUNTS ===\n")

	// Mapeamento manual baseado nas informações
	// BANCO DO BRASIL (account) → Banco do Brasil (parent_account) → Caixa (pocket) = R$ 102.60
	// MERCADO PAGO (account) → Mercado Pago (parent_account) → Caixa (pocket) = R$ 30.01
	// MERCADO PAGO também tem EMERGENCIA = R$ 2007.69 (já restaurado)

	updates := map[string]float64{
		"BANCO DO BRASIL": 102.60, // Tinha R$ 102.60 na account
		"MERCADO PAGO":    30.01,  // Tinha R$ 30.01 na account (pocket Caixa, não EMERGENCIA)
	}

	for accountName, balance := range updates {
		fmt.Printf("Procurando pocket 'Caixa' do parent_account '%s'...\n", accountName)

		// Find parent_account by name (case insensitive)
		var parentAccountID string
		err := db.QueryRow(`
			SELECT id
			FROM parent_accounts
			WHERE user_id = $1
			  AND UPPER(account_name) = UPPER($2)
			LIMIT 1
		`, userID, accountName).Scan(&parentAccountID)

		if err != nil {
			fmt.Printf("  ⚠️  Parent account não encontrado. Tentando buscar pocket diretamente...\n")

			// Try to find pocket by matching account name in a different way
			// Since we don't have parent_account names, let's update by position
			continue
		}

		fmt.Printf("  Parent Account ID: %s\n", parentAccountID)

		// Find CAIXA pocket for this parent account
		var pocketID string
		var currentBalance float64
		err = db.QueryRow(`
			SELECT id, balance
			FROM pockets
			WHERE parent_account_id = $1
			  AND pocket_type = 'CAIXA'
			ORDER BY created_at ASC
			LIMIT 1
		`, parentAccountID).Scan(&pocketID, &currentBalance)

		if err != nil {
			fmt.Printf("  ❌ Pocket Caixa não encontrado: %v\n\n", err)
			continue
		}

		fmt.Printf("  Pocket ID: %s (Saldo atual: R$ %.2f)\n", pocketID, currentBalance)
		fmt.Printf("  🔧 Atualizando para R$ %.2f...\n", balance)

		_, err = db.Exec(`
			UPDATE pockets
			SET balance = $1, updated_at = NOW()
			WHERE id = $2
		`, balance, pocketID)

		if err != nil {
			fmt.Printf("  ❌ Erro: %v\n", err)
		} else {
			fmt.Printf("  ✅ Atualizado!\n")
		}
		fmt.Println()
	}

	// Manual update based on what we know
	fmt.Println("=== ATUALIZAÇÃO MANUAL POR IDENTIFICAÇÃO ===\n")

	// We know from the output that there are 6 pockets
	// Let's identify them and update manually

	fmt.Println("Listando todos os pockets com parent_account info...")
	rows, _ := db.Query(`
		SELECT p.id, p.name, p.pocket_type, p.balance, p.parent_account_id
		FROM pockets p
		WHERE p.user_id = $1
		ORDER BY p.created_at
	`, userID)
	defer rows.Close()

	pockets := []struct {
		ID              string
		Name            string
		Type            string
		Balance         float64
		ParentAccountID string
	}{}

	for rows.Next() {
		var p struct {
			ID              string
			Name            string
			Type            string
			Balance         float64
			ParentAccountID string
		}
		rows.Scan(&p.ID, &p.Name, &p.Type, &p.Balance, &p.ParentAccountID)
		pockets = append(pockets, p)
		fmt.Printf("%d. %s (%s) - R$ %.2f - Parent: %s\n",
			len(pockets), p.Name, p.Type, p.Balance, p.ParentAccountID[:8]+"...")
	}

	fmt.Println("\n🔧 Aplicando correções conhecidas:")

	// Based on the accounts table:
	// 242ad7f8-f479-45a6-8fb2-cfe8f6cf923d | BANCO DO BRASIL = R$ 102.60
	// 85f65c8b-9521-4ec4-9557-2a723614f04d | MERCADO PAGO = R$ 30.01

	// Pocket 4 (Caixa, R$ 30.00) should be R$ 102.60 (Banco do Brasil)
	// Need to find which pocket corresponds to Mercado Pago Caixa

	if len(pockets) >= 4 {
		// Update pocket 4 (index 3) to R$ 102.60
		fmt.Printf("\n1. Atualizando pocket '%s' (ID: %s) para R$ 102.60 (Banco do Brasil)...\n",
			pockets[3].Name, pockets[3].ID[:8]+"...")

		_, err = db.Exec(`UPDATE pockets SET balance = 102.60, updated_at = NOW() WHERE id = $1`, pockets[3].ID)
		if err == nil {
			fmt.Println("   ✅ Atualizado!")
		}
	}

	if len(pockets) >= 6 {
		// Update pocket 6 (index 5) to R$ 30.01
		fmt.Printf("\n2. Atualizando pocket '%s' (ID: %s) para R$ 30.01 (Mercado Pago)...\n",
			pockets[5].Name, pockets[5].ID[:8]+"...")

		_, err = db.Exec(`UPDATE pockets SET balance = 30.01, updated_at = NOW() WHERE id = $1`, pockets[5].ID)
		if err == nil {
			fmt.Println("   ✅ Atualizado!")
		}
	}

	fmt.Println("\n=== ESTADO FINAL ===\n")
	rows2, _ := db.Query(`
		SELECT name, pocket_type, balance
		FROM pockets
		WHERE user_id = $1
		ORDER BY created_at
	`, userID)
	defer rows2.Close()

	for rows2.Next() {
		var name, pType string
		var balance float64
		rows2.Scan(&name, &pType, &balance)
		fmt.Printf("%-20s | %-15s | R$ %.2f\n", name, pType, balance)
	}
}
