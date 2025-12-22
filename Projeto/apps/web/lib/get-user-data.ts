import { getCurrentUser, hasValidSubscription, getPlanLabel, getStatusLabel, isInTrial, getDaysRemainingInTrial } from '@/lib/user'
import { createClient } from '@/utils/supabase/server'

export async function getUserData() {
    const supabase = await createClient()

    // Buscar usuário autenticado
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
        return null
    }

    // Buscar dados completos do usuário
    const user = await getCurrentUser()

    if (!user) {
        return null
    }

    // Verificar se tem assinatura válida
    const hasValidSub = await hasValidSubscription(user)

    // Calcular dias restantes de trial
    const daysRemaining = isInTrial(user) ? getDaysRemainingInTrial(user) : 0

    return {
        id: user.id,
        name: user.full_name,
        email: user.email,
        phone: user.phone,
        initials: user.full_name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2),

        // Assinatura
        plan: user.subscription_plan,
        planLabel: getPlanLabel(user.subscription_plan),
        status: user.subscription_status,
        statusLabel: getStatusLabel(user.subscription_status),
        hasValidSubscription: hasValidSub,
        isInTrial: isInTrial(user),
        trialDaysRemaining: daysRemaining,

        // Datas
        createdAt: user.created_at,
        subscriptionStartedAt: user.subscription_started_at,
        nextBillingDate: user.next_billing_date,

        // Flags
        isPremium: user.subscription_plan === 'premium' || user.subscription_plan === 'enterprise',
        needsPayment: user.subscription_status === 'past_due' || user.subscription_status === 'suspended',
    }
}

export type UserData = Awaited<ReturnType<typeof getUserData>>
