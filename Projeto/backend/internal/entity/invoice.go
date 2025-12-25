package entity

import (
	"time"
)

type InvoiceStatus string

const (
	InvoiceStatusOpen    InvoiceStatus = "open"
	InvoiceStatusClosed  InvoiceStatus = "closed"
	InvoiceStatusPaid    InvoiceStatus = "paid"
	InvoiceStatusOverdue InvoiceStatus = "overdue"
	InvoiceStatusPartial InvoiceStatus = "partial"
)

type CreditCardInvoice struct {
	ID             string        `json:"id" db:"id"`
	CreditCardID   string        `json:"credit_card_id" db:"credit_card_id"`
	ReferenceMonth int           `json:"reference_month" db:"reference_month"`
	ReferenceYear  int           `json:"reference_year" db:"reference_year"`
	ClosingDate    time.Time     `json:"closing_date" db:"closing_date"`
	DueDate        time.Time     `json:"due_date" db:"due_date"`
	TotalAmount    float64       `json:"total_amount" db:"total_amount"`
	PaidAmount     float64       `json:"paid_amount" db:"paid_amount"`
	Status         InvoiceStatus `json:"status" db:"status"`
	CreatedAt      time.Time     `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time     `json:"updated_at" db:"updated_at"`
	CreditCard     *CreditCard   `json:"credit_card,omitempty" db:"-"`
}

type CreditCardTransaction struct {
	ID                string             `json:"id" db:"id"`
	UserID            string             `json:"user_id" db:"user_id"`
	CreditCardID      string             `json:"credit_card_id" db:"credit_card_id"`
	InvoiceID         string             `json:"invoice_id" db:"invoice_id"`
	Description       string             `json:"description" db:"description"`
	Amount            float64            `json:"amount" db:"amount"`
	TransactionDate   time.Time          `json:"transaction_date" db:"transaction_date"`
	CategoryID        *string            `json:"category_id" db:"category_id"`
	SubcategoryID     *string            `json:"subcategory_id" db:"subcategory_id"`
	Notes             *string            `json:"notes" db:"notes"`
	GroupID           *string            `json:"group_id" db:"group_id"`
	TransactionType   string             `json:"transaction_type" db:"transaction_type"` // purchase, refund, adjustment, fee
	IsInstallment     bool               `json:"is_installment" db:"is_installment"`
	InstallmentNumber *int               `json:"installment_number" db:"installment_number"`
	TotalInstallments *int               `json:"total_installments" db:"total_installments"`
	CreatedAt         time.Time          `json:"created_at" db:"created_at"`
	UpdatedAt         time.Time          `json:"updated_at" db:"updated_at"`
	Invoice           *CreditCardInvoice `json:"invoice,omitempty" db:"-"`
}

type CreateCreditCardTransactionInput struct {
	CreditCardID     string    `json:"credit_card_id" binding:"required"`
	Description      string    `json:"description" binding:"required"`
	Amount           float64   `json:"amount" binding:"required,gt=0"`
	TransactionDate  time.Time `json:"transaction_date" binding:"required"`
	CategoryID       *string   `json:"category_id"`
	SubcategoryID    *string   `json:"subcategory_id"`
	Notes            *string   `json:"notes"`
	Installments     int       `json:"installments"`      // If > 1, create multiple
	StartInstallment int       `json:"start_installment"` // For retroactive
	InstallmentValue *float64  `json:"installment_value"` // For retroactive
}

type UpdateCreditCardTransactionInput struct {
	ID              string    `json:"id" binding:"required"`
	Description     string    `json:"description" binding:"required"`
	Amount          float64   `json:"amount" binding:"required,gt=0"`
	TransactionDate time.Time `json:"transaction_date" binding:"required"`
	CategoryID      *string   `json:"category_id"`
	SubcategoryID   *string   `json:"subcategory_id"`
	Notes           *string   `json:"notes"`
}

// ========================================
// NOVA ESTRUTURA DE INVOICE (Sistema Completo)
// ========================================

type Invoice struct {
	ID              string    `json:"id"`
	UserID          string    `json:"user_id"`
	CreditCardID    string    `json:"credit_card_id"`
	ReferenceMonth  int       `json:"reference_month"`
	ReferenceYear   int       `json:"reference_year"`
	ClosingDate     time.Time `json:"closing_date"`
	DueDate         time.Time `json:"due_date"`
	Status          string    `json:"status"` // ABERTA, FECHADA, QUITADA, VENCIDA, ESTORNADA
	TotalAmount     float64   `json:"total_amount"`
	PaidAmount      float64   `json:"paid_amount"`
	RemainingAmount float64   `json:"remaining_amount"`
	InheritedCredit float64   `json:"inherited_credit"`
	GeneratedCredit float64   `json:"generated_credit"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}
