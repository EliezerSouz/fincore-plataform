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

    if (password !== confirmPassword) {
        return { error: 'As senhas não coincidem.' }
    }

    console.log('[Signup] Iniciando cadastro para email:', email)

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                phone: phone,
            },
        },
    })

    if (error) {
        console.error('[Signup] Erro no Supabase Auth:', error)
        return { error: error.message }
    }

    console.log('[Signup] Auth User criado:', data.user?.id)

    // Attempt to apply promo code immediately if we have a session (Auto Confirm enabled)
    if (data.session?.access_token) {
        console.log('[Signup] Sessão ativa. Iniciando setup pós-cadastro.')
        
        try {
            // 1. Setup New User Defaults (Categorias, etc)
            // Agora fazemos via RPC para garantir transação e performance
            // O trigger on_auth_user_created faria isso, mas se falhar ou se quisermos garantir...
            // Vamos confiar no trigger primeiro, mas se não tiver trigger, chamamos a função.
            
            // Melhor: Chamar uma função idempotente que garante que tudo está criado.
            // Para garantir, vamos chamar a função 'setup_new_user_defaults' se ela existir.
            
            const { error: rpcError } = await supabase.rpc('setup_new_user_defaults', { 
               target_user_id: data.user.id 
            })
            
            if (rpcError) {
               console.error('[Signup] Erro ao criar categorias padrão (RPC):', rpcError)
               // Fallback: Se RPC falhar, tentamos via API ou ignoramos se for erro de duplicidade
            } else {
               console.log('[Signup] Categorias padrão verificadas/criadas com sucesso via RPC.')
            }

            // Redirect with success flag
            revalidatePath('/', 'layout')
            const redirectUrl = '/dashboard?welcome=true'
            
            console.log('[Signup] Redirecionando para:', redirectUrl)
            redirect(redirectUrl)
            return
        } catch (e) {
            console.error('[Signup] Erro no fluxo pós-cadastro. Detalhes:', e)
            // Se falhar o redirect ou api, logamos. O redirect do nextjs lança erro, então cuidado.
            if ((e as Error).message === 'NEXT_REDIRECT') {
                throw e
            }
        }
    } else {
        console.log('[Signup] Sem sessão ativa (email confirmation required?). User ID:', data.user?.id)
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard?welcome=true')
}
