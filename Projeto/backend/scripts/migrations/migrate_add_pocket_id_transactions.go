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

	fmt.Println("🔧 ADICIONANDO pocket_id EM transactions")
	fmt.Println("=" + string(make([]byte, 50)))
	fmt.Println()

	ctx := context.Background()

	// 1. Adicionar coluna pocket_id
	fmt.Println("📝 Adicionando coluna pocket_id...")
	_, err = pool.Exec(ctx, `
		ALTER TABLE transactions 
		ADD COLUMN IF NOT EXISTS pocket_id UUID REFERENCES pockets(id) ON DELETE SET NULL
	`)
	if err != nil {
		log.Fatalf("Erro ao adicionar coluna: %v\n", err)
	}
	fmt.Println("   ✅ Coluna pocket_id adicionada")

	// 2. Criar índice
	fmt.Println("📝 Criando índice...")
	_, err = pool.Exec(ctx, `
		CREATE INDEX IF NOT EXISTS idx_transactions_pocket_id ON transactions(pocket_id)
	`)
	if err != nil {
		log.Fatalf("Erro ao criar índice: %v\n", err)
	}
	fmt.Println("   ✅ Índice criado")

	// 3. Adicionar comentário
	fmt.Println("📝 Adicionando comentário...")
	_, err = pool.Exec(ctx, `
		COMMENT ON COLUMN transactions.pocket_id IS 'ID do pocket (subconta) ao qual esta transação pertence. Se NULL, afeta apenas a account principal.'
	`)
	if err != nil {
		log.Printf("⚠️  Aviso ao adicionar comentário: %v\n", err)
	} else {
		fmt.Println("   ✅ Comentário adicionado")
	}

	// 4. Atualizar RLS policy
	fmt.Println("📝 Atualizando RLS policy...")
	_, err = pool.Exec(ctx, `
		DROP POLICY IF EXISTS transactions_policy ON transactions
	`)
	if err != nil {
		log.Printf("⚠️  Aviso ao dropar policy: %v\n", err)
	}

	_, err = pool.Exec(ctx, `
		CREATE POLICY transactions_policy ON transactions
		FOR ALL
		USING (
			user_id = current_setting('app.current_user_id', true)::uuid
			OR EXISTS (
				SELECT 1 FROM accounts 
				WHERE accounts.id = transactions.account_id 
				AND accounts.user_id = current_setting('app.current_user_id', true)::uuid
			)
			OR EXISTS (
				SELECT 1 FROM pockets
				WHERE pockets.id = transactions.pocket_id
				AND pockets.user_id = current_setting('app.current_user_id', true)::uuid
			)
		)
		WITH CHECK (
			user_id = current_setting('app.current_user_id', true)::uuid
			OR EXISTS (
				SELECT 1 FROM accounts 
				WHERE accounts.id = transactions.account_id 
				AND accounts.user_id = current_setting('app.current_user_id', true)::uuid
			)
			OR EXISTS (
				SELECT 1 FROM pockets
				WHERE pockets.id = transactions.pocket_id
				AND pockets.user_id = current_setting('app.current_user_id', true)::uuid
			)
		)
	`)
	if err != nil {
		log.Fatalf("Erro ao criar policy: %v\n", err)
	}
	fmt.Println("   ✅ RLS policy atualizada")

	fmt.Println()
	fmt.Println("🎉 Migration concluída com sucesso!")
	fmt.Println()
	fmt.Println("📝 Próximo passo:")
	fmt.Println("   go run sync_pocket_balances.go")
}
