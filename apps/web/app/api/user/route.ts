import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getPlanLabel, getStatusLabel, isInTrial, getDaysRemainingInTrial } from '@/lib/user'

export const dynamic = "force-dynamic"

export async function GET() {
    try {
        const supabase = await createClient()

        // 1. Verificar Autenticação
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

        if (authError || !authUser) {
            console.error('API /api/user - Auth Error:', authError)
            return NextResponse.json({ error: 'Not authenticated', details: authError }, { status: 401 })
        }

        // 2. Buscar Usuário no Banco
        let { data: dbUser, error: dbError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .maybeSingle()

        if (dbError) {
            console.error('API /api/user - DB Select Error:', dbError)
        }

        // 3. Self-Healing / Fallback
        if (!dbUser) {
            console.log('API /api/user - User not found in DB. Creating default record for:', authUser.id)

            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert({
                    id: authUser.id,
                    email: authUser.email!,
                    // Tenta pegar do metadata ou usa padrão
                    full_name: authUser.user_metadata?.full_name || 'Usuário',
                    phone: authUser.user_metadata?.phone || null,
                    subscription_plan: 'free',
                    subscription_status: 'active',
                    base_plan: 'free', // Garantir consistência com novo esquema
                    subscription_started_at: new Date().toISOString()
                })
                .select()
                .single()

            if (createError) {
                console.error('API /api/user - Create Error (Self-healing failed):', createError)

                // CRITICAL FALLBACK: Use Auth Data directly if DB fails
                // Isso garante que o usuário veja seus dados mesmo se o banco travar/bloquear
                console.log('API /api/user - Using Auth Metadata as Fallback')
                dbUser = {
                    id: authUser.id,
                    full_name: authUser.user_metadata?.full_name || 'Usuário (Auth)',
                    email: authUser.email!,
                    phone: authUser.user_metadata?.phone || null,
                    subscription_plan: 'free',
                    subscription_status: 'active',
                    trial_ends_at: null,
                    created_at: new Date().toISOString()
                    // Outros campos opcionais serão undefined, o que é OK
                }
            } else {
                dbUser = newUser
            }
        }

        // 4. Calcular dados derivados com segurança
        const daysRemaining = isInTrial(dbUser) ? getDaysRemainingInTrial(dbUser) : 0

        // 5. Montar resposta
        const responseData = {
            id: dbUser.id || authUser.id,
            name: dbUser.full_name,
            email: dbUser.email,
            phone: dbUser.phone,
            initials: dbUser.full_name
                ? dbUser.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                : 'U',

            plan: dbUser.subscription_plan || 'free',
            planLabel: getPlanLabel(dbUser.subscription_plan || 'free'),
            status: dbUser.subscription_status || 'active',
            statusLabel: getStatusLabel(dbUser.subscription_status || 'active'),
            isInTrial: isInTrial(dbUser),
            trialDaysRemaining: daysRemaining,

            // New Date Fields
            subscriptionStartDate: dbUser.subscription_start_date || dbUser.subscription_started_at || null,
            subscriptionEndDate: dbUser.subscription_end_date || dbUser.subscription_ends_at || null,
            tempAccessExpiresAt: dbUser.temp_access_expires_at || null,
            nextBillingDate: dbUser.next_billing_date || null,
            createdAt: dbUser.created_at || null,
            avatarUrl: dbUser.avatar_url || null,

            isPremium: dbUser.subscription_plan === 'premium' || dbUser.subscription_plan === 'enterprise',
            needsPayment: dbUser.subscription_status === 'past_due' || dbUser.subscription_status === 'suspended',
        }

        return NextResponse.json(responseData)

    } catch (error) {
        console.error('API /api/user - Critical Error:', error)
        return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 })
    }
}
