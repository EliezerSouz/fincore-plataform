package entity

import "time"

type PaymentMethod struct {
	ID                string    `json:"id" db:"id"`
	UserID            string    `json:"user_id" db:"user_id"`
	Name              string    `json:"name" db:"name"`
	Type              string    `json:"type" db:"type"` // PIX, CASH, CREDIT_CARD, etc
	AllowsIncome      bool      `json:"allows_income" db:"allows_income"`
	AllowsExpense     bool      `json:"allows_expense" db:"allows_expense"`
	AllowsTransfer    bool      `json:"allows_transfer" db:"allows_transfer"`
	AffectsBalance    bool      `json:"affects_balance" db:"affects_balance"`
	AffectsCreditCard bool      `json:"affects_credit_card" db:"affects_credit_card"`
	AffectsInvoice    bool      `json:"affects_invoice" db:"affects_invoice"`
	IsInternal        bool      `json:"is_internal" db:"is_internal"`
	Icon              *string   `json:"icon" db:"icon"`
	SortOrder         int       `json:"sort_order" db:"sort_order"`
	IsActive          bool      `json:"is_active" db:"is_active"`
	CreatedAt         time.Time `json:"created_at" db:"created_at"`
	UpdatedAt         time.Time `json:"updated_at" db:"updated_at"`
}

// PaymentMethodFilter defines filters for querying payment methods
type PaymentMethodFilter struct {
	TransactionType string // "income", "expense", "transfer"
	OnlyActive      bool
}

// CanBeUsedFor checks if payment method can be used for a specific transaction type
func (pm *PaymentMethod) CanBeUsedFor(transactionType string) bool {
	switch transactionType {
	case "receita", "income":
		return pm.AllowsIncome
	case "despesa", "expense":
		return pm.AllowsExpense
	case "transfer", "transferencia":
		return pm.AllowsTransfer
	default:
		return false
	}
}
