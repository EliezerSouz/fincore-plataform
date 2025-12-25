package entity

import "time"

// ========================================
// EVENTOS FINANCEIROS
// ========================================

type EventType string

const (
	EventTypeTransaction     EventType = "LANCAMENTO_CARTAO"
	EventTypePayment         EventType = "PAGAMENTO_FATURA"
	EventTypeAdvancedPayment EventType = "PAGAMENTO_ANTECIPADO"
	EventTypeCredit          EventType = "CREDITO_ANTECIPADO"
	EventTypeReversal        EventType = "ESTORNO"
)

type FinancialEvent struct {
	ID              string     `json:"id"`
	UserID          string     `json:"user_id"`
	Type            EventType  `json:"type"`
	InvoiceID       string     `json:"invoice_id"`
	Amount          float64    `json:"amount"`
	OriginInvoiceID *string    `json:"origin_invoice_id,omitempty"`
	RelatedEventID  *string    `json:"related_event_id,omitempty"`
	AccountID       *string    `json:"account_id,omitempty"`
	BalanceImpact   float64    `json:"balance_impact"`
	Notes           *string    `json:"notes,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	RevertedAt      *time.Time `json:"reverted_at,omitempty"`
}

// ========================================
// CRÉDITOS ANTECIPADOS
// ========================================

type Credit struct {
	ID               string    `json:"id"`
	UserID           string    `json:"user_id"`
	OriginInvoiceID  string    `json:"origin_invoice_id"`
	CurrentInvoiceID *string   `json:"current_invoice_id,omitempty"`
	OriginalAmount   float64   `json:"original_amount"`
	RemainingAmount  float64   `json:"remaining_amount"`
	IsConsumed       bool      `json:"is_consumed"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

// ========================================
// INPUTS
// ========================================

type CreateFinancialEventInput struct {
	Type            EventType `json:"type" binding:"required"`
	InvoiceID       string    `json:"invoice_id" binding:"required"`
	Amount          float64   `json:"amount" binding:"required,gt=0"`
	OriginInvoiceID *string   `json:"origin_invoice_id"`
	RelatedEventID  *string   `json:"related_event_id"`
	AccountID       *string   `json:"account_id"`
	BalanceImpact   float64   `json:"balance_impact"`
	Notes           *string   `json:"notes"`
}

type CreateCreditInput struct {
	OriginInvoiceID  string  `json:"origin_invoice_id" binding:"required"`
	CurrentInvoiceID *string `json:"current_invoice_id"`
	OriginalAmount   float64 `json:"original_amount" binding:"required,gt=0"`
	RemainingAmount  float64 `json:"remaining_amount" binding:"required,gte=0"`
}

// ========================================
// MÉTODOS AUXILIARES
// ========================================

// IsReverted verifica se o evento foi estornado
func (e *FinancialEvent) IsReverted() bool {
	return e.RevertedAt != nil
}

// CanBeReverted verifica se o evento pode ser estornado
func (e *FinancialEvent) CanBeReverted() bool {
	return !e.IsReverted() && (e.Type == EventTypePayment || e.Type == EventTypeAdvancedPayment)
}

// ConsumeAmount consome uma quantidade do crédito
func (c *Credit) ConsumeAmount(amount float64) error {
	if amount > c.RemainingAmount {
		return ErrInsufficientCredit
	}

	c.RemainingAmount -= amount
	if c.RemainingAmount == 0 {
		c.IsConsumed = true
	}
	c.UpdatedAt = time.Now()

	return nil
}

// CanBeMigrated verifica se o crédito pode ser migrado para outra fatura
func (c *Credit) CanBeMigrated() bool {
	return !c.IsConsumed && c.RemainingAmount > 0
}
