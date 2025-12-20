/**
 * Types for Balance Adjustments and Historical Transactions
 * Supports initial balances, reconciliations, and historical transaction tracking
 */

export type BalanceAdjustmentType = 'initial' | 'reconciliation' | 'correction'

export interface BalanceAdjustment {
    id: string
    account_id: string
    adjustment_date: string // ISO date string
    balance: number
    type: BalanceAdjustmentType
    notes?: string
    starts_controlled_period: boolean
    created_at: string
    updated_at: string
    user_id: string
}

export interface CreateBalanceAdjustmentInput {
    account_id: string
    adjustment_date: string
    balance: number
    type: BalanceAdjustmentType
    notes?: string
    starts_controlled_period?: boolean
}

export interface UpdateBalanceAdjustmentInput {
    adjustment_date?: string
    balance?: number
    type?: BalanceAdjustmentType
    notes?: string
    starts_controlled_period?: boolean
}

export interface ControlledPeriod {
    startDate: string
    endDate: string | null // null = ongoing period
    startingBalance: number
    adjustmentId: string
    transactionCount: number
    historicalTransactionCount: number
    calculatedEndBalance: number
}

export interface ConvertPeriodInput {
    account_id: string
    start_date: string
    end_date: string
    mode: 'simple' | 'auto-adjust' | 'partial'
    transaction_ids?: string[] // For partial mode
    create_adjustment_transaction?: boolean
}

export interface ConvertPeriodResult {
    success: boolean
    converted_count: number
    total_impact: number
    adjustment_created: boolean
    adjustment_transaction_id?: string
    new_calculated_balance: number
    difference: number
}

export interface PeriodAnalysis {
    has_gap: boolean
    is_in_controlled_period: boolean
    suggested_type: 'normal' | 'historical'
    message: string
    last_adjustment?: BalanceAdjustment
    next_adjustment?: BalanceAdjustment
}

// Extended Transaction type with historical flag
export interface TransactionWithHistorical {
    id: string
    account_id: string
    date: string
    amount: number
    type: 'income' | 'expense'
    description: string
    category_id?: string
    is_historical: boolean
    is_adjustment: boolean
    created_at: string
    updated_at: string
}
