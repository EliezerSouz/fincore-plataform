'use server'

import { createClient } from '@/utils/supabase/server'

// Helper to get API Client with token
async function getApiClient() {
    const supabase = await createClient()
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token

    if (!token) {
        // Just return null/throw handled error, don't spam logs
        throw new Error('No session found')
    }

    // Dynamically import to use server-side
    const { ApiClient } = await import('@/lib/api-client')
    return new ApiClient(undefined, token)
}

export interface MonthlyHistory {
    name: string
    receita: number
    despesa: number
    saldo: number
}

export interface CategorySpending {
    name: string
    value: number
    percent: number
    color: string
    icon: string
}

export interface InvoiceAlert {
    id: string
    card_id: string
    card_name: string
    card_last4: string
    amount: number
    due_date: string
    status: string
    days_remaining: number
}

export interface FinancialSummary {
    liquidez: number
    patrimonio: number
    compromissos: number
    payables_total: number
    invoices_total: number
    receita_mensal: number
    despesa_mensal: number
    history: MonthlyHistory[]
    top_categories: CategorySpending[]
    invoices: InvoiceAlert[]
    total_balance: number
    health_status: string
    score: number
    runway: number
}

export async function getFinancialSummary(): Promise<FinancialSummary> {
    try {
        const client = await getApiClient()
        const summary = await client.get<FinancialSummary>('/api/dashboard/summary')

        return summary || {
            liquidez: 0,
            patrimonio: 0,
            compromissos: 0,
            payables_total: 0,
            invoices_total: 0,
            receita_mensal: 0,
            despesa_mensal: 0,
            history: [],
            top_categories: [],
            invoices: [],
            total_balance: 0,
            health_status: 'Estável',
            score: 0,
            runway: 0
        }
    } catch (error: any) {
        if (error.message !== 'No session found') {
            console.error("Error fetching financial summary:", error)
            console.error("Error message:", error.message)
            console.error("Error stack:", error.stack)
        }
        // Return zeros on error to avoid breaking UI
        return {
            liquidez: 0,
            patrimonio: 0,
            compromissos: 0,
            payables_total: 0,
            invoices_total: 0,
            receita_mensal: 0,
            despesa_mensal: 0,
            history: [],
            top_categories: [],
            invoices: [],
            total_balance: 0,
            health_status: 'Estável',
            score: 0,
            runway: 0
        }
    }
}
