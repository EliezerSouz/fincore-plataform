'use server'

import { revalidatePath } from 'next/cache'
import { ApiClient } from "@/lib/api-client"
import { createClient } from '@/utils/supabase/server'

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

export interface PocketTransferInput {
    source_pocket_id: string
    target_pocket_id: string
    amount: number
    description?: string
    date: string
}

/**
 * Transfer money between pockets
 */
export async function createPocketTransfer(input: PocketTransferInput) {
    const client = await getApiClient()

    const response = await client.post('/api/transactions/pocket-transfer', {
        source_pocket_id: input.source_pocket_id,
        target_pocket_id: input.target_pocket_id,
        amount: input.amount,
        description: input.description || '',
        date: input.date
    })

    revalidatePath('/', 'layout')
    return response
}
