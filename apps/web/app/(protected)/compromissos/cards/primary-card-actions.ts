'use server'

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

/**
 * Get the user's primary credit card ID
 */
export async function getPrimaryCard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data } = await supabase
        .from('users')
        .select('primary_credit_card_id, primary_card_locked')
        .eq('id', user.id)
        .single()

    return {
        primaryCardId: data?.primary_credit_card_id || null,
        isLocked: data?.primary_card_locked || false
    }
}

/**
 * Set the user's primary credit card
 * @param cardId - The credit card ID to set as primary
 * @param lockSelection - Whether to permanently lock this selection
 */
export async function setPrimaryCard(cardId: string, lockSelection: boolean = false) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("Unauthorized")

    // Check if already locked
    const { data: userData } = await supabase
        .from('users')
        .select('primary_card_locked')
        .eq('id', user.id)
        .single()

    if (userData?.primary_card_locked) {
        throw new Error("Primary card selection is already locked and cannot be changed")
    }

    // Verify the card belongs to the user
    const { data: card } = await supabase
        .from('credit_cards')
        .select('id')
        .eq('id', cardId)
        .eq('user_id', user.id)
        .single()

    if (!card) {
        throw new Error("Credit card not found or does not belong to user")
    }

    // Update user's primary card
    const updateData: any = {
        primary_credit_card_id: cardId
    }

    if (lockSelection) {
        updateData.primary_card_locked = true
    }

    const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id)

    if (error) throw error

    revalidatePath('/', 'layout')

    return {
        primaryCardId: cardId,
        isLocked: lockSelection
    }
}
