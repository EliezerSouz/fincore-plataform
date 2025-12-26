package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Connect to database
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL not set")
	}

	pool, err := pgxpool.New(context.Background(), dbURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
	defer pool.Close()

	fmt.Println("🔄 MIGRAÇÃO: Corrigir Tipo de Transferências")
	fmt.Println("=" + string(make([]byte, 50)))
	fmt.Println()

	ctx := context.Background()

	// 1. Verificar quantas transferências existem
	fmt.Println("📊 Verificando transferências existentes...")
	var total, receitas, despesas, corretas int
	err = pool.QueryRow(ctx, `
		SELECT 
			COUNT(*) as total,
			COUNT(CASE WHEN type = 'receita' THEN 1 END) as receitas,
			COUNT(CASE WHEN type = 'despesa' THEN 1 END) as despesas,
			COUNT(CASE WHEN type = 'transferencia' THEN 1 END) as corretas
		FROM transactions
		WHERE related_transaction_id IS NOT NULL
		  AND deleted_at IS NULL
	`).Scan(&total, &receitas, &despesas, &corretas)

	if err != nil {
		log.Fatalf("Erro ao verificar transferências: %v\n", err)
	}

	fmt.Printf("   Total de transferências: %d\n", total)
	fmt.Printf("   ❌ Marcadas como receita: %d\n", receitas)
	fmt.Printf("   ❌ Marcadas como despesa: %d\n", despesas)
	fmt.Printf("   ✅ Já corretas: %d\n", corretas)
	fmt.Println()

	if receitas == 0 && despesas == 0 {
		fmt.Println("✅ Todas as transferências já estão com tipo correto!")
		fmt.Println("   Nenhuma migração necessária.")
		return
	}

	// 2. Confirmar migração
	fmt.Printf("⚠️  Será necessário atualizar %d transações.\n", receitas+despesas)
	fmt.Print("   Deseja continuar? (s/N): ")

	var resposta string
	fmt.Scanln(&resposta)

	if resposta != "s" && resposta != "S" {
		fmt.Println("❌ Migração cancelada pelo usuário.")
		return
	}

	// 3. Executar migração em uma transação
	fmt.Println()
	fmt.Println("🔄 Executando migração...")

	tx, err := pool.Begin(ctx)
	if err != nil {
		log.Fatalf("Erro ao iniciar transação: %v\n", err)
	}
	defer tx.Rollback(ctx)

	// Atualizar tipo
	result, err := tx.Exec(ctx, `
		UPDATE transactions
		SET 
			type = 'transferencia',
			updated_at = NOW()
		WHERE related_transaction_id IS NOT NULL
		  AND type != 'transferencia'
		  AND deleted_at IS NULL
	`)

	if err != nil {
		log.Fatalf("Erro ao atualizar transferências: %v\n", err)
	}

	rowsAffected := result.RowsAffected()
	fmt.Printf("   ✅ %d transações atualizadas\n", rowsAffected)

	// Commit
	if err := tx.Commit(ctx); err != nil {
		log.Fatalf("Erro ao fazer commit: %v\n", err)
	}

	fmt.Println()
	fmt.Println("✅ Migração concluída com sucesso!")
	fmt.Println()

	// 4. Verificar resultado
	fmt.Println("📊 Verificando resultado...")
	err = pool.QueryRow(ctx, `
		SELECT 
			COUNT(*) as total,
			COUNT(CASE WHEN type = 'receita' THEN 1 END) as receitas,
			COUNT(CASE WHEN type = 'despesa' THEN 1 END) as despesas,
			COUNT(CASE WHEN type = 'transferencia' THEN 1 END) as corretas
		FROM transactions
		WHERE related_transaction_id IS NOT NULL
		  AND deleted_at IS NULL
	`).Scan(&total, &receitas, &despesas, &corretas)

	if err != nil {
		log.Fatalf("Erro ao verificar resultado: %v\n", err)
	}

	fmt.Printf("   Total de transferências: %d\n", total)
	fmt.Printf("   ❌ Marcadas como receita: %d\n", receitas)
	fmt.Printf("   ❌ Marcadas como despesa: %d\n", despesas)
	fmt.Printf("   ✅ Corretas: %d\n", corretas)
	fmt.Println()

	// 5. Mostrar algumas transferências atualizadas
	fmt.Println("📋 Últimas transferências atualizadas:")
	rows, err := pool.Query(ctx, `
		SELECT 
			id,
			description,
			amount,
			type,
			date,
			updated_at
		FROM transactions
		WHERE related_transaction_id IS NOT NULL
		  AND type = 'transferencia'
		  AND deleted_at IS NULL
		ORDER BY updated_at DESC
		LIMIT 5
	`)

	if err != nil {
		log.Fatalf("Erro ao buscar transferências: %v\n", err)
	}
	defer rows.Close()

	for rows.Next() {
		var id, description, txType string
		var amount float64
		var date, updatedAt time.Time

		if err := rows.Scan(&id, &description, &amount, &txType, &date, &updatedAt); err != nil {
			log.Printf("Erro ao ler linha: %v\n", err)
			continue
		}

		fmt.Printf("   - %s: R$ %.2f (%s) - %s\n",
			description, amount, date.Format("02/01/2006"), txType)
	}

	fmt.Println()
	fmt.Println("🎉 Migração concluída!")
	fmt.Println()
	fmt.Println("⚠️  IMPORTANTE:")
	fmt.Println("   - Os saldos NÃO foram recalculados (não é necessário)")
	fmt.Println("   - As transferências agora aparecem corretamente nos relatórios")
	fmt.Println("   - Filtros de transferências agora funcionam")
}
