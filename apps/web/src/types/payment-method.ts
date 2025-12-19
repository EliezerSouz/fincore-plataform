/**
 * FONTE ABSOLUTA DE VERDADE
 * Tipos e contextos para formas de pagamento
 */

export type TransactionContext =
    | 'INCOME'
    | 'EXPENSE'
    | 'TRANSFER'
    | 'CREDIT_CARD_PAYMENT'
    | 'INVOICE_PAYMENT'
    | 'INTERNAL_MOVEMENT'

export interface PaymentMethod {
    id: string
    name: string
    slug: string
    icon?: string

    // Flags de Contexto (FONTE DE VERDADE)
    allows_income: boolean
    allows_expense: boolean
    allows_transfer: boolean
    affects_credit_card: boolean
    affects_invoice: boolean
    is_internal: boolean

    // Flags de Comportamento
    affects_balance: boolean
    requires_bank_account: boolean

    // Status
    is_active: boolean

    // Metadata
    created_at?: string
    updated_at?: string
}

export interface PaymentMethodSelectorProps {
    /**
     * Contexto da operação financeira
     * Determina automaticamente quais métodos são válidos
     */
    context: TransactionContext

    /**
     * Método selecionado (controlled)
     */
    value?: string

    /**
     * Callback quando método muda
     */
    onChange: (methodId: string) => void

    /**
     * Se o campo é obrigatório
     */
    required?: boolean

    /**
     * Label customizado (opcional)
     */
    label?: string

    /**
     * Placeholder customizado (opcional)
     */
    placeholder?: string

    /**
     * Classe CSS adicional
     */
    className?: string
}

/**
 * Regras de validação por contexto
 * NUNCA ALTERAR ESSAS REGRAS DIRETAMENTE
 * Sempre usar os flags da tabela payment_methods
 */
export const CONTEXT_RULES: Record<TransactionContext, (method: PaymentMethod) => boolean> = {
    INCOME: (m) => m.allows_income && m.is_active,
    EXPENSE: (m) => m.allows_expense && m.is_active,
    TRANSFER: (m) => m.allows_transfer && m.is_active,
    CREDIT_CARD_PAYMENT: (m) => (m.affects_credit_card || m.affects_invoice) && m.is_active,
    INVOICE_PAYMENT: (m) => (m.affects_invoice || m.affects_credit_card) && m.is_active,
    INTERNAL_MOVEMENT: (m) => m.is_internal && m.is_active,
}

/**
 * Mensagens de ajuda por contexto
 */
export const CONTEXT_LABELS: Record<TransactionContext, string> = {
    INCOME: 'Forma de Pagamento (Entrada)',
    EXPENSE: 'Forma de Pagamento (Saída)',
    TRANSFER: 'Método de Transferência',
    CREDIT_CARD_PAYMENT: 'Forma de Pagamento da Fatura',
    INVOICE_PAYMENT: 'Forma de Pagamento da Fatura',
    INTERNAL_MOVEMENT: 'Tipo de Movimento Interno',
}
