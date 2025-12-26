package entity

import "time"

type Account struct {
	ID            string     `json:"id" db:"id"`
	UserID        string     `json:"user_id" db:"user_id"`
	Name          string     `json:"name" db:"name"`
	Type          string     `json:"type" db:"type"`
	Balance       float64    `json:"balance" db:"balance"`
	Color         *string    `json:"color" db:"color"`
	IsActive      bool       `json:"is_active" db:"is_active"`
	YieldRate     float64    `json:"yield_rate" db:"yield_rate"`
	YieldEnabled  bool       `json:"yield_enabled" db:"yield_enabled"`
	YieldSource   *string    `json:"yield_source" db:"yield_source"`
	LastYieldDate *time.Time `json:"last_yield_date" db:"last_yield_date"`
	CreatedAt     time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at" db:"updated_at"`
	// Virtual fields for yield display
	YieldToday float64 `json:"yield_today" db:"yield_today"`
	YieldMonth float64 `json:"yield_month" db:"yield_month"`
}

type CreateAccountInput struct {
	Name         string  `json:"name" binding:"required"`
	Type         string  `json:"type" binding:"required"`
	Balance      float64 `json:"balance"`
	Color        *string `json:"color"`
	YieldRate    float64 `json:"yield_rate"`
	YieldEnabled bool    `json:"yield_enabled"`
	YieldSource  *string `json:"yield_source"`
	YieldCdiRate float64 `json:"yield_cdi_rate"`
}

type UpdateAccountInput struct {
	Name         *string  `json:"name"`
	Type         *string  `json:"type"`
	Balance      *float64 `json:"balance"`
	Color        *string  `json:"color"`
	IsActive     *bool    `json:"is_active"`
	YieldRate    *float64 `json:"yield_rate"`
	YieldEnabled *bool    `json:"yield_enabled"`
	YieldSource  *string  `json:"yield_source"`
	YieldCdiRate *float64 `json:"yield_cdi_rate"`
}
