package entity

import "errors"

// ========================================
// ERROS DE FATURAS E CRÉDITOS
// ========================================

var (
	// Erros de Crédito
	ErrInsufficientCredit    = errors.New("crédito insuficiente")
	ErrCreditAlreadyConsumed = errors.New("crédito já foi totalmente consumido")
	ErrCreditNotFound        = errors.New("crédito não encontrado")

	// Erros de Evento Financeiro
	ErrEventAlreadyReverted  = errors.New("evento já foi estornado")
	ErrEventCannotBeReverted = errors.New("este tipo de evento não pode ser estornado")
	ErrEventNotFound         = errors.New("evento financeiro não encontrado")

	// Erros de Fatura
	ErrInvoiceNotOpen        = errors.New("fatura não está aberta")
	ErrInvoiceAlreadyPaid    = errors.New("fatura já está quitada")
	ErrInvoiceNotFound       = errors.New("fatura não encontrada")
	ErrInvoiceCannotBeEdited = errors.New("não é possível editar fatura neste status")

	// Erros de Lançamento
	ErrTransactionCannotBeEdited  = errors.New("lançamento não pode ser editado")
	ErrTransactionCannotBeDeleted = errors.New("lançamento não pode ser excluído")
	ErrInsufficientLimit          = errors.New("limite de crédito insuficiente")

	// Erros de Validação
	ErrInvalidAmount = errors.New("valor inválido")
	ErrInvalidStatus = errors.New("status inválido")
	ErrInvalidDate   = errors.New("data inválida")
)
