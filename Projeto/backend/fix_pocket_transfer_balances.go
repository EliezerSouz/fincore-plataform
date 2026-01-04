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

	fmt.Println("=== CORRIGINDO SALDOS DAS TRANSFERÊNCIAS ENTRE POCKETS ===\n")

	// Get the transfers
	rows, err := db.Query(`
		SELECT 
			t.id,
			t.description,
			t.amount,
			t.pocket_id,
			p.name as pocket_name,
			p.balance as current_balance
		FROM transactions t
		JOIN pockets p ON t.pocket_id = p.id
		WHERE t.type = 'transferencia'
		  AND t.created_at >= NOW() - INTERVAL '1 hour'
		ORDER BY t.created_at
	`)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}
	defer rows.Close()

	type Transfer struct {
		ID             string
		Description    string
		Amount         float64
		PocketID       string
		PocketName     string
		CurrentBalance float64
	}

	var transfers []Transfer
	for rows.Next() {
		var t Transfer
		rows.Scan(&t.ID, &t.Description, &t.Amount, &t.PocketID, &t.PocketName, &t.CurrentBalance)
		transfers = append(transfers, t)
	}

	fmt.Printf("Encontradas %d transferências\n\n", len(transfers))

	for _, t := range transfers {
		var balanceChange float64

		// Determine balance change based on description
		if contains(t.Description, "para") {
			// Source - decrease
			balanceChange = -t.Amount
			fmt.Printf("📤 Saída: %s (-%0.2f)\n", t.PocketName, t.Amount)
		} else if contains(t.Description, "de") {
			// Target - increase
			balanceChange = t.Amount
			fmt.Printf("📥 Entrada: %s (+%.2f)\n", t.PocketName, t.Amount)
		} else {
			fmt.Printf("⚠️  Descrição não reconhecida: %s\n", t.Description)
			continue
		}

		// Update pocket balance
		_, err := db.Exec(`
			UPDATE pockets
			SET balance = balance + $1
			WHERE id = $2
		`, balanceChange, t.PocketID)

		if err != nil {
			fmt.Printf("   ❌ Erro ao atualizar: %v\n", err)
		} else {
			newBalance := t.CurrentBalance + balanceChange
			fmt.Printf("   ✅ %s: R$ %.2f → R$ %.2f\n\n", t.PocketName, t.CurrentBalance, newBalance)
		}
	}

	fmt.Println("=== SALDOS FINAIS ===\n")
	rows2, _ := db.Query(`
		SELECT name, pocket_type, balance
		FROM pockets
		ORDER BY created_at
	`)
	defer rows2.Close()

	for rows2.Next() {
		var name, pType string
		var balance float64
		rows2.Scan(&name, &pType, &balance)
		fmt.Printf("%-20s (%-14s): R$ %.2f\n", name, pType, balance)
	}
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > len(substr) && (s[:len(substr)] == substr || s[len(s)-len(substr):] == substr || findSubstring(s, substr)))
}

func findSubstring(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
