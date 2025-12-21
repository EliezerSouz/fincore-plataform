package entity

import "time"

type CreditCard struct {
	ID          string    `json:"id" db:"id"`
	UserID      string    `json:"user_id" db:"user_id"`
	AccountID   *string   `json:"account_id,omitempty" db:"account_id"`
	Name        string    `json:"name" db:"name"`
	Brand       string    `json:"brand" db:"brand"`
	Last4Digits string    `json:"last_4_digits" db:"last_4_digits"`
	LimitAmount float64   `json:"limit_amount" db:"limit_amount"`
	ClosingDay  int       `json:"closing_day" db:"closing_day"`
	DueDay      int       `json:"due_day" db:"due_day"`
	Color       string    `json:"color" db:"color"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`

	// Calculated fields
	AvailableLimit    *float64   `json:"available_limit,omitempty"`
	NextInvoiceAmount *float64   `json:"next_invoice_amount,omitempty"`
	NextInvoiceDate   *time.Time `json:"next_invoice_date,omitempty"`
}

type CreateCardInput struct {
	Name        string  `json:"name" binding:"required"`
	AccountID   *string `json:"account_id"`
	Brand       string  `json:"brand" binding:"required"`
	Last4Digits string  `json:"last_4_digits"`
	LimitAmount float64 `json:"limit_amount" binding:"required"`
	ClosingDay  int     `json:"closing_day" binding:"required"`
	DueDay      int     `json:"due_day" binding:"required"`
	Color       string  `json:"color" binding:"required"`
}

type UpdateCardInput struct {
	Name        *string  `json:"name"`
	AccountID   *string  `json:"account_id"`
	Brand       *string  `json:"brand"`
	Last4Digits *string  `json:"last_4_digits"`
	LimitAmount *float64 `json:"limit_amount"`
	ClosingDay  *int     `json:"closing_day"`
	DueDay      *int     `json:"due_day"`
	Color       *string  `json:"color"`
}
