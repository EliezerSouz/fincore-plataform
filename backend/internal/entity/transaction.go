package entity

import "time"

type Transaction struct {
	ID                   string         `json:"id" db:"id"`
	UserID               string         `json:"user_id" db:"user_id"`
	AccountID            string         `json:"account_id" db:"account_id"`
	CategoryID           *string        `json:"category_id" db:"category_id"`
	SubcategoryID        *string        `json:"subcategory_id" db:"subcategory_id"`
	PaymentMethodID      *string        `json:"payment_method_id" db:"payment_method_id"`
	InvoiceID            *string        `json:"invoice_id" db:"credit_card_invoice_id"`
	PayableID            *string        `json:"payable_id" db:"payable_id"`
	RelatedTransactionID *string        `json:"related_transaction_id" db:"related_transaction_id"`
	Description          string         `json:"description" db:"description"`
	Amount               float64        `json:"amount" db:"amount"`
	Type                 string         `json:"type" db:"type"` // 'receita' ou 'despesa'
	Date                 time.Time      `json:"date" db:"date"`
	IsHistorical         bool           `json:"is_historical" db:"is_historical"`
	CreatedAt            time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt            time.Time      `json:"updated_at" db:"updated_at"`
	Category             *Category      `json:"category,omitempty" db:"-"`
	Subcategory          *Subcategory   `json:"subcategory,omitempty" db:"-"`
	Account              *Account       `json:"account,omitempty" db:"-"`
	PaymentMethod        *PaymentMethod `json:"payment_method,omitempty" db:"-"`
}

type CreateTransactionInput struct {
	AccountID       string    `json:"account_id" binding:"required"`
	CategoryID      *string   `json:"category_id"`
	SubcategoryID   *string   `json:"subcategory_id"`
	PaymentMethodID *string   `json:"payment_method_id"`
	Description     string    `json:"description" binding:"required"`
	Amount          float64   `json:"amount" binding:"required,gt=0"`
	Type            string    `json:"type" binding:"required,oneof=receita despesa"`
	Date            time.Time `json:"date" binding:"required"`
	PayableID       *string   `json:"payable_id"`
	InvoiceID       *string   `json:"invoice_id"`
}

type UpdateTransactionInput struct {
	AccountID       *string    `json:"account_id"`
	CategoryID      *string    `json:"category_id"`
	SubcategoryID   *string    `json:"subcategory_id"`
	PaymentMethodID *string    `json:"payment_method_id"`
	Description     *string    `json:"description"`
	Amount          *float64   `json:"amount"`
	Type            *string    `json:"type"`
	Date            *time.Time `json:"date"`
}
