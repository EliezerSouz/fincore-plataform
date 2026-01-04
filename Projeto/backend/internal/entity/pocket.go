package entity

import "time"

// ParentAccount representa uma instituição financeira (Conta Mãe)
// Exemplos: Mercado Pago, Nubank, Inter, Banco do Brasil
// Uma ParentAccount agrupa múltiplos Pockets (subcontas)
type ParentAccount struct {
	ID              string    `json:"id" db:"id"`
	UserID          string    `json:"user_id" db:"user_id"`
	InstitutionName string    `json:"institution_name" db:"institution_name"`
	InstitutionType string    `json:"institution_type" db:"institution_type"` // digital_bank, traditional_bank, fintech, broker
	Color           *string   `json:"color" db:"color"`
	LogoURL         *string   `json:"logo_url" db:"logo_url"`
	IsActive        bool      `json:"is_active" db:"is_active"`
	CreatedAt       time.Time `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time `json:"updated_at" db:"updated_at"`

	// Virtual fields (não estão no banco, calculados em runtime)
	TotalBalance        float64  `json:"total_balance" db:"-"`
	CaixaBalance        float64  `json:"caixa_balance" db:"-"`
	ReservaBalance      float64  `json:"reserva_balance" db:"-"`
	InvestimentoBalance float64  `json:"investimento_balance" db:"-"`
	Pockets             []Pocket `json:"pockets,omitempty" db:"-"`
}

// Pocket representa uma subconta (bolso) dentro de uma instituição
// Tipos: CAIXA (uso diário), RESERVA_CDI (guardado rendendo), INVESTIMENTO (ativos)
type Pocket struct {
	ID              string  `json:"id" db:"id"`
	ParentAccountID string  `json:"parent_account_id" db:"parent_account_id"`
	UserID          string  `json:"user_id" db:"user_id"`
	Name            string  `json:"name" db:"name"`
	PocketType      string  `json:"pocket_type" db:"pocket_type"` // CAIXA, RESERVA_CDI, INVESTIMENTO
	Description     *string `json:"description" db:"description"`
	Balance         float64 `json:"balance" db:"balance"`

	// Rendimento (apenas para RESERVA_CDI)
	YieldEnabled  bool       `json:"yield_enabled" db:"yield_enabled"`
	YieldSource   *string    `json:"yield_source" db:"yield_source"`
	YieldCdiRate  float64    `json:"yield_cdi_rate" db:"yield_cdi_rate"`
	LastYieldDate *time.Time `json:"last_yield_date" db:"last_yield_date"`

	// Investimento (apenas para INVESTIMENTO)
	InvestmentType *string `json:"investment_type" db:"investment_type"` // FII, ACAO, RENDA_FIXA, ETF, CRYPTO

	// Visual
	Color *string `json:"color" db:"color"`
	Icon  *string `json:"icon" db:"icon"`

	// Ordenação e Status
	DisplayOrder int       `json:"display_order" db:"display_order"`
	IsActive     bool      `json:"is_active" db:"is_active"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`

	// Virtual fields
	YieldToday float64 `json:"yield_today" db:"-"`
	YieldMonth float64 `json:"yield_month" db:"-"`
}

// CreateParentAccountInput representa os dados para criar uma Conta Mãe
type CreateParentAccountInput struct {
	InstitutionName string  `json:"institution_name" binding:"required"`
	InstitutionType string  `json:"institution_type"`
	Color           *string `json:"color"`
	LogoURL         *string `json:"logo_url"`
	InitialBalance  float64 `json:"initial_balance"`
}

// UpdateParentAccountInput representa os dados para atualizar uma Conta Mãe
type UpdateParentAccountInput struct {
	InstitutionName *string `json:"institution_name"`
	InstitutionType *string `json:"institution_type"`
	Color           *string `json:"color"`
	LogoURL         *string `json:"logo_url"`
	IsActive        *bool   `json:"is_active"`
}

// CreatePocketInput representa os dados para criar um Pocket
type CreatePocketInput struct {
	ParentAccountID string  `json:"parent_account_id" binding:"required"`
	Name            string  `json:"name" binding:"required"`
	PocketType      string  `json:"pocket_type" binding:"required"` // CAIXA, RESERVA_CDI, INVESTIMENTO
	Description     *string `json:"description"`

	// Rendimento (opcional, apenas para RESERVA_CDI)
	YieldEnabled bool    `json:"yield_enabled"`
	YieldSource  *string `json:"yield_source"`
	YieldCdiRate float64 `json:"yield_cdi_rate"`

	// Investimento (opcional, apenas para INVESTIMENTO)
	InvestmentType *string `json:"investment_type"`

	// Visual
	Color *string `json:"color"`
	Icon  *string `json:"icon"`
}

// UpdatePocketInput representa os dados para atualizar um Pocket
type UpdatePocketInput struct {
	ParentAccountID *string  `json:"parent_account_id"`
	Name            *string  `json:"name"`
	Description     *string  `json:"description"`
	YieldEnabled    *bool    `json:"yield_enabled"`
	YieldSource     *string  `json:"yield_source"`
	YieldCdiRate    *float64 `json:"yield_cdi_rate"`
	Color           *string  `json:"color"`
	Icon            *string  `json:"icon"`
	DisplayOrder    *int     `json:"display_order"`
	IsActive        *bool    `json:"is_active"`
}

// PocketType constants
const (
	PocketTypeCaixa        = "CAIXA"
	PocketTypeReservaCDI   = "RESERVA_CDI"
	PocketTypeInvestimento = "INVESTIMENTO"
)

// InstitutionType constants
const (
	InstitutionTypeDigitalBank     = "digital_bank"
	InstitutionTypeTraditionalBank = "traditional_bank"
	InstitutionTypeFintech         = "fintech"
	InstitutionTypeBroker          = "broker"
)

// Validate valida os dados de criação de um Pocket
func (input *CreatePocketInput) Validate() error {
	// Validar pocket_type
	validTypes := map[string]bool{
		PocketTypeCaixa:        true,
		PocketTypeReservaCDI:   true,
		PocketTypeInvestimento: true,
	}

	if !validTypes[input.PocketType] {
		return ErrInvalidPocketType
	}

	// Se for yield_enabled, deve ter yield_cdi_rate
	if input.YieldEnabled {
		if input.YieldCdiRate <= 0 {
			return ErrInvalidYieldRate
		}
		if input.YieldSource == nil || *input.YieldSource == "" {
			source := "CDI"
			input.YieldSource = &source
		}
	}

	return nil
}

// Custom errors
var (
	ErrInvalidPocketType   = &ValidationError{Message: "pocket_type deve ser CAIXA, RESERVA_CDI ou INVESTIMENTO"}
	ErrInvalidYieldRate    = &ValidationError{Message: "yield_cdi_rate deve ser maior que 0 quando yield_enabled = true"}
	ErrYieldOnlyForReserva = &ValidationError{Message: "yield_enabled só pode ser true para pockets do tipo RESERVA_CDI"}
)

type ValidationError struct {
	Message string
}

func (e *ValidationError) Error() string {
	return e.Message
}
