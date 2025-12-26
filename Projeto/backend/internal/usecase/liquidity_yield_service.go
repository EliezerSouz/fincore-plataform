package usecase

import (
	"context"
	"financeiro-api/internal/entity"
	"financeiro-api/internal/infra/repository"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type LiquidityYieldService struct {
	yieldRepo   *repository.LiquidityYieldRepository
	accountRepo *repository.AccountRepository
}

func NewLiquidityYieldService(
	yieldRepo *repository.LiquidityYieldRepository,
	accountRepo *repository.AccountRepository,
) *LiquidityYieldService {
	return &LiquidityYieldService{
		yieldRepo:   yieldRepo,
		accountRepo: accountRepo,
	}
}

// CalculateDailyYields processes yield calculation for all eligible accounts
// This should run ONCE per day, only on business days
func (s *LiquidityYieldService) CalculateDailyYields(ctx context.Context, targetDate time.Time, cdiRate float64) error {
	// Normalize date to midnight
	targetDate = time.Date(targetDate.Year(), targetDate.Month(), targetDate.Day(), 0, 0, 0, 0, targetDate.Location())

	// Get all accounts with yield enabled (across all users)
	accounts, err := s.accountRepo.FindAllWithYieldEnabled(ctx)
	if err != nil {
		return fmt.Errorf("failed to fetch accounts: %w", err)
	}

	processedCount := 0
	skippedCount := 0
	errorCount := 0

	for _, account := range accounts {
		// ✅ RULE 1: Check eligibility - yield_enabled = true AND yield_source = "CDI"
		if !account.YieldEnabled {
			skippedCount++
			continue
		}

		if account.YieldSource == nil || *account.YieldSource != "CDI" {
			skippedCount++
			continue
		}

		if account.YieldRate <= 0 {
			fmt.Printf("⚠️  Account %s has yield enabled but rate is 0\n", account.ID)
			skippedCount++
			continue
		}

		// Check if yield already exists for this date
		exists, err := s.yieldRepo.CheckYieldExists(ctx, account.ID, targetDate)
		if err != nil {
			fmt.Printf("❌ Error checking yield existence for account %s: %v\n", account.ID, err)
			errorCount++
			continue
		}

		if exists {
			fmt.Printf("⏭️  Yield already calculated for account %s on %s\n", account.ID, targetDate.Format("2006-01-02"))
			skippedCount++
			continue
		}

		// Calculate base amount (operational balance + previous yields)
		baseAmount, err := s.yieldRepo.GetBaseAmount(ctx, account.ID, targetDate)
		if err != nil {
			fmt.Printf("❌ Error calculating base amount for account %s: %v\n", account.ID, err)
			errorCount++
			continue
		}

		// Calculate yield: yield_amount = base_amount × CDI_day × (yield_percentage / 100)
		// CDI is annual, so we divide by 252 (business days) to get daily rate
		dailyCDI := cdiRate / 252.0
		yieldPercentage := account.YieldRate // This should come from account.yield_percentage
		yieldAmount := baseAmount * (dailyCDI / 100.0) * (yieldPercentage / 100.0)

		// Create yield record
		yield := &entity.LiquidityYield{
			ID:          uuid.New().String(),
			AccountID:   account.ID,
			Date:        targetDate,
			BaseAmount:  baseAmount,
			YieldAmount: yieldAmount,
			RateApplied: dailyCDI * (yieldPercentage / 100.0),
			CreatedAt:   time.Now(),
		}

		err = s.yieldRepo.CreateYield(ctx, yield)
		if err != nil {
			fmt.Printf("❌ Error creating yield for account %s: %v\n", account.ID, err)
			errorCount++
			continue
		}

		fmt.Printf("✅ Yield calculated for account %s: Base=%.2f, Yield=%.2f, Rate=%.4f%%\n",
			account.ID, baseAmount, yieldAmount, yield.RateApplied*100)
		processedCount++
	}

	fmt.Printf("\n📊 Yield Calculation Summary for %s:\n", targetDate.Format("2006-01-02"))
	fmt.Printf("   ✅ Processed: %d\n", processedCount)
	fmt.Printf("   ⏭️  Skipped: %d\n", skippedCount)
	fmt.Printf("   ❌ Errors: %d\n", errorCount)

	return nil
}

// GetAccountYieldSummary returns yield information for an account
func (s *LiquidityYieldService) GetAccountYieldSummary(ctx context.Context, accountID, userID string) (map[string]interface{}, error) {
	// Get total accumulated yields
	totalYields, err := s.yieldRepo.GetTotalYields(ctx, accountID)
	if err != nil {
		return nil, fmt.Errorf("failed to get total yields: %w", err)
	}

	// Get account operational balance
	account, err := s.accountRepo.FindByID(ctx, accountID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get account: %w", err)
	}

	// Calculate total balance (operational + yields)
	totalBalance := account.Balance + totalYields

	// Get recent yields (last 30 days)
	endDate := time.Now()
	startDate := endDate.AddDate(0, 0, -30)
	recentYields, err := s.yieldRepo.GetYieldsByAccount(ctx, accountID, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get recent yields: %w", err)
	}

	return map[string]interface{}{
		"operational_balance": account.Balance,
		"total_yields":        totalYields,
		"total_balance":       totalBalance,
		"recent_yields":       recentYields,
		"yield_enabled":       account.YieldRate > 0,
		"yield_rate":          account.YieldRate,
	}, nil
}

// ReprocessYield allows reprocessing a specific date after explicit deletion
func (s *LiquidityYieldService) ReprocessYield(ctx context.Context, accountID, userID string, date time.Time, cdiRate float64) error {
	// First, delete the existing yield (audit trail should be maintained elsewhere)
	err := s.yieldRepo.DeleteYield(ctx, accountID, date)
	if err != nil {
		return fmt.Errorf("failed to delete existing yield: %w", err)
	}

	fmt.Printf("🗑️  Deleted existing yield for account %s on %s\n", accountID, date.Format("2006-01-02"))

	// Now recalculate (similar to CalculateDailyYields but for single account)
	account, err := s.accountRepo.FindByID(ctx, accountID, userID)
	if err != nil {
		return fmt.Errorf("failed to get account: %w", err)
	}

	if !account.YieldEnabled || account.YieldSource == nil || *account.YieldSource != "CDI" {
		return fmt.Errorf("account does not have CDI yield enabled")
	}

	if account.YieldRate <= 0 {
		return fmt.Errorf("account yield rate is not configured")
	}

	baseAmount, err := s.yieldRepo.GetBaseAmount(ctx, accountID, date)
	if err != nil {
		return fmt.Errorf("failed to calculate base amount: %w", err)
	}

	dailyCDI := cdiRate / 252.0
	yieldPercentage := account.YieldRate
	yieldAmount := baseAmount * (dailyCDI / 100.0) * (yieldPercentage / 100.0)

	yield := &entity.LiquidityYield{
		ID:          uuid.New().String(),
		AccountID:   accountID,
		Date:        date,
		BaseAmount:  baseAmount,
		YieldAmount: yieldAmount,
		RateApplied: dailyCDI * (yieldPercentage / 100.0),
		CreatedAt:   time.Now(),
	}

	err = s.yieldRepo.CreateYield(ctx, yield)
	if err != nil {
		return fmt.Errorf("failed to create reprocessed yield: %w", err)
	}

	fmt.Printf("✅ Yield reprocessed for account %s on %s\n", accountID, date.Format("2006-01-02"))
	return nil
}
