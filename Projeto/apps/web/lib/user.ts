import { createClient } from '@/utils/supabase/server'

// =====================================================
// TIPOS
// =====================================================

export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'canceled' | 'suspended'
export type SubscriptionPlan = 'free' | 'basic' | 'premium' | 'premium_ia' | 'enterprise'

export interface User {
    id: string
    full_name: string
    phone: string | null
    email: string
    subscription_plan: SubscriptionPlan
    subscription_status: SubscriptionStatus
    subscription_started_at: string | null
    subscription_ends_at: string | null
    trial_ends_at: string | null
    last_payment_date: string | null
    next_billing_date: string | null
    payment_method: string | null
    created_at: string
    updated_at: string
    is_active: boolean
    email_verified: boolean
    onboarding_completed: boolean
    is_temp_access: boolean
    temp_access_expires_at: string | null
    subscription_start_date: string | null
    subscription_due_date: string | null
    subscription_end_date: string | null
    avatar_url: string | null
}

// =====================================================
// FUNÇÕES DE USUÁRIO
// =====================================================

/**
 * Busca dados completos do usuário logado
 */
export async function getCurrentUser(): Promise<User | null> {
    const supabase = await createClient()

    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
        return null
    }

    // 1. Tenta buscar na tabela users
    let { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

    // 2. SELF-HEALING: Se não achar registro mas estiver logado, cria agora!
    if (!data || error) {
        console.log('User not found in public.users. Attempting self-healing for:', authUser.id)

        // Nota: Campos removidos para compatibilidade com schema atual (sem phone, dates corrigidas)
        const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
                id: authUser.id,
                email: authUser.email!,
                full_name: authUser.user_metadata?.full_name || 'Usuário',
                // phone: authUser.user_metadata?.phone || null, // Coluna não existe
                subscription_status: 'active', // Default active/free
                subscription_plan: 'free',
                subscription_start_date: new Date().toISOString() // Corrigido de subscription_started_at
            })
            .select()
            .single()

        if (createError) {
            console.error('Error creating user via self-healing:', createError)
            return null
        }

        data = newUser
    }

    return data
}

/**
 * Verifica se o usuário tem assinatura válida
 * Updated: Implementado em TS para evitar dependência de RPC instável
 */
export async function hasValidSubscription(userOrNull?: User | null): Promise<boolean> {
    let user = userOrNull

    // Se não foi passado o usuário, busca agora
    if (!user) {
        user = await getCurrentUser()
    }

    if (!user) {
        return false
    }

    // Lógica espelhada do banco de dados (is_subscription_valid)
    
    // 1. Trial
    if (user.subscription_status === 'trial') {
        // Se tiver trial_ends_at, valida data
        if (user.trial_ends_at) {
            return new Date(user.trial_ends_at) > new Date()
        }
        // Se não tiver data de fim de trial mas status é trial, assume inválido ou expirado por segurança
        return false
    }

    // 2. Ativa (Free, Premium, etc)
    if (user.subscription_status === 'active') {
        // Se não tiver data fim, é vitalício ou recorrente sem data fim definida (ex: Free)
        if (!user.subscription_ends_at) return true
        
        return new Date(user.subscription_ends_at) > new Date()
    }

    // 3. Pagamento Pendente (Grace Period)
    if (user.subscription_status === 'past_due') {
        if (!user.subscription_ends_at) return false 
        
        // 3 dias de tolerância
        const gracePeriod = new Date()
        gracePeriod.setDate(gracePeriod.getDate() - 3)
        
        return new Date(user.subscription_ends_at) > gracePeriod
    }

    // 4. Acesso Temporário (Promo Code)
    if (user.is_temp_access && user.temp_access_expires_at) {
        return new Date(user.temp_access_expires_at) > new Date()
    }

    // Outros status: cancelado, suspenso = false
    return false
}

/**
 * Atualiza dados do perfil do usuário
 */
export async function updateUserProfile(updates: Partial<Pick<User, 'full_name' | 'phone' | 'avatar_url'>>) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('User not authenticated')
    }

    const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)

    if (error) {
        throw error
    }
}

/**
 * Marca onboarding como completo
 */
export async function completeOnboarding() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('User not authenticated')
    }

    const { error } = await supabase
        .from('users')
        .update({ onboarding_completed: true })
        .eq('id', user.id)

    if (error) {
        throw error
    }
}

// =====================================================
// FUNÇÕES DE ASSINATURA
// =====================================================

/**
 * Ativa assinatura premium
 */
export async function activatePremiumSubscription(plan: SubscriptionPlan = 'premium') {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('User not authenticated')
    }

    const { error } = await supabase
        .from('users')
        .update({
            subscription_plan: plan,
            subscription_status: 'active',
            subscription_started_at: new Date().toISOString(),
            subscription_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
            next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('id', user.id)

    if (error) {
        throw error
    }
}

/**
 * Cancela assinatura
 */
export async function cancelSubscription() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('User not authenticated')
    }

    const { error } = await supabase
        .from('users')
        .update({
            subscription_status: 'canceled',
        })
        .eq('id', user.id)

    if (error) {
        throw error
    }
}

/**
 * Registra pagamento
 */
export async function recordPayment(paymentMethod: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('User not authenticated')
    }

    const nextBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    const { error } = await supabase
        .from('users')
        .update({
            subscription_status: 'active',
            last_payment_date: new Date().toISOString(),
            next_billing_date: nextBillingDate,
            subscription_ends_at: nextBillingDate,
            payment_method: paymentMethod,
        })
        .eq('id', user.id)

    if (error) {
        throw error
    }
}

// =====================================================
// HELPERS
// =====================================================

/**
 * Calcula dias restantes de trial
 */
export function getDaysRemainingInTrial(user: User): number {
    // New Backend Logic: Use temp_access_expires_at
    if (user.is_temp_access && user.temp_access_expires_at) {
        const now = new Date()
        const trialEnd = new Date(user.temp_access_expires_at)
        const diffTime = trialEnd.getTime() - now.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return Math.max(0, diffDays)
    }

    // Fallback Legacy Logic
    if (!user.trial_ends_at) return 0

    const now = new Date()
    const trialEnd = new Date(user.trial_ends_at)
    const diffTime = trialEnd.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return Math.max(0, diffDays)
}

/**
 * Verifica se está em período de trial
 */
export function isInTrial(user: User): boolean {
    if (user.subscription_status === 'trial') return true
    // Also consider temp access as special trial type
    if (user.is_temp_access && user.temp_access_expires_at) {
        // Only if not expired
        return getDaysRemainingInTrial(user) > 0
    }
    return false
}

/**
 * Verifica se assinatura está ativa
 */
export function hasActiveSubscription(user: User): boolean {
    return user.subscription_status === 'active' || isInTrial(user)
}

/**
 * Retorna label amigável do plano
 */
export function getPlanLabel(plan: SubscriptionPlan): string {
    const labels: Record<SubscriptionPlan, string> = {
        free: 'FINCORE Free',
        basic: 'Básico',
        premium: 'FINCORE Premium',
        premium_ia: 'FINCORE IA',
        enterprise: 'Enterprise'
    }
    return labels[plan]
}

/**
 * Retorna label amigável do status
 */
export function getStatusLabel(status: SubscriptionStatus): string {
    const labels: Record<SubscriptionStatus, string> = {
        trial: 'Período de Teste',
        active: 'Ativa',
        past_due: 'Pagamento Pendente',
        canceled: 'Cancelada',
        suspended: 'Suspensa'
    }
    return labels[status]
}
