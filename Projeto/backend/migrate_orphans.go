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

	userID := "2b94dd60-8550-4dbe-9705-9ff0540179c4"

	// 1. Encontrar um Pocket de Destino (Fallback - O mais antigo)
	var fallbackPocketID, fallbackPocketName string
	err = db.QueryRow(`
        SELECT id, name FROM pockets 
        WHERE user_id=$1 AND pocket_type='CAIXA' 
        ORDER BY created_at ASC LIMIT 1
    `, userID).Scan(&fallbackPocketID, &fallbackPocketName)

	if err != nil {
		fmt.Printf("❌ ERRO: Usuário não possui nenhum Pocket CAIXA para receber as transações órfãs.\n")
		return
	}

	fmt.Printf("✅ Pocket de Destino Encontrado: %s (%s)\n", fallbackPocketName, fallbackPocketID)

	// 2. Atualizar TODAS as transações sem pocket para este pocket
	fmt.Println("Migrando transações órfãs...")

	res, err := db.Exec(`
        UPDATE transactions 
        SET pocket_id = $1 
        WHERE user_id = $2 AND pocket_id IS NULL AND deleted_at IS NULL
    `, fallbackPocketID, userID)

	if err != nil {
		fmt.Printf("❌ Erro no Update: %v\n", err)
		return
	}

	affect, _ := res.RowsAffected()
	fmt.Printf("✅ SUCESSO! %d transações órfãs foram vinculadas ao pocket '%s'.\n", affect, fallbackPocketName)
}
