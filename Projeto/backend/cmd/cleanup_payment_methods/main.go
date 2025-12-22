package main

import (
	"context"
	"fmt"
	"log"

	"github.com/jackc/pgx/v5"
)

func main() {
	// Mesma string de conexão do .env
	dbURL := "postgresql://postgres:7UeEJR6rFxscG1Xa@db.dwcgzzqaajstzabjuqnw.supabase.co:5432/postgres?sslmode=require"
	conn, err := pgx.Connect(context.Background(), dbURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v", err)
	}
	defer conn.Close(context.Background())

	userID := "91c0f2da-205d-4f1a-b47a-621c575e7230" // edu@edu.com

	// Primeiro, verificar quantos seriam deletados
	var count int
	queryCheck := `
		SELECT COUNT(*) 
		FROM payment_methods 
		WHERE user_id = $1::uuid 
		  AND slug LIKE '%-' || $1::text
	`
	err = conn.QueryRow(context.Background(), queryCheck, userID).Scan(&count)
	if err != nil {
		log.Fatalf("Check failed: %v", err)
	}

	fmt.Printf("Encontrados %d métodos de pagamento duplicados criados recentemente.\n", count)

	if count > 0 {
		// Tentar deletar
		queryDelete := `
			DELETE FROM payment_methods 
			WHERE user_id = $1::uuid 
			  AND slug LIKE '%-' || $1::text
		`
		ct, err := conn.Exec(context.Background(), queryDelete, userID)
		if err != nil {
			log.Printf("Erro ao deletar: %v\n", err)
			log.Println("Provavelmente existem transações vinculadas a esses métodos.")
			log.Println("Recomendação: Manter os dados e filtrar no backend, ou migrar transações.")
		} else {
			fmt.Printf("Sucesso! %d registros deletados.\n", ct.RowsAffected())
		}
	} else {
		fmt.Println("Nada para deletar.")
	}
}
