'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
    BalanceAdjustment,
    CreateBalanceAdjustmentInput,
    UpdateBalanceAdjustmentInput,
    ControlledPeriod,
    PeriodAnalysis,
    ConvertPeriodInput,
    ConvertPeriodResult,
} from '@/lib/types/balance-adjustments'

/**
 * Get all balance adjustments for an account
 */
export async function getBalanceAdjustments(accountId: string): Promise<BalanceAdjustment[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('account_balance_adjustments')
        .select('*')
        .eq('account_id', accountId)
        .order('adjustment_date', { ascending: false })

    if (error) {
        console.error('Error fetching balance adjustments:', error)
        throw new Error('Failed to fetch balance adjustments')
    }

    return data || []
}

/**
 * Create a new balance adjustment
 */
export async function createBalanceAdjustment(
    input: CreateBalanceAdjustmentInput
): Promise<BalanceAdjustment> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
        .from('account_balance_adjustments')
        .insert({
            ...input,
            user_id: user.id,
            starts_controlled_period: input.starts_controlled_period ?? true,
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating balance adjustment:', error)
        throw new Error('Failed to create balance adjustment')
    }

    revalidatePath('/caixa/accounts')
    return data
}

/**
 * Update a balance adjustment
 */
export async function updateBalanceAdjustment(
    id: string,
    input: UpdateBalanceAdjustmentInput
): Promise<BalanceAdjustment> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('account_balance_adjustments')
        .update(input)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('Error updating balance adjustment:', error)
        throw new Error('Failed to update balance adjustment')
    }

    revalidatePath('/caixa/accounts')
    return data
}

/**
 * Delete a balance adjustment
 */
export async function deleteBalanceAdjustment(id: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('account_balance_adjustments')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting balance adjustment:', error)
        throw new Error('Failed to delete balance adjustment')
    }

    revalidatePath('/caixa/accounts')
}

/**
 * Get controlled periods for an account
 */
export async function getControlledPeriods(accountId: string): Promise<ControlledPeriod[]> {
    const supabase = await createClient()

    // Get all adjustments
    const adjustments = await getBalanceAdjustments(accountId)

    if (adjustments.length === 0) {
        return []
    }

    const periods: ControlledPeriod[] = []

    for (let i = 0; i < adjustments.length; i++) {
        const adjustment = adjustments[i]
        const nextAdjustment = adjustments[i + 1] || null

        // Count transactions in this period
        const { count: transactionCount } = await supabase
            .from('transactions')
            .select('*', { count: 'exact', head: true })
            .eq('account_id', accountId)
            .gte('date', adjustment.adjustment_date)
            .lt('date', nextAdjustment?.adjustment_date || '9999-12-31')
            .eq('is_historical', false)

        const { count: historicalCount } = await supabase
            .from('transactions')
            .select('*', { count: 'exact', head: true })
            .eq('account_id', accountId)
            .gte('date', adjustment.adjustment_date)
            .lt('date', nextAdjustment?.adjustment_date || '9999-12-31')
            .eq('is_historical', true)

        // Calculate end balance
        const { data: transactions } = await supabase
            .from('transactions')
            .select('amount, type')
            .eq('account_id', accountId)
            .gt('date', adjustment.adjustment_date)
            .lt('date', nextAdjustment?.adjustment_date || '9999-12-31')
            .eq('is_historical', false)

        const transactionsSum = transactions?.reduce((sum, t) => {
            return sum + (t.type === 'income' ? t.amount : -t.amount)
        }, 0) || 0

        periods.push({
            startDate: adjustment.adjustment_date,
            endDate: nextAdjustment?.adjustment_date || null,
            startingBalance: adjustment.balance,
            adjustmentId: adjustment.id,
            transactionCount: transactionCount || 0,
            historicalTransactionCount: historicalCount || 0,
            calculatedEndBalance: adjustment.balance + transactionsSum,
        })
    }

    return periods
}

/**
 * Analyze a transaction date to determine if it's in a controlled period
 */
export async function analyzePeriod(
    accountId: string,
    transactionDate: string
): Promise<PeriodAnalysis> {
    const adjustments = await getBalanceAdjustments(accountId)

    if (adjustments.length === 0) {
        return {
            has_gap: false,
            is_in_controlled_period: true,
            suggested_type: 'normal',
            message: 'Nenhum ajuste de saldo definido. Todas as transações afetarão o saldo.',
        }
    }

    // Find adjustments around the transaction date
    const lastAdjustmentBefore = adjustments
        .filter(adj => adj.adjustment_date <= transactionDate)
        .sort((a, b) => b.adjustment_date.localeCompare(a.adjustment_date))[0]

    const nextAdjustmentAfter = adjustments
        .filter(adj => adj.adjustment_date > transactionDate)
        .sort((a, b) => a.adjustment_date.localeCompare(b.adjustment_date))[0]

    // If no adjustment before, it's before the first controlled period
    if (!lastAdjustmentBefore) {
        return {
            has_gap: false,
            is_in_controlled_period: false,
            suggested_type: 'historical',
            message: 'Data anterior ao primeiro ajuste de saldo. Sugerimos lançamento histórico.',
            next_adjustment: nextAdjustmentAfter,
        }
    }

    // If there's an adjustment after, we're in a gap
    if (nextAdjustmentAfter) {
        return {
            has_gap: true,
            is_in_controlled_period: false,
            suggested_type: 'historical',
            message: `Período sem controle ativo (${lastAdjustmentBefore.adjustment_date} a ${nextAdjustmentAfter.adjustment_date}). Sugerimos lançamento histórico.`,
            last_adjustment: lastAdjustmentBefore,
            next_adjustment: nextAdjustmentAfter,
        }
    }

    // We're after the last adjustment = controlled period
    return {
        has_gap: false,
        is_in_controlled_period: true,
        suggested_type: 'normal',
        message: 'Período com controle ativo. Esta transação afetará o saldo atual.',
        last_adjustment: lastAdjustmentBefore,
    }
}

/**
 * Convert historical period to controlled period with auto-adjustment
 */
export async function convertHistoricalPeriod(
    input: ConvertPeriodInput
): Promise<ConvertPeriodResult> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // 1. Get transactions in the period
    const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('account_id', input.account_id)
        .eq('is_historical', true)
        .gte('date', input.start_date)
        .lte('date', input.end_date)

    if (!transactions || transactions.length === 0) {
        throw new Error('No historical transactions found in this period')
    }

    // 2. Calculate total impact
    const totalImpact = transactions.reduce((sum, t) => {
        return sum + (t.type === 'income' ? t.amount : -t.amount)
    }, 0)

    // 3. Get adjustments
    const adjustments = await getBalanceAdjustments(input.account_id)
    const lastAdjustmentBefore = adjustments
        .filter(adj => adj.adjustment_date <= input.start_date)
        .sort((a, b) => b.adjustment_date.localeCompare(a.adjustment_date))[0]

    const nextAdjustmentAfter = adjustments
        .filter(adj => adj.adjustment_date > input.end_date)
        .sort((a, b) => a.adjustment_date.localeCompare(b.adjustment_date))[0]

    // 4. Calculate balances
    const previousBalance = lastAdjustmentBefore?.balance || 0
    const calculatedBalance = previousBalance + totalImpact
    const difference = nextAdjustmentAfter
        ? nextAdjustmentAfter.balance - calculatedBalance
        : 0

    // 5. Convert transactions to non-historical
    const { error: updateError } = await supabase
        .from('transactions')
        .update({ is_historical: false })
        .in('id', transactions.map(t => t.id))

    if (updateError) {
        console.error('Error converting transactions:', updateError)
        throw new Error('Failed to convert transactions')
    }

    // 6. Create adjustment transaction if needed (auto-adjust mode)
    let adjustmentTransactionId: string | undefined

    if (input.mode === 'auto-adjust' && Math.abs(difference) > 0.01) {
        const { data: adjustmentTx, error: txError } = await supabase
            .from('transactions')
            .insert({
                account_id: input.account_id,
                date: input.end_date,
                amount: Math.abs(difference),
                type: difference > 0 ? 'income' : 'expense',
                description: 'Ajuste de conciliação - Período convertido',
                is_historical: false,
                is_adjustment: true,
                user_id: user.id,
            })
            .select()
            .single()

        if (txError) {
            console.error('Error creating adjustment transaction:', txError)
            // Don't throw, just log - conversion was successful
        } else {
            adjustmentTransactionId = adjustmentTx?.id
        }
    }

    revalidatePath('/caixa/accounts')

    return {
        success: true,
        converted_count: transactions.length,
        total_impact: totalImpact,
        adjustment_created: !!adjustmentTransactionId,
        adjustment_transaction_id: adjustmentTransactionId,
        new_calculated_balance: calculatedBalance,
        difference,
    }
}

/**
 * Calculate account balance considering adjustments
 */
export async function calculateAccountBalanceWithAdjustments(
    accountId: string,
    targetDate?: string
): Promise<number> {
    const supabase = await createClient()

    const date = targetDate || new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
        .rpc('calculate_account_balance_with_adjustments', {
            p_account_id: accountId,
            p_target_date: date,
        })

    if (error) {
        console.error('Error calculating balance:', error)
        throw new Error('Failed to calculate balance')
    }

    return data || 0
}
