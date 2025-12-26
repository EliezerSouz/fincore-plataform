package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()
	pool, err := pgxpool.New(context.Background(), os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()

	fmt.Println("🔄 SINCRONIZANDO SALDOS: Pockets = Accounts")
	fmt.Println("=" + string(make([]byte, 50)))
	fmt.Println()

	ctx := context.Background()

	// Buscar todas as accounts e seus pockets
	rows, err := pool.Query(ctx, `
		SELECT 
			a.id as account_id,
			a.name as account_name,
			a.balance as account_balance,
			p.id as pocket_id,
			p.name as pocket_name,
			p.balance as pocket_balance
		FROM accounts a
		INNER JOIN pockets p ON p.parent_account_id = a.id
		WHERE a.deleted_at IS NULL
		ORDER BY a.name, p.name
	`)
	if err != nil {
		log.Fatalf("Erro ao buscar accounts e pockets: %v\n", err)
	}
	defer rows.Close()

	type PocketUpdate struct {
		AccountID      string
		AccountName    string
		AccountBalance float64
		PocketID       string
		PocketName     string
		PocketBalance  float64
	}

	var updates []PocketUpdate
	for rows.Next() {
		var u PocketUpdate
		err := rows.Scan(&u.AccountID, &u.AccountName, &u.AccountBalance, &u.PocketID, &u.PocketName, &u.PocketBalance)
		if err != nil {
			log.Printf("Erro ao ler linha: %v\n", err)
			continue
		}
		updates = append(updates, u)
	}

	if len(updates) == 0 {
		fmt.Println("⚠️  Nenhum pocket encontrado para sincronizar")
		return
	}

	fmt.Printf("📊 Encontrados %d pockets para sincronizar\n\n", len(updates))

	// Atualizar cada pocket
	updatedCount := 0
	for _, u := range updates {
		fmt.Printf("🔄 Account: %s (R$ %.2f)\n", u.AccountName, u.AccountBalance)
		fmt.Printf("   Pocket: %s\n", u.PocketName)
		fmt.Printf("   Saldo Atual: R$ %.2f\n", u.PocketBalance)
		fmt.Printf("   Novo Saldo:  R$ %.2f\n", u.AccountBalance)

		if u.PocketBalance == u.AccountBalance {
			fmt.Println("   ✅ Já está sincronizado\n")
			continue
		}

		// Atualizar saldo do pocket
		_, err := pool.Exec(ctx, `
			UPDATE pockets
			SET balance = $1, updated_at = NOW()
			WHERE id = $2
		`, u.AccountBalance, u.PocketID)

		if err != nil {
			fmt.Printf("   ❌ Erro ao atualizar: %v\n\n", err)
			continue
		}

		fmt.Printf("   ✅ Atualizado! (Diferença: R$ %.2f)\n\n", u.AccountBalance-u.PocketBalance)
		updatedCount++
	}

	fmt.Println("=" + string(make([]byte, 50)))
	fmt.Printf("🎉 Sincronização concluída!\n")
	fmt.Printf("   Total de pockets: %d\n", len(updates))
	fmt.Printf("   Atualizados: %d\n", updatedCount)
	fmt.Printf("   Já sincronizados: %d\n", len(updates)-updatedCount)
	fmt.Println()
	fmt.Println("✅ Todos os pockets agora têm o mesmo saldo da account mãe!")
}
