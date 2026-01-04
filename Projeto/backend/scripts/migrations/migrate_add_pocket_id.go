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

	fmt.Println("🔄 MIGRATION: Adicionar pocket_id à liquidity_yields")
	fmt.Println("=" + string(make([]byte, 50)))
	fmt.Println()

	ctx := context.Background()

	// 1. Adicionar coluna pocket_id
	fmt.Println("➕ Adicionando coluna pocket_id...")
	_, err = pool.Exec(ctx, `
		ALTER TABLE liquidity_yields
		ADD COLUMN IF NOT EXISTS pocket_id UUID REFERENCES pockets(id) ON DELETE CASCADE
	`)
	if err != nil {
		log.Fatalf("Erro ao adicionar coluna: %v\n", err)
	}
	fmt.Println("   ✅ Coluna pocket_id adicionada")

	// 2. Criar índice
	fmt.Println("➕ Criando índice...")
	_, err = pool.Exec(ctx, `
		CREATE INDEX IF NOT EXISTS idx_liquidity_yields_pocket_id 
		ON liquidity_yields(pocket_id)
	`)
	if err != nil {
		log.Fatalf("Erro ao criar índice: %v\n", err)
	}
	fmt.Println("   ✅ Índice criado")

	// 3. Remover constraint antigo
	fmt.Println("🗑️  Removendo constraint antigo...")
	_, err = pool.Exec(ctx, `
		ALTER TABLE liquidity_yields
		DROP CONSTRAINT IF EXISTS unique_yield_per_account_date
	`)
	if err != nil {
		fmt.Printf("   ⚠️  Aviso: %v\n", err)
	} else {
		fmt.Println("   ✅ Constraint antigo removido")
	}

	// 4. Adicionar novo constraint
	fmt.Println("➕ Adicionando constraint de unicidade...")
	_, err = pool.Exec(ctx, `
		ALTER TABLE liquidity_yields
		ADD CONSTRAINT IF NOT EXISTS unique_yield_per_pocket_date 
		UNIQUE (pocket_id, date)
	`)
	if err != nil {
		fmt.Printf("   ⚠️  Aviso: %v\n", err)
	} else {
		fmt.Println("   ✅ Constraint adicionado")
	}

	// 5. Atualizar RLS policy
	fmt.Println("🔒 Atualizando RLS policy...")
	_, err = pool.Exec(ctx, `
		DROP POLICY IF EXISTS "Users can view own yields" ON liquidity_yields
	`)
	if err != nil {
		fmt.Printf("   ⚠️  Aviso ao remover policy: %v\n", err)
	}

	_, err = pool.Exec(ctx, `
		CREATE POLICY "Users can view own yields" ON liquidity_yields FOR SELECT
		USING (
			(account_id IN (SELECT id FROM accounts WHERE user_id = auth.uid()))
			OR
			(pocket_id IN (SELECT id FROM pockets WHERE user_id = auth.uid()))
		)
	`)
	if err != nil {
		fmt.Printf("   ⚠️  Aviso ao criar policy: %v\n", err)
	} else {
		fmt.Println("   ✅ RLS policy atualizada")
	}

	fmt.Println()
	fmt.Println("🎉 Migration concluída!")
	fmt.Println()
	fmt.Println("📝 Próximo passo:")
	fmt.Println("   Atualizar código para usar pocket_id")
}
