package entity

import "time"

type BalanceAdjustmentType string

const (
	BalanceAdjustmentInitial        BalanceAdjustmentType = "initial"
	BalanceAdjustmentReconciliation BalanceAdjustmentType = "reconciliation"
	BalanceAdjustmentCorrection     BalanceAdjustmentType = "correction"
)

type BalanceAdjustment struct {
	ID                     string                `json:"id" db:"id"`
	UserID                 string                `json:"user_id" db:"user_id"`
	AccountID              *string               `json:"account_id" db:"account_id"` // Changed to pointer/optional
	PocketID               *string               `json:"pocket_id" db:"pocket_id"`
	AdjustmentDate         time.Time             `json:"adjustment_date" db:"adjustment_date"`
	Balance                float64               `json:"balance" db:"balance"`
	Type                   BalanceAdjustmentType `json:"type" db:"type"`
	Notes                  *string               `json:"notes" db:"notes"`
	StartsControlledPeriod bool                  `json:"starts_controlled_period" db:"starts_controlled_period"`
	CreatedAt              time.Time             `json:"created_at" db:"created_at"`
	UpdatedAt              time.Time             `json:"updated_at" db:"updated_at"`
}

type CreateBalanceAdjustmentInput struct {
	AccountID              *string               `json:"account_id"`
	PocketID               *string               `json:"pocket_id"`
	AdjustmentDate         time.Time             `json:"adjustment_date" binding:"required"`
	Balance                float64               `json:"balance"`
	Type                   BalanceAdjustmentType `json:"type" binding:"required"`
	Notes                  *string               `json:"notes"`
	StartsControlledPeriod bool                  `json:"starts_controlled_period"`
}

type UpdateBalanceAdjustmentInput struct {
	AdjustmentDate         *time.Time             `json:"adjustment_date"`
	Balance                *float64               `json:"balance"`
	Type                   *BalanceAdjustmentType `json:"type"`
	Notes                  *string                `json:"notes"`
	StartsControlledPeriod *bool                  `json:"starts_controlled_period"`
}
