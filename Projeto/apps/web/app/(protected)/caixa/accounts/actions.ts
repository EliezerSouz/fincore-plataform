'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { ApiClient } from "@/lib/api-client"

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

    // Yield Rate parsing
    const yieldRateStr = formData.get('yield_rate') as string
    const yield_rate = yieldRateStr ? parseFloat(yieldRateStr.replace(',', '.')) : 0

    if (!name || isNaN(balance)) {
        throw new Error('Dados inválidos')
    }

    await client.post('/api/accounts', {
        name,
        type,
        balance,
        color,
        yield_rate
    })

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

    if (!name || isNaN(balance)) {
        throw new Error('Dados inválidos')
    }

    await client.put(`/api/accounts/${id}`, {
        name,
        type,
        balance,
        color,
        is_active,
        yield_rate
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
