package entity

import (
	"time"
)

type PayableStatus string
type RecurrenceStrategy string

const (
	PayableStatusPending   PayableStatus = "pending"
	PayableStatusPaid      PayableStatus = "paid"
	PayableStatusCancelled PayableStatus = "cancelled"

	RecurrenceSingle      RecurrenceStrategy = "single"
	RecurrenceInstallment RecurrenceStrategy = "installment"
	RecurrenceFixed       RecurrenceStrategy = "fixed"
)

type Payable struct {
	ID                 string             `json:"id" db:"id"`
	UserID             string             `json:"user_id" db:"user_id"`
	Description        string             `json:"description" db:"description"`
	Amount             float64            `json:"amount" db:"amount"`
	DueDate            time.Time          `json:"due_date" db:"due_date"`
	Status             PayableStatus      `json:"status" db:"status"`
	RecurrenceStrategy RecurrenceStrategy `json:"recurrence_strategy" db:"recurrence_strategy"`
	RecurrenceID       *string            `json:"recurrence_id" db:"recurrence_id"`
	InstallmentNumber  *int               `json:"installment_number" db:"installment_number"`
	TotalInstallments  *int               `json:"total_installments" db:"total_installments"`
	CategoryID         *string            `json:"category_id" db:"category_id"`
	SubcategoryID      *string            `json:"subcategory_id" db:"subcategory_id"`
	PaymentMethodID    *string            `json:"payment_method_id" db:"payment_method_id"`
	PaidAt             *time.Time         `json:"paid_at" db:"paid_at"`
	TransactionID      *string            `json:"transaction_id" db:"transaction_id"`
	CreatedAt          time.Time          `json:"created_at" db:"created_at"`
	UpdatedAt          time.Time          `json:"updated_at" db:"updated_at"`

	// Relations (Loaded separately or joined)
	Category    *Category    `json:"category,omitempty" db:"-"`
	Subcategory *Subcategory `json:"subcategory,omitempty" db:"-"`
}

type CreatePayableInput struct {
	Description        string             `json:"description" binding:"required"`
	Amount             float64            `json:"amount" binding:"required,gt=0"`
	DueDate            time.Time          `json:"due_date" binding:"required"`
	RecurrenceStrategy RecurrenceStrategy `json:"recurrence_strategy" binding:"required,oneof=single installment fixed"`
	Installments       int                `json:"installments"` // If > 1, generates multiple
	CategoryID         *string            `json:"category_id"`
	SubcategoryID      *string            `json:"subcategory_id"`
	PaymentMethodID    *string            `json:"payment_method_id"`
}

type UpdatePayableInput struct {
	Description     string    `json:"description"`
	Amount          float64   `json:"amount"`
	DueDate         time.Time `json:"due_date"`
	CategoryID      *string   `json:"category_id"`
	SubcategoryID   *string   `json:"subcategory_id"`
	PaymentMethodID *string   `json:"payment_method_id"`
}

type PayPayableInput struct {
	AccountID       string    `json:"account_id" binding:"required"`
	Date            time.Time `json:"date" binding:"required"`
	Amount          *float64  `json:"amount"` // Optional override
	PaymentMethodID *string   `json:"payment_method_id"`
}
