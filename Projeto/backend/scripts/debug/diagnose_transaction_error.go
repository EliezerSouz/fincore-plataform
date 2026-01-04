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

	// Get user
	var userID string
	err = db.QueryRow("SELECT id FROM users LIMIT 1").Scan(&userID)
	if err != nil {
		fmt.Printf("Error getting user: %v\n", err)
		return
	}

	fmt.Printf("User ID: %s\n\n", userID)

	// Check accounts and pockets
	fmt.Println("=== ACCOUNTS ===")
	rows, err := db.Query(`
		SELECT a.id, a.name, a.type, a.balance, 
		       (SELECT COUNT(*) FROM pockets WHERE account_id = a.id AND deleted_at IS NULL) as pocket_count
		FROM accounts a
		WHERE a.user_id = $1 AND a.deleted_at IS NULL
		ORDER BY a.created_at
	`, userID)
	if err != nil {
		fmt.Printf("Error querying accounts: %v\n", err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var id, name, accType string
		var balance float64
		var pocketCount int
		rows.Scan(&id, &name, &accType, &balance, &pocketCount)
		fmt.Printf("Account: %s | %s | Type: %s | Balance: %.2f | Pockets: %d\n",
			id, name, accType, balance, pocketCount)
	}

	fmt.Println("\n=== POCKETS ===")
	rows2, err := db.Query(`
		SELECT p.id, p.name, p.pocket_type, p.balance, p.account_id, a.name as account_name
		FROM pockets p
		LEFT JOIN accounts a ON p.account_id = a.id
		WHERE p.user_id = $1 AND p.deleted_at IS NULL
		ORDER BY p.created_at
	`, userID)
	if err != nil {
		fmt.Printf("Error querying pockets: %v\n", err)
		return
	}
	defer rows2.Close()

	for rows2.Next() {
		var id, name, pocketType string
		var balance float64
		var accountID sql.NullString
		var accountName sql.NullString
		rows2.Scan(&id, &name, &pocketType, &balance, &accountID, &accountName)

		accInfo := "NO ACCOUNT"
		if accountID.Valid {
			accInfo = fmt.Sprintf("Account: %s (%s)", accountID.String, accountName.String)
		}

		fmt.Printf("Pocket: %s | %s | Type: %s | Balance: %.2f | %s\n",
			id, name, pocketType, balance, accInfo)
	}

	// Check for orphaned pockets (parent_account_id set but no account_id)
	fmt.Println("\n=== ORPHANED POCKETS CHECK ===")
	var orphanCount int
	db.QueryRow(`
		SELECT COUNT(*) 
		FROM pockets 
		WHERE user_id = $1 
		  AND deleted_at IS NULL 
		  AND account_id IS NULL 
		  AND parent_account_id IS NOT NULL
	`, userID).Scan(&orphanCount)

	if orphanCount > 0 {
		fmt.Printf("⚠️  Found %d orphaned pockets (parent_account_id set but account_id NULL)\n", orphanCount)
	} else {
		fmt.Println("✅ No orphaned pockets found")
	}

	// Test transaction creation simulation
	fmt.Println("\n=== SIMULATING TRANSACTION CREATION ===")

	// Get first account
	var testAccountID string
	var testAccountName string
	err = db.QueryRow(`
		SELECT id, name 
		FROM accounts 
		WHERE user_id = $1 AND deleted_at IS NULL 
		ORDER BY created_at 
		LIMIT 1
	`, userID).Scan(&testAccountID, &testAccountName)

	if err != nil {
		fmt.Printf("❌ No accounts found for user\n")
		return
	}

	fmt.Printf("Test Account: %s (%s)\n", testAccountID, testAccountName)

	// Check if account has pockets
	var pocketID sql.NullString
	err = db.QueryRow(`
		SELECT id 
		FROM pockets 
		WHERE account_id = $1 AND deleted_at IS NULL 
		ORDER BY created_at ASC 
		LIMIT 1
	`, testAccountID).Scan(&pocketID)

	if err != nil || !pocketID.Valid {
		fmt.Printf("⚠️  Account has NO pockets - transaction will fail if pocket_id is required\n")
		fmt.Printf("   Error: %v\n", err)
	} else {
		fmt.Printf("✅ Found default pocket: %s\n", pocketID.String)
	}

	// Check balance adjustments
	var lastAdjustment sql.NullTime
	err = db.QueryRow(`
		SELECT adjustment_date 
		FROM account_balance_adjustments
		WHERE account_id = $1 AND deleted_at IS NULL
		ORDER BY adjustment_date DESC, created_at DESC
		LIMIT 1
	`, testAccountID).Scan(&lastAdjustment)

	if err != nil && err != sql.ErrNoRows {
		fmt.Printf("Error checking adjustments: %v\n", err)
	} else if !lastAdjustment.Valid {
		fmt.Printf("ℹ️  No balance adjustments found for account\n")
	} else {
		fmt.Printf("Last adjustment: %v\n", lastAdjustment.Time)
	}
}
