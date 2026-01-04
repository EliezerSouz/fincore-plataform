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
	pocketRepo  *repository.PocketRepository
}

func NewLiquidityYieldService(
	yieldRepo *repository.LiquidityYieldRepository,
	accountRepo *repository.AccountRepository,
	pocketRepo *repository.PocketRepository,
) *LiquidityYieldService {
	return &LiquidityYieldService{
		yieldRepo:   yieldRepo,
		accountRepo: accountRepo,
		pocketRepo:  pocketRepo,
	}
}

// CalculateDailyYields processes yield calculation for all eligible pockets
// This should run ONCE per day, only on business days
func (s *LiquidityYieldService) CalculateDailyYields(ctx context.Context, targetDate time.Time, cdiRate float64) error {
	// Normalize date to midnight
	targetDate = time.Date(targetDate.Year(), targetDate.Month(), targetDate.Day(), 0, 0, 0, 0, targetDate.Location())

	// Get all pockets with yield enabled (across all users)
	pockets, err := s.pocketRepo.FindAllWithYieldEnabled(ctx)
	if err != nil {
		return fmt.Errorf("failed to fetch pockets: %w", err)
	}

	processedCount := 0
	skippedCount := 0
	errorCount := 0

	for _, pocket := range pockets {
		// ✅ RULE 1: Check eligibility - yield_enabled = true AND yield_source = "CDI"
		if !pocket.YieldEnabled {
			skippedCount++
			continue
		}

		if pocket.YieldSource == nil || *pocket.YieldSource != "CDI" {
			skippedCount++
			continue
		}

		if pocket.YieldCdiRate <= 0 {
			fmt.Printf("⚠️  Pocket %s has yield enabled but CDI rate is 0\n", pocket.ID)
			skippedCount++
			continue
		}

		// Check if yield already exists for this date
		exists, err := s.yieldRepo.CheckYieldExistsForPocket(ctx, pocket.ID, targetDate)
		if err != nil {
			fmt.Printf("❌ Error checking yield existence for pocket %s: %v\n", pocket.ID, err)
			errorCount++
			continue
		}

		if exists {
			fmt.Printf("⏭️  Yield already calculated for pocket %s on %s\n", pocket.ID, targetDate.Format("2006-01-02"))
			skippedCount++
			continue
		}

		// Calculate base amount (operational balance + previous yields)
		baseAmount, err := s.yieldRepo.GetBaseAmountForPocket(ctx, pocket.ID, targetDate)
		if err != nil {
			fmt.Printf("❌ Error calculating base amount for pocket %s: %v\n", pocket.ID, err)
			errorCount++
			continue
		}

		// Calculate yield: yield_amount = base_amount × CDI_daily × (yield_cdi_rate / 100)
		// NOTE: CDI rate from Banco Central API is ALREADY daily, no need to divide by 252
		dailyCDI := cdiRate                    // Already daily from API
		yieldPercentage := pocket.YieldCdiRate // Percentage of CDI (e.g., 100, 105, 120)
		yieldAmount := baseAmount * (dailyCDI / 100.0) * (yieldPercentage / 100.0)

		// Create yield record
		yield := &entity.LiquidityYield{
			ID:          uuid.New().String(),
			PocketID:    &pocket.ID, // Use PocketID instead of AccountID
			Date:        targetDate,
			BaseAmount:  baseAmount,
			YieldAmount: yieldAmount,
			RateApplied: dailyCDI * (yieldPercentage / 100.0),
			CreatedAt:   time.Now(),
		}

		err = s.yieldRepo.CreateYield(ctx, yield)
		if err != nil {
			fmt.Printf("❌ Error creating yield for pocket %s: %v\n", pocket.ID, err)
			errorCount++
			continue
		}

		// Update pocket balance with yield
		if err := s.pocketRepo.IncrementBalance(ctx, pocket.ID, yieldAmount); err != nil {
			fmt.Printf("❌ Error updating balance for pocket %s: %v\n", pocket.ID, err)
			// Don't count as full error since yield was created, but log it
		}

		fmt.Printf("✅ Yield calculated for pocket %s (%s): Base=%.2f, Yield=%.2f, Rate=%.4f%%\n",
			pocket.ID, pocket.Name, baseAmount, yieldAmount, yield.RateApplied*100)
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
		"yield_enabled":       account.YieldEnabled,
		"yield_rate":          account.YieldCdiRate,
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

	if account.YieldCdiRate <= 0 {
		return fmt.Errorf("account CDI rate is not configured")
	}

	baseAmount, err := s.yieldRepo.GetBaseAmount(ctx, accountID, date)
	if err != nil {
		return fmt.Errorf("failed to calculate base amount: %w", err)
	}

	// NOTE: CDI rate is ALREADY daily from API
	dailyCDI := cdiRate
	yieldPercentage := account.YieldCdiRate
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
