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
	godotenv.Load()
	pool, err := pgxpool.New(context.Background(), os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()

	fmt.Println("🔍 ANÁLISE DO CÁLCULO DE YIELD - POCKET EMERGENCIA")
	fmt.Println("=" + string(make([]byte, 60)))
	fmt.Println()

	ctx := context.Background()

	// 1. Buscar dados do pocket
	fmt.Println("📊 DADOS DO POCKET:")
	var pocketID, name, pocketType string
	var balance, yieldCdiRate float64
	var yieldEnabled bool
	var lastYieldDate *time.Time

	err = pool.QueryRow(ctx, `
		SELECT id, name, pocket_type, balance, yield_enabled, yield_cdi_rate, last_yield_date
		FROM pockets
		WHERE name ILIKE '%emergencia%'
		ORDER BY created_at DESC
		LIMIT 1
	`).Scan(&pocketID, &name, &pocketType, &balance, &yieldEnabled, &yieldCdiRate, &lastYieldDate)

	if err != nil {
		log.Fatalf("Erro ao buscar pocket: %v\n", err)
	}

	fmt.Printf("   ID: %s\n", pocketID)
	fmt.Printf("   Nome: %s\n", name)
	fmt.Printf("   Tipo: %s\n", pocketType)
	fmt.Printf("   Saldo: R$ %.2f\n", balance)
	fmt.Printf("   Yield Habilitado: %v\n", yieldEnabled)
	fmt.Printf("   Taxa CDI: %.2f%%\n", yieldCdiRate)
	if lastYieldDate != nil {
		fmt.Printf("   Última Data de Yield: %s\n", lastYieldDate.Format("02/01/2006"))
	} else {
		fmt.Printf("   Última Data de Yield: Nenhuma\n")
	}
	fmt.Println()

	// 2. Buscar yields anteriores
	fmt.Println("📈 YIELDS ANTERIORES:")
	rows, err := pool.Query(ctx, `
		SELECT date, base_amount, yield_amount, rate_applied, created_at
		FROM liquidity_yields
		WHERE pocket_id = $1
		ORDER BY date DESC
		LIMIT 10
	`, pocketID)

	if err != nil {
		log.Fatalf("Erro ao buscar yields: %v\n", err)
	}
	defer rows.Close()

	var totalYields float64
	count := 0
	for rows.Next() {
		var date, createdAt time.Time
		var baseAmount, yieldAmount, rateApplied float64
		err := rows.Scan(&date, &baseAmount, &yieldAmount, &rateApplied, &createdAt)
		if err != nil {
			log.Printf("Erro ao ler yield: %v\n", err)
			continue
		}
		fmt.Printf("   %s: Base=R$ %.2f, Yield=R$ %.2f, Rate=%.4f%%\n",
			date.Format("02/01/2006"), baseAmount, yieldAmount, rateApplied*100)
		totalYields += yieldAmount
		count++
	}

	if count == 0 {
		fmt.Println("   Nenhum yield anterior encontrado")
	} else {
		fmt.Printf("   TOTAL ACUMULADO: R$ %.2f\n", totalYields)
	}
	fmt.Println()

	// 3. Simular cálculo de hoje
	fmt.Println("🧮 SIMULAÇÃO DO CÁLCULO DE HOJE (26/12/2025):")

	// Taxa CDI do Banco Central
	cdiRate := 0.06 // 0.06% ao ano (conforme log)

	// Base amount = saldo operacional + yields anteriores
	baseAmount := balance + totalYields

	// Cálculo diário
	dailyCDI := cdiRate / 252.0     // Dividir por 252 dias úteis
	yieldPercentage := yieldCdiRate // Percentual do CDI (ex: 100, 105, 120)
	yieldAmount := baseAmount * (dailyCDI / 100.0) * (yieldPercentage / 100.0)
	rateApplied := dailyCDI * (yieldPercentage / 100.0)

	fmt.Printf("   Taxa CDI Anual: %.2f%%\n", cdiRate)
	fmt.Printf("   Taxa CDI Diária: %.6f%%\n", dailyCDI)
	fmt.Printf("   Percentual do CDI: %.2f%%\n", yieldPercentage)
	fmt.Printf("   Base Amount: R$ %.2f (saldo) + R$ %.2f (yields) = R$ %.2f\n",
		balance, totalYields, baseAmount)
	fmt.Printf("   Fórmula: %.2f × (%.6f / 100) × (%.2f / 100)\n",
		baseAmount, dailyCDI, yieldPercentage)
	fmt.Printf("   Yield Calculado: R$ %.4f\n", yieldAmount)
	fmt.Printf("   Taxa Aplicada: %.6f%%\n", rateApplied*100)
	fmt.Println()

	// 4. Comparar com o que foi salvo
	fmt.Println("📋 COMPARAÇÃO COM BANCO:")
	var savedBase, savedYield, savedRate float64
	err = pool.QueryRow(ctx, `
		SELECT base_amount, yield_amount, rate_applied
		FROM liquidity_yields
		WHERE pocket_id = $1
		AND date = CURRENT_DATE
	`, pocketID).Scan(&savedBase, &savedYield, &savedRate)

	if err != nil {
		fmt.Println("   ⚠️  Nenhum yield salvo para hoje ainda")
	} else {
		fmt.Printf("   Base Salva: R$ %.2f\n", savedBase)
		fmt.Printf("   Yield Salvo: R$ %.4f\n", savedYield)
		fmt.Printf("   Taxa Salva: %.6f%%\n", savedRate*100)
		fmt.Println()

		if savedBase != baseAmount {
			fmt.Printf("   ⚠️  DIFERENÇA NA BASE: Esperado R$ %.2f, Salvo R$ %.2f (diff: R$ %.2f)\n",
				baseAmount, savedBase, savedBase-baseAmount)
		}
		if savedYield != yieldAmount {
			fmt.Printf("   ⚠️  DIFERENÇA NO YIELD: Esperado R$ %.4f, Salvo R$ %.4f (diff: R$ %.4f)\n",
				yieldAmount, savedYield, savedYield-yieldAmount)
		}
	}

	fmt.Println()
	fmt.Println("=" + string(make([]byte, 60)))
}
