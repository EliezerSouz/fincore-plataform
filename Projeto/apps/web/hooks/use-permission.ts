"use client"

import { useUser } from "@/providers/user-provider"

export type Feature =
    | 'create_subcategory'
    | 'delete_category'
    | 'manage_categories'
    | 'unlimited_accounts'
    | 'unlimited_categories' // Ilimitadas vs Fixas
    | 'credit_cards'        // Acesso ao módulo
    | 'unlimited_cards'     // Limite de volume (1 vs ilimitado)
    | 'edit_card'          // Bloqueio de edição
    | 'manage_recurrence'   // Contas a pagar recorrentes
    | 'future_projection'   // Projeção futura
    | 'advanced_reports'
    | 'export_data'
    | 'unlimited_installments'
    | 'ai_insights'
    | 'automated_reconciliation'
    | 'transfer_between_accounts'

export function usePermission() {
    const { user, isLoading } = useUser()

    // A lógica de isPremium inclui Premium, Premium IA e Enterprise
    // Mas para features exclusivas de IA, precisamos checar o plano específico
    const plan = user?.plan?.toLowerCase() || 'free'
    
    // DEBUG: Log para verificar o que está chegando
    if (typeof window !== 'undefined' && (plan.includes('premiu') || plan.includes('preimu'))) {
        console.log('UsePermission Debug:', { plan, isPremiumUser: user?.isPremium })
    }

    // Adicionando variações de typo por segurança e garantindo que 'premium' no nome ative
    const isPremium = user?.isPremium || 
                      plan === 'premium' || 
                      plan === 'premium_ia' || 
                      plan === 'enterprise' || 
                      plan.includes('premium') || 
                      plan.includes('premiu') || // Typo tolerance
                      plan.includes('preimu');   // Typo tolerance

    const isPremiumIA = plan === 'premium_ia' || plan === 'enterprise' || plan.includes('premium_ia')

    const can = (feature: Feature): boolean => {
        if (!user) return false
        if (isLoading) return false

        // Features exclusivas de IA
        if (feature === 'ai_insights' || feature === 'automated_reconciliation') {
            return isPremium // TEMPORARY: Allow all premium users to see AI
        }

        if (isPremium) return true

        // Regras Específicas para Plano FREE
        switch (feature) {
            // ...
            // CATEGORIAS
            case 'create_subcategory':
            case 'delete_category':
            case 'manage_categories':
                return false // Bloqueado: Somente leitura / Fixas

            case 'unlimited_categories':
                return false // Bloqueado: Usa lista fixa

            // CARTÕES
            case 'credit_cards':
                return true // Acesso ao módulo permitido
            case 'unlimited_cards':
                return false // Limitado a 1
            case 'edit_card':
                return false // Bloqueado: Não pode alterar limite/datas

            // CONTAS / RECORRÊNCIA
            case 'manage_recurrence':
            case 'future_projection':
                // Redundancy check: If plan looks like premium, allow it explicitly here
                if (plan.includes('premium') || plan.includes('enterprise') || plan.includes('premiu') || plan.includes('preimu')) return true;
                return false // Bloqueado
            
            case 'transfer_between_accounts':
                return true // LIBERADO GERAL (Hotfix para usuário bloqueado)

            // CONTAS GERAIS
            case 'unlimited_accounts':
                return false // Limitado a 5 (verificado no componente)

            // RELATÓRIOS
            case 'advanced_reports':
            case 'export_data':
                return false

            case 'unlimited_installments':
                return false

            default:
                return true
        }
    }

    return {
        can,
        isPremium,
        isLoading,
        plan: user?.plan || 'free',
        daysRemaining: user?.trialDaysRemaining || 0
    }
}
