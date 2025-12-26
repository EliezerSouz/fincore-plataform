package scheduler

import (
	"context"
	"financeiro-api/internal/infra/repository"
	"financeiro-api/internal/usecase"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type YieldScheduler struct {
	service    *usecase.LiquidityYieldService
	cdiService *usecase.CDIService
	running    bool
	stopChan   chan bool
}

func NewYieldScheduler(db *pgxpool.Pool) *YieldScheduler {
	yieldRepo := repository.NewLiquidityYieldRepository(db)
	accountRepo := repository.NewAccountRepository(db)
	yieldService := usecase.NewLiquidityYieldService(yieldRepo, accountRepo)
	cdiService := usecase.NewCDIService()

	return &YieldScheduler{
		service:    yieldService,
		cdiService: cdiService,
		running:    false,
		stopChan:   make(chan bool),
	}
}

// Start begins the daily yield calculation scheduler
func (s *YieldScheduler) Start() {
	if s.running {
		fmt.Println("⚠️  Yield scheduler is already running")
		return
	}

	s.running = true
	fmt.Println("🚀 Yield scheduler started")

	go s.run()
}

// Stop gracefully stops the scheduler
func (s *YieldScheduler) Stop() {
	if !s.running {
		return
	}

	fmt.Println("🛑 Stopping yield scheduler...")
	s.stopChan <- true
	s.running = false
	fmt.Println("✅ Yield scheduler stopped")
}

// run is the main scheduler loop
func (s *YieldScheduler) run() {
	// Calculate next execution time (10:00 AM every business day)
	nextRun := s.getNextExecutionTime()
	fmt.Printf("📅 Next yield calculation scheduled for: %s\n", nextRun.Format("2006-01-02 15:04:05"))

	ticker := time.NewTicker(1 * time.Minute) // Check every minute
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			now := time.Now()
			if now.After(nextRun) {
				s.executeYieldCalculation()
				nextRun = s.getNextExecutionTime()
				fmt.Printf("📅 Next yield calculation scheduled for: %s\n", nextRun.Format("2006-01-02 15:04:05"))
			}
		case <-s.stopChan:
			return
		}
	}
}

// executeYieldCalculation performs the daily yield calculation
func (s *YieldScheduler) executeYieldCalculation() {
	ctx := context.Background()
	today := time.Now()

	// Check if today is a business day
	if !s.isBusinessDay(today) {
		fmt.Printf("⏭️  Skipping yield calculation - %s is not a business day\n", today.Format("2006-01-02"))
		return
	}

	fmt.Printf("\n🔄 Starting daily yield calculation for %s\n", today.Format("2006-01-02"))

	// Fetch current CDI rate
	cdiRate, err := s.cdiService.GetCurrentCDIRate(ctx)
	if err != nil {
		fmt.Printf("❌ Failed to fetch CDI rate: %v\n", err)
		fmt.Println("⚠️  Using fallback CDI rate: 13.65%")
		cdiRate = 13.65 // Fallback rate
	} else {
		fmt.Printf("📊 Current CDI rate: %.2f%%\n", cdiRate)
	}

	// Execute calculation
	err = s.service.CalculateDailyYields(ctx, today, cdiRate)
	if err != nil {
		fmt.Printf("❌ Daily yield calculation failed: %v\n", err)
		return
	}

	fmt.Printf("✅ Daily yield calculation completed successfully\n\n")
}

// getNextExecutionTime calculates the next business day at 10:00 AM
func (s *YieldScheduler) getNextExecutionTime() time.Time {
	now := time.Now()

	// Start with tomorrow at 10:00 AM
	next := time.Date(now.Year(), now.Month(), now.Day()+1, 10, 0, 0, 0, now.Location())

	// If it's before 10:00 AM today and today is a business day, use today
	if now.Hour() < 10 && s.isBusinessDay(now) {
		next = time.Date(now.Year(), now.Month(), now.Day(), 10, 0, 0, 0, now.Location())
	}

	// Skip to next business day if needed
	for !s.isBusinessDay(next) {
		next = next.AddDate(0, 0, 1)
	}

	return next
}

// isBusinessDay checks if a given date is a business day (Mon-Fri, not a holiday)
func (s *YieldScheduler) isBusinessDay(date time.Time) bool {
	// Check if weekend
	weekday := date.Weekday()
	if weekday == time.Saturday || weekday == time.Sunday {
		return false
	}

	// TODO: Check against Brazilian holidays calendar
	// For now, we only check weekends

	return true
}

// IsRunning returns whether the scheduler is currently running
func (s *YieldScheduler) IsRunning() bool {
	return s.running
}
