'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

import { createClient } from '@/utils/supabase/server'

export async function signout() {
    const supabase = await createClient()
    await supabase.auth.signOut()

    // Força bruta: Deleta cookies manualmente para garantir
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()

    allCookies.forEach(cookie => {
        // Deleta cookies do Supabase (prefixo sb-)
        if (cookie.name.startsWith('sb-')) {
            cookieStore.delete(cookie.name)
        }
    })

    revalidatePath('/', 'layout')
    redirect('/login')
}
