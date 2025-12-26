package entity

import "time"

// LiquidityYield represents a daily yield calculation for a liquidity account
// This is NOT a financial transaction - it's a patrimonial record
type LiquidityYield struct {
	ID          string    `json:"id"`
	AccountID   string    `json:"account_id"`
	Date        time.Time `json:"date"`
	BaseAmount  float64   `json:"base_amount"`  // Operational balance + previous yields
	YieldAmount float64   `json:"yield_amount"` // Calculated yield for this day
	RateApplied float64   `json:"rate_applied"` // CDI rate used (percentage)
	CreatedAt   time.Time `json:"created_at"`
}

// YieldConfig represents the yield configuration for an account
type YieldConfig struct {
	Enabled bool    `json:"enabled"`
	Source  string  `json:"source"` // "CDI", "SELIC", etc.
	Rate    float64 `json:"rate"`   // Custom rate percentage (0-100)
}
