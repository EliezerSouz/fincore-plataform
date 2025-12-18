package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type DashboardRepository struct {
	db *pgxpool.Pool
}

func NewDashboardRepository(db *pgxpool.Pool) *DashboardRepository {
	return &DashboardRepository{db: db}
}

type FinancialSummary struct {
	Liquidez     float64 `json:"liquidez"`
	Patrimonio   float64 `json:"patrimonio"`
	Compromissos float64 `json:"compromissos"`
}

func (r *DashboardRepository) GetSummary(ctx context.Context, userID string) (*FinancialSummary, error) {
	summary := &FinancialSummary{}

	// 1. Calculate Liquidity and Patrimony (Accounts)
	queryAccounts := `
		SELECT 
			COALESCE(SUM(CASE WHEN type != 'investimento' THEN balance ELSE 0 END), 0) as liquidez,
			COALESCE(SUM(CASE WHEN type = 'investimento' THEN balance ELSE 0 END), 0) as patrimonio
		FROM accounts
		WHERE user_id = $1::uuid AND is_active = true
	`
	err := r.db.QueryRow(ctx, queryAccounts, userID).Scan(&summary.Liquidez, &summary.Patrimonio)
	if err != nil {
		return nil, fmt.Errorf("failed to calculate account summary: %w", err)
	}

	// 2. Calculate Commitments (Payables + Invoices)
	// Needs End of Month logic
	now := time.Now()
	// Go specific way to get end of month
	currentYear, currentMonth, _ := now.Date()
	firstOfNextMonth := time.Date(currentYear, currentMonth+1, 1, 0, 0, 0, 0, now.Location())
	endOfMonth := firstOfNextMonth.Add(-time.Nanosecond) // Last moment of current month
	// Use explicit date "YYYY-MM-DD" for comparison if database columns are DATE
	eomStr := endOfMonth.Format("2006-01-02")

	// 2a. Payables
	queryPayables := `
		SELECT COALESCE(SUM(amount), 0)
		FROM payables
		WHERE user_id = $1::uuid AND status = 'pending' AND due_date <= $2
	`
	var payablesTotal float64
	err = r.db.QueryRow(ctx, queryPayables, userID, eomStr).Scan(&payablesTotal)
	if err != nil {
		// Log error but maybe continue? Or return error.
		// If payables table doesn't exist yet, this will fail.
		// Assuming tables exist as per frontend usage.
		return nil, fmt.Errorf("failed to calculate payables: %w", err)
	}

	// 2b. Invoices
	queryInvoices := `
		SELECT COALESCE(SUM(total_amount - paid_amount), 0)
		FROM credit_card_invoices
		WHERE user_id = $1::uuid AND status != 'paid' AND due_date <= $2
	`
	var invoicesTotal float64
	err = r.db.QueryRow(ctx, queryInvoices, userID, eomStr).Scan(&invoicesTotal)
	if err != nil {
		return nil, fmt.Errorf("failed to calculate invoices: %w", err)
	}

	summary.Compromissos = payablesTotal + invoicesTotal

	return summary, nil
}
