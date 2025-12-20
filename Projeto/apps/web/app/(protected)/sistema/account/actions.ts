'use server'
import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateProfile(data: { full_name?: string, phone?: string, avatar_url?: string }) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) return { error: "Não autenticado" }

    // Atualiza tabela users (perfil público)
    const updates: any = {
        updated_at: new Date().toISOString()
    }
    if (data.full_name !== undefined) updates.full_name = data.full_name
    if (data.phone !== undefined) updates.phone = data.phone
    if (data.avatar_url !== undefined) updates.avatar_url = data.avatar_url

    const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)

    if (error) {
        console.error("Update profile error:", error)
        return { error: "Falha ao atualizar dados no banco de dados." }
    }

    // Opcional: Atualizar metadados do Auth User se necessário
    // await supabase.auth.updateUser({ data: { full_name: data.full_name } })

    revalidatePath('/', 'layout')
    return { success: true }
}
