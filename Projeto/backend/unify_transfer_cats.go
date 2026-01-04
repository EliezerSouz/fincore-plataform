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
	dbUrl := os.Getenv("DATABASE_URL")
	pool, err := pgxpool.New(context.Background(), dbUrl)
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()

	ctx := context.Background()

	// 1. Identificar a categoria Híbrida (TARGET)
	var targetId string
	err = pool.QueryRow(ctx, "SELECT id FROM categories WHERE name ILIKE 'TRANSFERÊNCIA' AND type = 'ambas' LIMIT 1").Scan(&targetId)
	if err != nil {
		// Se nao existir hibrida, tentar achar qualquer uma e converter
		fmt.Println("⚠️ Nenhuma categoria 'TRANSFERÊNCIA' do tipo 'ambas' encontrada. Tentando encontrar qualquer uma e converter...")
		err = pool.QueryRow(ctx, "SELECT id FROM categories WHERE name ILIKE 'TRANSFERÊNCIA' LIMIT 1").Scan(&targetId)
		if err != nil {
			log.Fatal("❌ Nenhuma categoria de Transferência encontrada para unificar.")
		}
		// Converter para ambas
		_, err = pool.Exec(ctx, "UPDATE categories SET type = 'ambas' WHERE id = $1", targetId)
		if err != nil {
			log.Fatal(err)
		}
		fmt.Printf("✅ Categoria %s convertida para 'ambas'\n", targetId)
	}

	fmt.Printf("🎯 Categoria Alvo (Híbrida): %s\n", targetId)

	// 2. Encontrar categorias duplicadas para migrar (SOURCES)
	// Buscar todas que chamam Transferência mas NÃO são a Target
	rows, err := pool.Query(ctx, "SELECT id, name, type FROM categories WHERE name ILIKE 'TRANSFERÊNCIA' AND id != $1", targetId)
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()

	for rows.Next() {
		var sourceId, name, catType string
		rows.Scan(&sourceId, &name, &catType)

		fmt.Printf("🔄 Migrando transações da categoria: %s (%s - %s)...\n", name, catType, sourceId)

		// 3. Mover transações
		tag, err := pool.Exec(ctx, "UPDATE transactions SET category_id = $1 WHERE category_id = $2", targetId, sourceId)
		if err != nil {
			log.Printf("❌ Erro ao migrar transações: %v\n", err)
			continue
		}
		fmt.Printf("   -> %d transações movidas.\n", tag.RowsAffected())

		// Mover subcategorias (se houver)
		tagSub, _ := pool.Exec(ctx, "UPDATE subcategories SET category_id = $1 WHERE category_id = $2", targetId, sourceId)
		fmt.Printf("   -> %d subcategorias movidas.\n", tagSub.RowsAffected())

		// 4. Deletar a categoria antiga
		_, err = pool.Exec(ctx, "DELETE FROM categories WHERE id = $1", sourceId)
		if err != nil {
			log.Printf("❌ Erro ao deletar categoria antiga: %v\n", err)
		} else {
			fmt.Println("   🗑️ Categoria antiga deletada.")
		}
	}

	fmt.Println("✨ Unificação concluída com sucesso!")
}
