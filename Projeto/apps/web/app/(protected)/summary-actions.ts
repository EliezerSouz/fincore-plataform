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

export interface FinancialSummary {
    liquidez: number
    patrimonio: number
    compromissos: number
}

export async function getFinancialSummary(): Promise<FinancialSummary> {
    try {
        const client = await getApiClient()
        const summary = await client.get<FinancialSummary>('/api/dashboard/summary')

        return summary || {
            liquidez: 0,
            patrimonio: 0,
            compromissos: 0
        }
    } catch (error: any) {
        if (error.message !== 'No session found') {
            console.error("Error fetching financial summary:", error)
        }
        // Return zeros on error to avoid breaking UI
        return {
            liquidez: 0,
            patrimonio: 0,
            compromissos: 0
        }
    }
}
