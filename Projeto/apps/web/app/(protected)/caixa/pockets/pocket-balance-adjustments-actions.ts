'use server'

import { ApiClient } from "@/lib/api-client"
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

async function getAuthToken() {
    const supabase = await createClient()
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token || null
}

async function getApiClient() {
    const token = await getAuthToken()
    if (!token) throw new Error('Unauthorized')
    return new ApiClient(undefined, token)
}

export type BalanceAdjustmentType = 'initial' | 'reconciliation' | 'correction'

export interface CreatePocketBalanceAdjustmentInput {
    pocket_id: string
    adjustment_date: string // ISO Date
    balance: number
    type: BalanceAdjustmentType
    notes?: string
    starts_controlled_period?: boolean
}

export async function createPocketBalanceAdjustment(input: CreatePocketBalanceAdjustmentInput) {
    const client = await getApiClient()

    // Send to the backend API which now supports pocket_id
    const payload = {
        pocket_id: input.pocket_id,
        adjustment_date: input.adjustment_date,
        balance: input.balance,
        type: input.type,
        notes: input.notes,
        starts_controlled_period: input.starts_controlled_period ?? true
    }

    try {
        const res = await client.post('/api/balance-adjustments', payload)
        revalidatePath('/caixa/pockets')
        return res
    } catch (error: any) {
        console.error('Error creating pocket adjustment:', error)
        // Extract error message from API response if possible
        const msg = error.response?.data?.error || error.message || 'Failed to create adjustment'
        throw new Error(msg)
    }
}
