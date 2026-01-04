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

	fmt.Println("Iniciando migração GLOBAL de transações legadas...")

	rowsUsers, err := db.Query("SELECT id, full_name FROM users")
	if err != nil {
		panic(err)
	}
	defer rowsUsers.Close()

	for rowsUsers.Next() {
		var userID, name string
		rowsUsers.Scan(&userID, &name)
		fmt.Printf("\n>>> Migrando usuário: %s (%s)\n", name, userID)
		migrateUser(db, userID)
	}
}

func migrateUser(db *sql.DB, userID string) {
	// 1. Mapear Account -> Pocket (CAIXA)
	rows, err := db.Query(`
		SELECT p.parent_account_id, p.id
		FROM pockets p
		WHERE p.user_id = $1 
		  AND p.pocket_type = 'CAIXA' 
		  AND p.parent_account_id IS NOT NULL
	`, userID)
	if err != nil {
		fmt.Printf("Erro ao buscar pockets: %v\n", err)
		return
	}
	defer rows.Close()

	accountToPocket := make(map[string]string)
	for rows.Next() {
		var accID, pocketID string
		if err := rows.Scan(&accID, &pocketID); err == nil {
			accountToPocket[accID] = pocketID
		}
	}

	fmt.Printf("  Mapeamento Account -> Pocket: %d contas vinculadas.\n", len(accountToPocket))
	if len(accountToPocket) == 0 {
		fmt.Println("  Nenhum vinculo encontrado. Pulando.")
		return
	}

	// 2. Buscar transações sem Pocket
	txRows, err := db.Query(`
		SELECT id, description, account_id
		FROM transactions
		WHERE user_id = $1 
		  AND pocket_id IS NULL 
		  AND account_id IS NOT NULL
		  AND deleted_at IS NULL
	`, userID)
	if err != nil {
		fmt.Printf("Erro ao buscar transações: %v\n", err)
		return
	}
	defer txRows.Close()

	var toUpdate []struct {
		TxID     string
		PocketID string
	}

	count := 0
	for txRows.Next() {
		var txID, desc, accID string
		if err := txRows.Scan(&txID, &desc, &accID); err != nil {
			continue
		}
		count++

		if pocketID, ok := accountToPocket[accID]; ok {
			toUpdate = append(toUpdate, struct {
				TxID     string
				PocketID string
			}{txID, pocketID})
		}
	}

	fmt.Printf("  Transações sem pocket: %d. Migráveis: %d.\n", count, len(toUpdate))

	// 3. Executar Updates
	success := 0
	for _, item := range toUpdate {
		_, err := db.Exec("UPDATE transactions SET pocket_id = $1 WHERE id = $2", item.PocketID, item.TxID)
		if err == nil {
			success++
		}
	}

	if success > 0 {
		fmt.Printf("  ✅ Sucesso: %d transações atualizadas.\n", success)
	}
}
