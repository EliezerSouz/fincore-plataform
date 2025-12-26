'use server'
import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

import { ApiClient } from "@/lib/api-client"

export async function updateProfile(data: { full_name?: string, phone?: string, avatar_url?: string }) {
    const supabase = await createClient()
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session) return { error: "Não autenticado" }

    // Use backend API instead of direct Supabase call
    const client = new ApiClient(undefined, session.access_token)

    try {
        await client.put('/api/users/me', data)
        revalidatePath('/', 'layout')
        return { success: true }
    } catch (e: any) {
        console.error("Update profile error:", e)
        return { error: e.message || "Falha ao atualizar perfil" }
    }
}

export async function redeemPromoCodeAction(code: string) {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { error: "Não autenticado" }

    const client = new ApiClient(undefined, session.access_token)
    try {
        await client.post('/api/users/promo-code', { code })
        revalidatePath('/', 'layout')
        return { success: true }
    } catch (e: any) {
        console.error("Redeem promo error:", e)
        return { error: e.message || "Erro ao ativar código" }
    }
}
