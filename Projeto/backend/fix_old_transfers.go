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

	fmt.Println("=== CORRIGINDO DESCRIÇÕES E SALDOS ===\n")

	// Get transfers with wrong description
	rows, err := db.Query(`
		SELECT 
			t.id,
			t.description,
			t.amount,
			t.pocket_id,
			p.name as pocket_name,
			t.related_transaction_id,
			p2.name as related_pocket_name
		FROM transactions t
		JOIN pockets p ON t.pocket_id = p.id
		LEFT JOIN transactions t2 ON t.related_transaction_id = t2.id
		LEFT JOIN pockets p2 ON t2.pocket_id = p2.id
		WHERE t.type = 'transferencia'
		  AND t.description = 'Transferência entre pockets'
		  AND t.created_at >= NOW() - INTERVAL '1 hour'
		ORDER BY t.created_at
	`)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}
	defer rows.Close()

	count := 0
	for rows.Next() {
		var id, desc, pocketID, pocketName string
		var relatedID, relatedPocketName sql.NullString
		var amount float64

		rows.Scan(&id, &desc, &amount, &pocketID, &pocketName, &relatedID, &relatedPocketName)
		count++

		if !relatedPocketName.Valid {
			fmt.Printf("⚠️  Transação %s sem pocket relacionado\n", id[:8])
			continue
		}

		// Determine if this is source or target based on which was created first
		// For simplicity, we'll check the related transaction
		var isSource bool
		var otherDesc string
		db.QueryRow(`
			SELECT description FROM transactions WHERE id = $1
		`, relatedID.String).Scan(&otherDesc)

		// If the other one already has a proper description, use that to determine
		if otherDesc != "Transferência entre pockets" {
			// The other one was already fixed, so this is the opposite
			if contains(otherDesc, "para") {
				isSource = false // other is source, this is target
			} else {
				isSource = true // other is target, this is source
			}
		} else {
			// Both need fixing - assume first one is source
			isSource = true
		}

		var newDesc string
		var balanceChange float64

		if isSource {
			newDesc = fmt.Sprintf("Transferência para %s", relatedPocketName.String)
			balanceChange = -amount
			fmt.Printf("📤 %s: '%s' (-%0.2f)\n", pocketName, newDesc, amount)
		} else {
			newDesc = fmt.Sprintf("Transferência de %s", relatedPocketName.String)
			balanceChange = amount
			fmt.Printf("📥 %s: '%s' (+%.2f)\n", pocketName, newDesc, amount)
		}

		// Update description
		_, err := db.Exec(`UPDATE transactions SET description = $1 WHERE id = $2`, newDesc, id)
		if err != nil {
			fmt.Printf("   ❌ Erro ao atualizar descrição: %v\n", err)
			continue
		}

		// Update balance
		_, err = db.Exec(`UPDATE pockets SET balance = balance + $1 WHERE id = $2`, balanceChange, pocketID)
		if err != nil {
			fmt.Printf("   ❌ Erro ao atualizar saldo: %v\n", err)
		} else {
			fmt.Printf("   ✅ Saldo atualizado\n\n")
		}
	}

	fmt.Printf("\n✅ %d transações corrigidas\n\n", count)

	fmt.Println("=== SALDOS FINAIS ===\n")
	rows2, _ := db.Query(`SELECT name, balance FROM pockets ORDER BY created_at`)
	defer rows2.Close()

	for rows2.Next() {
		var name string
		var balance float64
		rows2.Scan(&name, &balance)
		fmt.Printf("%-20s: R$ %.2f\n", name, balance)
	}
}

func contains(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
