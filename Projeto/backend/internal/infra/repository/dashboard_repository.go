package repository

import (
	"context"
	"fmt"
	"math"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/sync/errgroup"
)

type DashboardRepository struct {
	db *pgxpool.Pool
}

func NewDashboardRepository(db *pgxpool.Pool) *DashboardRepository {
	fmt.Println("DEBUG: DashboardRepository initialized - PARALLEL OPTIMIZED")
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
	Compromissos  float64            `json:"compromissos"`
	PayablesTotal float64            `json:"payables_total"`
	InvoicesTotal float64            `json:"invoices_total"`
	ReceitaMensal float64            `json:"receita_mensal"`
	DespesaMensal float64            `json:"despesa_mensal"`
	History       []MonthlyHistory   `json:"history"`
	TopCategories []CategorySpending `json:"top_categories"`
	Invoices      []InvoiceAlert     `json:"invoices"`

	CompromissosVencidos float64 `json:"compromissos_vencidos"`
	CompromissosAVencer  float64 `json:"compromissos_a_vencer"`
	OverdueCount         int     `json:"overdue_count"`

	ReservaEmergencia float64 `json:"reserva_emergencia"`

	TotalBalance             float64 `json:"total_balance"`
	AvailableForCalculations float64 `json:"available_for_calculations"`
	HealthStatus             string  `json:"health_status"`
	Score                    int     `json:"score"`
	Runway                   float64 `json:"runway"`
}

func (r *DashboardRepository) GetSummary(ctx context.Context, userID string) (*FinancialSummary, error) {
	summary := &FinancialSummary{
		History:       []MonthlyHistory{},
		TopCategories: []CategorySpending{},
		Invoices:      []InvoiceAlert{},
	}

	// Datas Setup (Main Thread)
	now := time.Now()
	currentYear, currentMonth, _ := now.Date()
	startOfMonth := time.Date(currentYear, currentMonth, 1, 0, 0, 0, 0, now.Location())
	firstOfNextMonth := startOfMonth.AddDate(0, 1, 0)
	endOfMonth := firstOfNextMonth.Add(-time.Nanosecond)

	startOfMonthStr := startOfMonth.Format("2006-01-02")
	endOfMonthStr := endOfMonth.Format("2006-01-02")
	todayStr := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location()).Format("2006-01-02")

	// Results containers for parallel execution
	var (
		accountsLiquidez, accountsPatrimonio, accountsReserva float64
		flowReceita, flowDespesa                              float64
		payablesOverdue                                       float64
		payablesOverdueCount                                  int
		payablesPending                                       float64
		invoicesOverdue                                       float64
		invoicesOverdueCount                                  int
		invoicesPending                                       float64

		hist      []MonthlyHistory
		topCats   []CategorySpending
		invAlerts []InvoiceAlert

		mu sync.Mutex // Protects slice assignments if needed
	)

	// Error Group for Parallel Execution
	g, ctx := errgroup.WithContext(ctx)

	// 1. Accounts
	g.Go(func() error {
		queryAccounts := `
			SELECT 
				COALESCE(SUM(CASE WHEN pocket_type = 'CAIXA' THEN balance ELSE 0 END), 0) as liquidez,
				COALESCE(SUM(CASE WHEN pocket_type = 'INVESTIMENTO' THEN balance ELSE 0 END), 0) as patrimonio,
				COALESCE(SUM(CASE WHEN pocket_type = 'RESERVA_CDI' THEN balance ELSE 0 END), 0) as reserva_emergencia
			FROM pockets
			WHERE user_id = $1::uuid AND is_active = true
		`
		return r.db.QueryRow(ctx, queryAccounts, userID).Scan(&accountsLiquidez, &accountsPatrimonio, &accountsReserva)
	})

	// 2. Flow (Receita/Despesa Mensal)
	g.Go(func() error {
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
		return r.db.QueryRow(ctx, queryFlow, userID, startOfMonthStr, endOfMonthStr).Scan(&flowReceita, &flowDespesa)
	})

	// 3a. Payables Vencidos
	g.Go(func() error {
		queryPayablesOverdue := `
			SELECT COALESCE(SUM(amount), 0), COUNT(*)
			FROM payables
			WHERE user_id = $1::uuid 
			  AND status NOT IN ('paid', 'cancelled') 
			  AND (paid_at IS NULL)
			  AND due_date < $2
		`
		return r.db.QueryRow(ctx, queryPayablesOverdue, userID, todayStr).Scan(&payablesOverdue, &payablesOverdueCount)
	})

	// 3b. Payables A Vencer
	g.Go(func() error {
		queryPayablesPending := `
			SELECT COALESCE(SUM(amount), 0)
			FROM payables
			WHERE user_id = $1::uuid 
			  AND status NOT IN ('paid', 'cancelled') 
			  AND (paid_at IS NULL)
			  AND due_date >= $2
			  AND due_date <= $3
		`
		return r.db.QueryRow(ctx, queryPayablesPending, userID, todayStr, endOfMonthStr).Scan(&payablesPending)
	})

	// 3c. Invoices Vencidas
	g.Go(func() error {
		queryInvoicesOverdue := `
			SELECT COALESCE(SUM(total_amount - paid_amount), 0), COUNT(*)
			FROM credit_card_invoices
			WHERE user_id = $1::uuid 
			  AND status NOT IN ('paid')
			  AND (total_amount - paid_amount) > 0.01
			  AND due_date < $2
		`
		return r.db.QueryRow(ctx, queryInvoicesOverdue, userID, todayStr).Scan(&invoicesOverdue, &invoicesOverdueCount)
	})

	// 3d. Invoices A Vencer
	g.Go(func() error {
		queryInvoicesPending := `
			SELECT COALESCE(SUM(total_amount - paid_amount), 0)
			FROM credit_card_invoices
			WHERE user_id = $1::uuid 
			  AND status NOT IN ('paid')
			  AND (total_amount - paid_amount) > 0.01
			  AND due_date >= $2
			  AND due_date <= $3
		`
		return r.db.QueryRow(ctx, queryInvoicesPending, userID, todayStr, endOfMonthStr).Scan(&invoicesPending)
	})

	// 4. History
	g.Go(func() error {
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
			  AND t.deleted_at IS NULL
			  AND t.type != 'transferencia'
			  AND t.related_transaction_id IS NULL
			  AND (c.name IS NULL OR c.name NOT ILIKE 'Transferência%')
			GROUP BY 1, 2
			ORDER BY 2 ASC, 1 ASC
		`
		rows, err := r.db.Query(ctx, queryHistory, userID, startOfHistoryStr, endOfMonthStr)
		if err != nil {
			return fmt.Errorf("failed to fetch history: %w", err)
		}
		defer rows.Close()

		monthMap := map[int]string{
			1: "Jan", 2: "Fev", 3: "Mar", 4: "Abr", 5: "Mai", 6: "Jun",
			7: "Jul", 8: "Ago", 9: "Set", 10: "Out", 11: "Nov", 12: "Dez",
		}

		localHist := []MonthlyHistory{}
		for rows.Next() {
			var m, y int
			var rec, desp float64
			if err := rows.Scan(&m, &y, &rec, &desp); err != nil {
				return fmt.Errorf("failed to scan history row: %w", err)
			}
			localHist = append(localHist, MonthlyHistory{
				Month:   monthMap[m],
				Receita: rec,
				Despesa: desp,
				Saldo:   rec - desp,
			})
		}

		mu.Lock()
		hist = localHist
		mu.Unlock()
		return nil
	})

	// 5. Categories
	g.Go(func() error {
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
			return fmt.Errorf("failed to fetch categories: %w", err)
		}
		defer rowsCat.Close()

		localCats := []CategorySpending{}
		despesaTotalLocal := 0.0 // Temporarily unused, rely on flowDespesa after wait? No, need it here for percent.

		// Wait. We need DespesaMensal (flowDespesa) to calculate percentage.
		// But flowDespesa is calculated in parallel.
		// So we can capture raw values here, and calculate percent AFTER g.Wait().
		// Excellent observation.

		for rowsCat.Next() {
			var catName string
			var catValue float64
			var catColor string
			var catIcon string
			if err := rowsCat.Scan(&catName, &catValue, &catColor, &catIcon); err != nil {
				return fmt.Errorf("failed to scan category row: %w", err)
			}
			localCats = append(localCats, CategorySpending{
				Name:    catName,
				Value:   catValue,
				Percent: 0, // Will calc later
				Color:   catColor,
				Icon:    catIcon,
			})
			despesaTotalLocal += catValue
		}

		mu.Lock()
		topCats = localCats
		mu.Unlock()
		return nil
	})

	// 6. Invoice Alerts
	g.Go(func() error {
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
			return fmt.Errorf("failed to fetch invoices: %w", err)
		}
		defer rowsInv.Close()

		localInv := []InvoiceAlert{}
		for rowsInv.Next() {
			var invID string
			var cardID, cardName, cardLast4 string
			var amount float64
			var dueDate time.Time
			if err := rowsInv.Scan(&invID, &cardID, &cardName, &cardLast4, &amount, &dueDate); err != nil {
				return fmt.Errorf("failed to scan invoice row: %w", err)
			}

			// Calculate days remaining
			nowLocal := time.Now()
			todayLocal := time.Date(nowLocal.Year(), nowLocal.Month(), nowLocal.Day(), 0, 0, 0, 0, nowLocal.Location())
			due := time.Date(dueDate.Year(), dueDate.Month(), dueDate.Day(), 0, 0, 0, 0, dueDate.Location())
			days := int(due.Sub(todayLocal).Hours() / 24)

			status := "open"
			if days < 0 {
				status = "overdue"
			} else if days == 0 {
				status = "due_today"
			} else if days <= 7 {
				status = "due_soon"
			}

			localInv = append(localInv, InvoiceAlert{
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

		mu.Lock()
		invAlerts = localInv
		mu.Unlock()
		return nil
	})

	// Wait for all queries
	if err := g.Wait(); err != nil {
		fmt.Printf("ERROR in GetSummary (Parallel): %v\n", err)
		return nil, err
	}

	// ---------------------------
	// Consolidate & Calculate
	// ---------------------------

	summary.Liquidez = accountsLiquidez
	summary.Patrimonio = accountsPatrimonio
	summary.ReservaEmergencia = accountsReserva

	summary.ReceitaMensal = flowReceita
	summary.DespesaMensal = flowDespesa

	summary.CompromissosVencidos = payablesOverdue + invoicesOverdue
	summary.CompromissosAVencer = payablesPending + invoicesPending
	summary.Compromissos = summary.CompromissosVencidos + summary.CompromissosAVencer
	summary.OverdueCount = payablesOverdueCount + invoicesOverdueCount
	summary.PayablesTotal = payablesOverdue + payablesPending
	summary.InvoicesTotal = invoicesOverdue + invoicesPending

	summary.History = hist
	summary.Invoices = invAlerts

	// Calc Top Categories Percent (Now that we have DespesaMensal)
	if summary.DespesaMensal > 0 {
		finalCats := []CategorySpending{}
		for _, cat := range topCats {
			cat.Percent = (cat.Value / summary.DespesaMensal) * 100
			finalCats = append(finalCats, cat)
		}
		summary.TopCategories = finalCats
	} else {
		summary.TopCategories = topCats
	}

	// 7. Calculate FinCore Metrics (Logic kept consistent)
	summary.TotalBalance = summary.Liquidez
	summary.AvailableForCalculations = summary.Liquidez - summary.CompromissosVencidos

	// Runway
	avgMonthlyExpenses := 0.0
	if len(summary.History) > 0 {
		totalExpenses := 0.0
		monthsWithExpenses := 0
		for _, month := range summary.History {
			if month.Despesa > 0 {
				totalExpenses += month.Despesa
				monthsWithExpenses++
			}
		}
		if monthsWithExpenses > 0 {
			avgMonthlyExpenses = totalExpenses / float64(monthsWithExpenses)
		} else {
			avgMonthlyExpenses = summary.DespesaMensal
		}
	} else {
		avgMonthlyExpenses = summary.DespesaMensal
	}

	if avgMonthlyExpenses <= 0 {
		avgMonthlyExpenses = 1
	}

	liquidezAposCompromissos := summary.AvailableForCalculations + summary.ReservaEmergencia - summary.CompromissosAVencer
	if liquidezAposCompromissos <= 0 {
		summary.Runway = 0
	} else {
		summary.Runway = liquidezAposCompromissos / avgMonthlyExpenses
	}
	summary.Runway = math.Floor(summary.Runway*10) / 10
	if summary.Runway < 0 {
		summary.Runway = 0
	}

	// Score
	clamp := func(value, min, max float64) float64 {
		if value < min {
			return min
		}
		if value > max {
			return max
		}
		return value
	}

	liquidezIndex := clamp(summary.AvailableForCalculations/avgMonthlyExpenses, 0, 6)
	scoreLiquidez := (liquidezIndex / 6) * 100

	runwayIndex := clamp(summary.Runway, 0, 6)
	scoreRunway := (runwayIndex / 6) * 100

	scoreComportamento := 100.0
	if summary.OverdueCount > 0 {
		scoreComportamento -= 40
	}
	if summary.CompromissosVencidos > summary.TotalBalance {
		scoreComportamento -= 20
	}
	if summary.ReceitaMensal > 0 && summary.DespesaMensal > summary.ReceitaMensal {
		scoreComportamento -= 20
	}
	scoreComportamento = clamp(scoreComportamento, 0, 100)

	scoreOrganizacao := 0.0
	if len(summary.TopCategories) > 0 {
		scoreOrganizacao += 25
	}
	if summary.Liquidez > 0 || summary.Patrimonio > 0 {
		scoreOrganizacao += 25
	}
	if len(summary.Invoices) > 0 {
		scoreOrganizacao += 25
	}
	if summary.ReceitaMensal > 0 || summary.DespesaMensal > 0 {
		scoreOrganizacao += 25
	}
	scoreOrganizacao = clamp(scoreOrganizacao, 0, 100)

	scoreFinal := (scoreLiquidez * 0.35) + (scoreRunway * 0.30) + (scoreComportamento * 0.20) + (scoreOrganizacao * 0.15)
	summary.Score = int(scoreFinal * 10)
	if summary.Score > 1000 {
		summary.Score = 1000
	}
	if summary.Score < 0 {
		summary.Score = 0
	}

	// Health Status
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
