package repository

import (
	"context"
	"fmt"
	"math"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type DashboardRepository struct {
	db *pgxpool.Pool
}

func NewDashboardRepository(db *pgxpool.Pool) *DashboardRepository {
	fmt.Println("DEBUG: DashboardRepository initialized - FIX APPLIED")
	return &DashboardRepository{db: db}
}

type CategorySpending struct {
	Name    string  `json:"name"`
	Value   float64 `json:"value"`
	Percent float64 `json:"percent"`
	Color   string  `json:"color"`
	Icon    string  `json:"icon"`
}

type MonthlyHistory struct {
	Month   string  `json:"name"`
	Receita float64 `json:"receita"`
	Despesa float64 `json:"despesa"`
	Saldo   float64 `json:"saldo"`
}

type InvoiceAlert struct {
	ID            string  `json:"id"`
	CardID        string  `json:"card_id"`
	CardName      string  `json:"card_name"`
	CardLast4     string  `json:"card_last4"`
	Amount        float64 `json:"amount"`
	DueDate       string  `json:"due_date"`
	Status        string  `json:"status"` // "overdue", "due_today", "due_soon", "open"
	DaysRemaining int     `json:"days_remaining"`
}

type FinancialSummary struct {
	Liquidez      float64            `json:"liquidez"`
	Patrimonio    float64            `json:"patrimonio"`
	Compromissos  float64            `json:"compromissos"` // Total (vencidos + a vencer) - mantido para compatibilidade
	PayablesTotal float64            `json:"payables_total"`
	InvoicesTotal float64            `json:"invoices_total"`
	ReceitaMensal float64            `json:"receita_mensal"`
	DespesaMensal float64            `json:"despesa_mensal"`
	History       []MonthlyHistory   `json:"history"`
	TopCategories []CategorySpending `json:"top_categories"`
	Invoices      []InvoiceAlert     `json:"invoices"`

	// FinCore Metrics - Separação de Compromissos
	CompromissosVencidos float64 `json:"compromissos_vencidos"` // Contas e faturas VENCIDAS
	CompromissosAVencer  float64 `json:"compromissos_a_vencer"` // Contas e faturas A VENCER
	OverdueCount         int     `json:"overdue_count"`         // Quantidade de itens vencidos

	// FinCore Metrics - Reserva
	ReservaEmergencia float64 `json:"reserva_emergencia"` // Reserva de emergência (NÃO entra no PULSO, só no Runway)

	// FinCore Metrics - Calculados
	TotalBalance             float64 `json:"total_balance"`              // PULSO (exibição) = Liquidez REAL
	AvailableForCalculations float64 `json:"available_for_calculations"` // Saldo após vencidos (para Score/Runway)
	HealthStatus             string  `json:"health_status"`              // Coração Forte, Ritmo Estável, Atenção, Arritmia, Crítico
	Score                    int     `json:"score"`                      // 0-1000
	Runway                   float64 `json:"runway"`                     // Meses de sobrevivência
}

func (r *DashboardRepository) GetSummary(ctx context.Context, userID string) (*FinancialSummary, error) {
	summary := &FinancialSummary{
		History:       []MonthlyHistory{},
		TopCategories: []CategorySpending{},
		Invoices:      []InvoiceAlert{},
	}

	// 1. Calculate Liquidity, Patrimony and Emergency Reserve (Accounts)
	queryAccounts := `
		SELECT 
			COALESCE(SUM(CASE WHEN type = 'corrente' OR type = 'poupanca' OR type = 'carteira' OR type = 'outros' OR type = 'digital' OR type = 'reserva_emergencia' OR type = 'vale_alimentacao' OR type = 'internacional' THEN balance ELSE 0 END), 0) as liquidez,
			COALESCE(SUM(CASE WHEN type = 'investimento' THEN balance ELSE 0 END), 0) as patrimonio,
			COALESCE(SUM(CASE WHEN type = 'reserva_emergencia' OR type = 'poupanca' THEN balance ELSE 0 END), 0) as reserva_emergencia
		FROM accounts
		WHERE user_id = $1::uuid AND is_active = true
	`
	err := r.db.QueryRow(ctx, queryAccounts, userID).Scan(&summary.Liquidez, &summary.Patrimonio, &summary.ReservaEmergencia)
	if err != nil {
		fmt.Printf("ERROR in GetSummary (Accounts): %v\n", err)
		return nil, fmt.Errorf("failed to calculate account summary: %w", err)
	}

	// 2. Calculate Monthly Flow (Income vs Expense) - "The Pulse"
	// Current month only. EXCLUDING transfers.
	now := time.Now()
	currentYear, currentMonth, _ := now.Date()
	startOfMonth := time.Date(currentYear, currentMonth, 1, 0, 0, 0, 0, now.Location())
	firstOfNextMonth := startOfMonth.AddDate(0, 1, 0)
	endOfMonth := firstOfNextMonth.Add(-time.Nanosecond)

	startOfMonthStr := startOfMonth.Format("2006-01-02")
	endOfMonthStr := endOfMonth.Format("2006-01-02")

	queryFlow := `
		SELECT 
			COALESCE(SUM(CASE WHEN t.type = 'receita' THEN t.amount ELSE 0 END), 0) as receita,
			COALESCE(SUM(CASE WHEN t.type = 'despesa' THEN t.amount ELSE 0 END), 0) as despesa
		FROM transactions t
		LEFT JOIN categories c ON t.category_id = c.id
		WHERE t.user_id = $1::uuid 
		  AND t.date >= $2 AND t.date <= $3
		  AND t.type != 'transferencia'
		  AND t.related_transaction_id IS NULL
		  AND (c.name IS NULL OR c.name NOT ILIKE 'Transferência%')
	`
	err = r.db.QueryRow(ctx, queryFlow, userID, startOfMonthStr, endOfMonthStr).Scan(&summary.ReceitaMensal, &summary.DespesaMensal)
	if err != nil {
		return nil, fmt.Errorf("failed to calculate monthly flow: %w", err)
	}

	// 3. Calculate Commitments - SEPARAÇÃO: VENCIDOS vs A VENCER
	// ============================================================
	// VENCIDOS: Impactam PULSO e SCORE (penalidade)
	// A VENCER: Impactam apenas RUNWAY (planejamento)

	today := time.Now()
	todayStr := time.Date(today.Year(), today.Month(), today.Day(), 0, 0, 0, 0, today.Location()).Format("2006-01-02")

	// 3a. Payables VENCIDOS (Contas a Pagar vencidas - até hoje)
	queryPayablesOverdue := `
		SELECT COALESCE(SUM(amount), 0), COUNT(*)
		FROM payables
		WHERE user_id = $1::uuid 
		  AND status NOT IN ('paid', 'cancelled') 
		  AND (paid_at IS NULL)
		  AND due_date < $2
	`
	var payablesOverdue float64
	var payablesOverdueCount int
	err = r.db.QueryRow(ctx, queryPayablesOverdue, userID, todayStr).Scan(&payablesOverdue, &payablesOverdueCount)
	if err != nil {
		return nil, fmt.Errorf("failed to calculate overdue payables: %w", err)
	}

	// 3b. Payables A VENCER (Contas a Pagar no prazo - de hoje até fim do mês)
	queryPayablesPending := `
		SELECT COALESCE(SUM(amount), 0)
		FROM payables
		WHERE user_id = $1::uuid 
		  AND status NOT IN ('paid', 'cancelled') 
		  AND (paid_at IS NULL)
		  AND due_date >= $2
		  AND due_date <= $3
	`
	var payablesPending float64
	err = r.db.QueryRow(ctx, queryPayablesPending, userID, todayStr, endOfMonthStr).Scan(&payablesPending)
	if err != nil {
		return nil, fmt.Errorf("failed to calculate pending payables: %w", err)
	}

	// 3c. Invoices VENCIDAS (Faturas de Cartão vencidas - até hoje)
	queryInvoicesOverdue := `
		SELECT COALESCE(SUM(total_amount - paid_amount), 0), COUNT(*)
		FROM credit_card_invoices
		WHERE user_id = $1::uuid 
		  AND status NOT IN ('paid')
		  AND (total_amount - paid_amount) > 0.01
		  AND due_date < $2
	`
	var invoicesOverdue float64
	var invoicesOverdueCount int
	err = r.db.QueryRow(ctx, queryInvoicesOverdue, userID, todayStr).Scan(&invoicesOverdue, &invoicesOverdueCount)
	if err != nil {
		return nil, fmt.Errorf("failed to calculate overdue invoices: %w", err)
	}

	// 3d. Invoices A VENCER (Faturas abertas no prazo - de hoje até fim do mês)
	queryInvoicesPending := `
		SELECT COALESCE(SUM(total_amount - paid_amount), 0)
		FROM credit_card_invoices
		WHERE user_id = $1::uuid 
		  AND status NOT IN ('paid')
		  AND (total_amount - paid_amount) > 0.01
		  AND due_date >= $2
		  AND due_date <= $3
	`
	var invoicesPending float64
	err = r.db.QueryRow(ctx, queryInvoicesPending, userID, todayStr, endOfMonthStr).Scan(&invoicesPending)
	if err != nil {
		return nil, fmt.Errorf("failed to calculate pending invoices: %w", err)
	}

	// Consolidar valores
	summary.CompromissosVencidos = payablesOverdue + invoicesOverdue
	summary.CompromissosAVencer = payablesPending + invoicesPending
	summary.Compromissos = summary.CompromissosVencidos + summary.CompromissosAVencer // Total para compatibilidade
	summary.OverdueCount = payablesOverdueCount + invoicesOverdueCount

	// Manter campos legados
	summary.PayablesTotal = payablesOverdue + payablesPending
	summary.InvoicesTotal = invoicesOverdue + invoicesPending

	// 4. Calculate History (Last 6 Months)
	startOfHistory := startOfMonth.AddDate(0, -5, 0)
	startOfHistoryStr := startOfHistory.Format("2006-01-02")

	queryHistory := `
		SELECT 
			EXTRACT(MONTH FROM t.date) as month,
			EXTRACT(YEAR FROM t.date) as year,
			COALESCE(SUM(CASE WHEN t.type = 'receita' THEN t.amount ELSE 0 END), 0) as receita,
			COALESCE(SUM(CASE WHEN t.type = 'despesa' THEN t.amount ELSE 0 END), 0) as despesa
		FROM transactions t
		LEFT JOIN categories c ON t.category_id = c.id
		WHERE t.user_id = $1::uuid 
		  AND t.date >= $2 AND t.date <= $3
		  AND t.type != 'transferencia'
		  AND t.related_transaction_id IS NULL
		  AND (c.name IS NULL OR c.name NOT ILIKE 'Transferência%')
		GROUP BY 1, 2
		ORDER BY 2 ASC, 1 ASC
	`

	rows, err := r.db.Query(ctx, queryHistory, userID, startOfHistoryStr, endOfMonthStr)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch history: %w", err)
	}
	defer rows.Close()

	monthMap := map[int]string{
		1: "Jan", 2: "Fev", 3: "Mar", 4: "Abr", 5: "Mai", 6: "Jun",
		7: "Jul", 8: "Ago", 9: "Set", 10: "Out", 11: "Nov", 12: "Dez",
	}

	for rows.Next() {
		var m, y int
		var rec, desp float64
		if err := rows.Scan(&m, &y, &rec, &desp); err != nil {
			return nil, fmt.Errorf("failed to scan history row: %w", err)
		}

		summary.History = append(summary.History, MonthlyHistory{
			Month:   monthMap[m],
			Receita: rec,
			Despesa: desp,
			Saldo:   rec - desp,
		})
	}

	// 5. Calculate Top Categories (Spending Awareness)
	queryCategories := `
		SELECT COALESCE(c.name, 'Outros'), COALESCE(SUM(t.amount), 0), COALESCE(c.color, '#cbd5e1'), COALESCE(c.icon, 'tag')
		FROM transactions t
		LEFT JOIN categories c ON t.category_id = c.id
		WHERE t.user_id = $1::uuid 
		  AND t.date >= $2 AND t.date <= $3
		  AND t.type = 'despesa'
		  AND t.related_transaction_id IS NULL
		  AND (c.name IS NULL OR c.name NOT ILIKE 'Transferência%')
		GROUP BY c.name, c.color, c.icon
		ORDER BY SUM(t.amount) DESC
		LIMIT 3
	`

	rowsCat, err := r.db.Query(ctx, queryCategories, userID, startOfMonthStr, endOfMonthStr)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch categories: %w", err)
	}
	defer rowsCat.Close()

	for rowsCat.Next() {
		var catName string
		var catValue float64
		var catColor string
		var catIcon string
		if err := rowsCat.Scan(&catName, &catValue, &catColor, &catIcon); err != nil {
			return nil, fmt.Errorf("failed to scan category row: %w", err)
		}

		percent := 0.0
		if summary.DespesaMensal > 0 {
			percent = (catValue / summary.DespesaMensal) * 100
		}

		summary.TopCategories = append(summary.TopCategories, CategorySpending{
			Name:    catName,
			Value:   catValue,
			Percent: percent,
			Color:   catColor,
			Icon:    catIcon,
		})
	}

	// 6. Calculate Invoice Alerts
	queryInvoiceAlerts := `
		SELECT 
			i.id,
			c.id,
			c.name, 
			COALESCE(c.last_4_digits, ''),
			(i.total_amount - i.paid_amount) as amount,
			i.due_date
		FROM credit_card_invoices i
		JOIN credit_cards c ON i.credit_card_id = c.id
		WHERE i.user_id = $1::uuid 
		  AND i.status != 'paid'
		  AND (i.total_amount - i.paid_amount) > 0
		ORDER BY i.due_date ASC
	`

	rowsInv, err := r.db.Query(ctx, queryInvoiceAlerts, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch invoices: %w", err)
	}
	defer rowsInv.Close()

	for rowsInv.Next() {
		var invID string
		var cardID, cardName, cardLast4 string
		var amount float64
		var dueDate time.Time

		if err := rowsInv.Scan(&invID, &cardID, &cardName, &cardLast4, &amount, &dueDate); err != nil {
			return nil, fmt.Errorf("failed to scan invoice row: %w", err)
		}

		// Calculate days remaining
		now := time.Now()
		today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
		// Normalize due date to midnight
		due := time.Date(dueDate.Year(), dueDate.Month(), dueDate.Day(), 0, 0, 0, 0, dueDate.Location())

		days := int(due.Sub(today).Hours() / 24)

		status := "open"
		if days < 0 {
			status = "overdue"
		} else if days == 0 {
			status = "due_today"
		} else if days <= 7 {
			status = "due_soon"
		}

		summary.Invoices = append(summary.Invoices, InvoiceAlert{
			ID:            invID,
			CardID:        cardID,
			CardName:      cardName,
			CardLast4:     cardLast4,
			Amount:        amount,
			DueDate:       dueDate.Format("2006-01-02"),
			Status:        status,
			DaysRemaining: days,
		})
	}

	// 7. Calculate FinCore Metrics (The Heartbeat Logic) - OFFICIAL RULES
	// ========================================================================

	// 7.1 PULSO FINANCEIRO (Real Financial Breath)
	// REGRA NOVA: PULSO (exibição) = Liquidez REAL (sem descontar nada)
	// Para CÁLCULOS (Score/Runway) = Liquidez - Vencidos
	// NOTE: Investments are NOT included (they're patrimony, not liquidity)

	summary.TotalBalance = summary.Liquidez                                            // PULSO = Saldo REAL (para exibição)
	summary.AvailableForCalculations = summary.Liquidez - summary.CompromissosVencidos // Para cálculos

	// 7.2 RUNWAY (Financial Runway in Months)
	// REGRA: Runway = (Saldo Disponível - A Vencer) ÷ Média de Despesas
	// Usa AvailableForCalculations (já descontou vencidos)
	// This answers: "How many months can I survive with current rhythm?"

	// Calculate average monthly expenses from last 6 months
	// IMPORTANTE: Contar apenas meses com despesas REAIS (> 0)
	avgMonthlyExpenses := 0.0
	if len(summary.History) > 0 {
		totalExpenses := 0.0
		monthsWithExpenses := 0

		for _, month := range summary.History {
			// Contar apenas meses com despesas reais
			if month.Despesa > 0 {
				totalExpenses += month.Despesa
				monthsWithExpenses++
			}
		}

		// Calcular média apenas com meses que tiveram gastos
		if monthsWithExpenses > 0 {
			avgMonthlyExpenses = totalExpenses / float64(monthsWithExpenses)
		} else {
			// Se nenhum mês teve gastos, usar despesa atual
			avgMonthlyExpenses = summary.DespesaMensal
		}
	} else {
		// Fallback to current month if no history
		avgMonthlyExpenses = summary.DespesaMensal
	}

	// Avoid division by zero
	if avgMonthlyExpenses <= 0 {
		avgMonthlyExpenses = 1
	}

	// Calculate Runway: (Saldo disponível + Reserva Emergência) - A Vencer
	// IMPORTANTE: Reserva de Emergência SÓ entra no Runway, NÃO no PULSO
	liquidezAposCompromissos := summary.AvailableForCalculations + summary.ReservaEmergencia - summary.CompromissosAVencer

	if liquidezAposCompromissos <= 0 {
		summary.Runway = 0 // No runway if not enough to cover commitments
	} else {
		summary.Runway = liquidezAposCompromissos / avgMonthlyExpenses
	}

	// Round DOWN to 1 decimal place (margem de segurança)
	summary.Runway = math.Floor(summary.Runway*10) / 10

	// Ensure never negative
	if summary.Runway < 0 {
		summary.Runway = 0
	}

	// 7.3 SCORE (Financial Health Score 0-1000)
	// Score is composed of 4 weighted pillars:
	// - Liquidez (35%)
	// - Runway (30%)
	// - Comportamento Financeiro (20%)
	// - Organização Financeira (15%)

	// Helper function to clamp values
	clamp := func(value, min, max float64) float64 {
		if value < min {
			return min
		}
		if value > max {
			return max
		}
		return value
	}

	// PILLAR 1: Liquidez Score (35%)
	// Measures: Saldo Disponível (após vencidos) / Average Monthly Expenses
	// Max score when saldo covers 6+ months of expenses
	liquidezIndex := clamp(summary.AvailableForCalculations/avgMonthlyExpenses, 0, 6)
	scoreLiquidez := (liquidezIndex / 6) * 100

	// PILLAR 2: Runway Score (30%)
	// Max score at 6+ months of runway (consistente com Liquidez)
	runwayIndex := clamp(summary.Runway, 0, 6)
	scoreRunway := (runwayIndex / 6) * 100

	// PILLAR 3: Comportamento Financeiro (20%) - ARCHITECT RULES
	// PENALIZAR APENAS: Compromissos VENCIDOS
	// NÃO PENALIZAR: Compromissos a vencer (são planejamento normal)
	scoreComportamento := 100.0

	// Penalty 1: Existe compromisso vencido? -40 pontos
	if summary.OverdueCount > 0 {
		scoreComportamento -= 40
	}

	// Penalty 2: Total vencido > PULSO (saldo total)? -20 pontos
	// IMPORTANTE: Comparar com TotalBalance (PULSO), NÃO com AvailableForCalculations (FÔLEGO)
	if summary.CompromissosVencidos > summary.TotalBalance {
		scoreComportamento -= 20
	}

	// Penalty 3: Gastos > Receitas? -20 pontos
	if summary.ReceitaMensal > 0 && summary.DespesaMensal > summary.ReceitaMensal {
		scoreComportamento -= 20
	}

	// Ensure between 0-100
	scoreComportamento = clamp(scoreComportamento, 0, 100)

	// PILLAR 4: Organização Financeira (15%)
	// Binary points for financial organization
	scoreOrganizacao := 0.0

	// Check if user has categories configured
	if len(summary.TopCategories) > 0 {
		scoreOrganizacao += 25
	}

	// Check if user has accounts configured
	if summary.Liquidez > 0 || summary.Patrimonio > 0 {
		scoreOrganizacao += 25
	}

	// Check if user has invoices tracked
	if len(summary.Invoices) > 0 {
		scoreOrganizacao += 25
	}

	// Check if user has transactions (financial activity)
	if summary.ReceitaMensal > 0 || summary.DespesaMensal > 0 {
		scoreOrganizacao += 25
	}

	// Ensure between 0-100
	scoreOrganizacao = clamp(scoreOrganizacao, 0, 100)

	// FINAL SCORE CALCULATION
	scoreFinal := (scoreLiquidez * 0.35) + (scoreRunway * 0.30) + (scoreComportamento * 0.20) + (scoreOrganizacao * 0.15)

	// Convert to 0-1000 scale
	summary.Score = int(scoreFinal * 10)

	// Ensure within bounds
	if summary.Score > 1000 {
		summary.Score = 1000
	}
	if summary.Score < 0 {
		summary.Score = 0
	}

	// 7.4 HEALTH STATUS (Based on Score)
	// Official FinCore interpretation
	if summary.Score >= 800 {
		summary.HealthStatus = "Coração Forte"
	} else if summary.Score >= 600 {
		summary.HealthStatus = "Ritmo Estável"
	} else if summary.Score >= 400 {
		summary.HealthStatus = "Atenção"
	} else if summary.Score >= 200 {
		summary.HealthStatus = "Arritmia Financeira"
	} else {
		summary.HealthStatus = "Estado Crítico"
	}

	return summary, nil
}
