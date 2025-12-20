'use server'

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

// Helper to get API Client with token
async function getApiClient() {
    const supabase = await createClient()
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token

    if (!token) throw new Error('Unauthorized')

    // Dynamically import to use server-side
    const { ApiClient } = await import('@/lib/api-client')
    return new ApiClient(undefined, token)
}

/**
 * Get the user's primary credit card ID
 */
export async function getPrimaryCard() {
    try {
        const client = await getApiClient()
        const user = await client.get<any>('/api/users/me')
        
        return {
            primaryCardId: user?.primary_credit_card_id || null,
            isLocked: user?.primary_card_locked || false
        }
    } catch (error) {
        console.error("Error fetching primary card:", error)
        return null
    }
}

/**
 * Set the user's primary credit card
 * @param cardId - The credit card ID to set as primary
 * @param lockSelection - Whether to permanently lock this selection
 */
export async function setPrimaryCard(cardId: string, lockSelection: boolean = false) {
    const client = await getApiClient()
    
    // The backend endpoint handles locking check and update
    await client.put('/api/users/primary-card', {
        card_id: cardId,
        locked: lockSelection
    })

    revalidatePath('/', 'layout')

    return {
        primaryCardId: cardId,
        isLocked: lockSelection
    }
}
