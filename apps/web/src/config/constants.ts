/**
 * Application Constants
 * Constantes globais da aplicação
 */

export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    SIGNUP: '/signup',
    LOGOUT: '/logout',

    DASHBOARD: {
        ROOT: '/caixa',
        ACCOUNTS: '/caixa/accounts',
        TRANSACTIONS: '/caixa/transactions',
        CATEGORIES: '/caixa/categories',
    },

    COMMITMENTS: {
        ROOT: '/compromissos',
        CARDS: '/compromissos/cards',
        PAYABLES: '/compromissos/payables',
    },

    PATRIMONY: {
        ROOT: '/patrimonio',
        INVESTMENTS: '/patrimonio/investments',
    },
} as const

export const TRANSACTION_TYPES = {
    INCOME: 'receita',
    EXPENSE: 'despesa',
} as const

export const ACCOUNT_TYPES = {
    CHECKING: 'conta_corrente',
    SAVINGS: 'poupanca',
    INVESTMENT: 'investimento',
    CASH: 'dinheiro',
    CREDIT_CARD: 'cartao_credito',
} as const

export const PAYMENT_METHODS = {
    PIX: 'pix',
    CREDIT_CARD: 'cartao_credito',
    DEBIT_CARD: 'cartao_debito',
    BANK_TRANSFER: 'transferencia',
    CASH: 'dinheiro',
    BOLETO: 'boleto',
} as const

export const DATE_FORMATS = {
    DISPLAY: 'dd/MM/yyyy',
    ISO: 'yyyy-MM-dd',
    FULL: "dd/MM/yyyy 'às' HH:mm",
} as const

export const CURRENCY = {
    CODE: 'BRL',
    LOCALE: 'pt-BR',
    SYMBOL: 'R$',
} as const

// Export types
export type Route = typeof ROUTES
export type TransactionType = typeof TRANSACTION_TYPES[keyof typeof TRANSACTION_TYPES]
export type AccountType = typeof ACCOUNT_TYPES[keyof typeof ACCOUNT_TYPES]
export type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS]
