'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { ApiClient } from "@/lib/api-client"
import { getPrimaryCard, setPrimaryCard } from "../../compromissos/cards/primary-card-actions"

/**
 * Obter token do usuário autenticado
 */
async function getAuthToken() {
    const supabase = await createClient()
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token || null
}

/**
 * Configurar API client com token
 */
async function getApiClient() {
    const token = await getAuthToken()
    if (!token) throw new Error('Unauthorized')

    return new ApiClient(undefined, token)
}

export interface Account {
    id: string
    name: string
    type: string
    balance: number
    color?: string
    is_active?: boolean
    yield_rate?: number
    last_yield_date?: string
    yield_today?: number
    yield_month?: number
}

/**
 * Buscar contas via Backend API
 */
export async function getAccounts(activeOnly = false) {
    try {
        const client = await getApiClient()
        const accounts = await client.get<Account[]>('/api/accounts')

        if (!Array.isArray(accounts)) {
            return []
        }

        if (activeOnly) {
            return accounts.filter(acc => acc.is_active !== false)
        }

        return accounts
    } catch (error) {
        console.error('Error fetching accounts:', error)
        return []
    }
}

/**
 * Criar conta via Backend API
 */
export async function createAccount(formData: FormData) {
    const client = await getApiClient()

    const name = formData.get('name') as string
    const balanceStr = formData.get('balance') as string
    const balance = parseFloat(balanceStr.replace('R$', '').replace(/\./g, '').replace(',', '.'))
    const type = formData.get('type') as string
    const color = formData.get('color') as string

    // Yield Rate parsing (for investment accounts)
    const yieldRateStr = formData.get('yield_rate') as string
    const yield_rate = yieldRateStr ? parseFloat(yieldRateStr.replace(',', '.')) : 0

    // CDI Yield parsing
    const yield_enabled = formData.get('yield_enabled') === 'on'
    const yield_source = formData.get('yield_source') as string || null
    const yieldCdiRateStr = formData.get('yield_cdi_rate') as string
    const yield_cdi_rate = yieldCdiRateStr ? parseFloat(yieldCdiRateStr.replace(',', '.')) : 0

    if (!name || isNaN(balance)) {
        throw new Error('Dados inválidos')
    }

    const newAccount = await client.post<Account>('/api/accounts', {
        name,
        type,
        balance,
        color,
        yield_rate,
        yield_enabled,
        yield_source,
        yield_cdi_rate: yield_enabled ? yield_cdi_rate : 0
    })

    // Create Credit Card if requested
    const hasCreditCard = formData.get('has_credit_card') === 'on'
    if (hasCreditCard) {
        try {
            const cardLimitStr = formData.get('card_limit') as string
            const cardLimit = parseFloat(cardLimitStr.replace('R$', '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.'))
            const cardBrand = formData.get('card_brand') as string
            const cardClosing = parseInt(formData.get('card_closing_day') as string)
            const cardDue = parseInt(formData.get('card_due_day') as string)

            const cardLastDigits = formData.get('card_last_digits') as string

            if (!isNaN(cardLimit) && cardLimit > 0) {
                // Check primary card status
                const primaryInfo = await getPrimaryCard()
                const hasPrimary = !!primaryInfo?.primaryCardId

                const newCard = await client.post<{ id: string }>('/api/cards', {
                    name: `${name} Crédito`,
                    account_id: newAccount.id,
                    brand: cardBrand,
                    limit_amount: cardLimit,
                    closing_day: cardClosing,
                    due_day: cardDue,
                    color: color,
                    last_4_digits: cardLastDigits || null
                })

                // Auto-set primary if none exists
                if (!hasPrimary && newCard?.id) {
                    await setPrimaryCard(newCard.id)
                }
            } else {
                console.warn('Invalid card limit, skipping card creation:', cardLimitStr)
            }
        } catch (error) {
            console.error('Error creating linked credit card:', error)
            // If card creation fails, we should probably let the user know, 
            // but we can't easily return a partial success/error state to the form action 
            // without changing the signature significantly or using a more complex return type.
            // For now, we log it. 
            // In a real app, we might want to return { success: true, warning: "Account created but card failed" }
            throw new Error('Conta criada, mas erro ao criar cartão de crédito vinculado: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
        }
    }

    revalidatePath('/', 'layout')
}

/**
 * Atualizar conta via Backend API
 */
export async function updateAccount(id: string, formData: FormData) {
    const client = await getApiClient()

    // Validate Account ID
    const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    if (!isValidUUID(id)) {
        throw new Error('ID de conta inválido')
    }

    const name = formData.get('name') as string
    const balanceStr = formData.get('balance') as string
    const balance = parseFloat(balanceStr.replace('R$', '').replace(/\./g, '').replace(',', '.'))
    const type = formData.get('type') as string
    const color = formData.get('color') as string
    const is_active = formData.get('is_active') === 'on'

    const yieldRateStr = formData.get('yield_rate') as string
    const yield_rate = yieldRateStr ? parseFloat(yieldRateStr.replace(',', '.')) : 0

    // CDI Yield parsing
    const yield_enabled = formData.get('yield_enabled') === 'on'
    const yield_source = formData.get('yield_source') as string || null
    const yieldCdiRateStr = formData.get('yield_cdi_rate') as string
    const yield_cdi_rate = yieldCdiRateStr ? parseFloat(yieldCdiRateStr.replace(',', '.')) : 0

    if (!name || isNaN(balance)) {
        throw new Error('Dados inválidos')
    }

    await client.put(`/api/accounts/${id}`, {
        name,
        type,
        balance,
        color,
        is_active,
        yield_rate,
        yield_enabled,
        yield_source,
        yield_cdi_rate: yield_enabled ? yield_cdi_rate : 0
    })

    revalidatePath('/', 'layout')
}

/**
 * Deletar conta via Backend API
 */
export async function deleteAccount(id: string) {
    const client = await getApiClient()
    await client.delete(`/api/accounts/${id}`)
    revalidatePath('/', 'layout')
}
