import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function GET() {
    const supabase = await createClient()

    // 1. Tenta logout oficial do Supabase
    await supabase.auth.signOut()

    // 2. Força bruta: Deleta cookies manualmente para garantir
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()

    allCookies.forEach(cookie => {
        // Deleta cookies do Supabase (prefixo sb-)
        if (cookie.name.startsWith('sb-')) {
            cookieStore.delete(cookie.name)
        }
    })

    redirect('/login')
}
