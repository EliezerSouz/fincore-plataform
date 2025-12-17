'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'
import { ApiClient } from '@/lib/api-client'

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirm_password') as string
    const fullName = formData.get('full_name') as string
    const phone = formData.get('phone') as string
    const promoCode = formData.get('promo_code') as string

    if (password !== confirmPassword) {
        return { error: 'As senhas não coincidem.' }
    }

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                phone: phone,
                promo_code: promoCode,
            },
        },
    })

    if (error) {
        return { error: error.message }
    }

    // Attempt to apply promo code immediately if we have a session (Auto Confirm enabled)
    if (data.session?.access_token && promoCode) {
        console.log('[Signup] Session created. Attempting to apply Promo Code:', promoCode)
        try {
            const client = new ApiClient(undefined, data.session.access_token)

            // 1. Force Self-Healing (Create user in public.users if missing)
            // Use Supabase directly instead of failing API call
            if (data.user) {
                console.log('[Signup] Ensuring user exists in public.users for ID:', data.user.id)
                const { error: upsertError } = await supabase
                    .from('users')
                    .upsert({
                        id: data.user.id,
                        email: email,
                        full_name: fullName,
                        subscription_plan: 'free',
                        subscription_status: 'active', // Changed from 'trial' to 'active' to match free plan logic
                        is_temp_access: false
                        // Note: There are duplicate columns like subscription_started_at (Go uses subscription_start_date)
                        // We will cleanup this later. For now, we populate minimal required fields for Go backend.
                    }, { onConflict: 'id', ignoreDuplicates: true }) // ignore if exists to not overwrite

                if (upsertError) {
                    console.error('[Signup] User Upsert Error:', upsertError)
                }
            }

            // 2. Apply Promo Code
            console.log('[Signup] Calling POST /api/setup...')
            await client.post('/api/setup', { promo_code: promoCode })
            console.log('[Signup] Promo Code Applied Successfully!')

            // Redirect with success flag
            revalidatePath('/', 'layout')
            redirect('/dashboard?welcome=true&promo_applied=true')
            return
        } catch (e) {
            console.error('[Signup] Failed to setup promo code. Error details:', e)
            // If it fails, we still redirect but maybe without the flag
        }
    } else {
        console.log('[Signup] No promo code provided or no session text.')
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard?welcome=true')
}
