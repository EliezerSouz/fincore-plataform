'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

interface ValidatePromoResult {
    success?: boolean
    error?: string
    plan?: string
    days?: number
}

export async function validatePromoCode(code: string): Promise<ValidatePromoResult> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Usuário não autenticado' }
    }

    if (!code || code.trim().length === 0) {
        return { error: 'Por favor, insira um código válido.' }
    }

    // 1. Buscar código promocional
    const { data: promo, error: promoError } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('active', true)
        .single()

    if (promoError || !promo) {
        console.error('Erro ao buscar promo code:', promoError)
        return { error: 'Código promocional inválido ou expirado.' }
    }

    // 2. Calcular datas
    const now = new Date()
    const endDate = new Date(now)
    endDate.setDate(endDate.getDate() + promo.duration_days)

    // 3. Atualizar usuário
    const { error: updateError } = await supabase
        .from('users')
        .update({
            subscription_plan: promo.plan_type, // 'premium', 'premium_ia', etc.
            subscription_status: 'active',
            subscription_start_date: now.toISOString(),
            subscription_end_date: endDate.toISOString(),
            used_promo_code: promo.code,
            is_temp_access: true,
            temp_access_expires_at: endDate.toISOString(),
            updated_at: now.toISOString()
        })
        .eq('id', user.id)

    if (updateError) {
        console.error('Erro ao atualizar usuário com promo code:', updateError)
        return { error: 'Erro ao aplicar o código. Tente novamente.' }
    }

    revalidatePath('/dashboard')
    return { 
        success: true, 
        plan: promo.plan_type, 
        days: promo.duration_days 
    }
}
