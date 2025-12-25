'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/user'
import { getAccounts } from '../accounts/actions'
import { ApiClient } from '@/lib/api-client'

export type TransactionType = 'receita' | 'despesa' | 'transferencia'

export type TransactionFilters = {
    month?: string
    year?: string
    from?: string
    to?: string
    accountId?: string
    categoryId?: string
    type?: string
    limit?: number
    offset?: number
}

export interface Category {
    id: string
    name: string
    icon?: string
    color?: string
    type: 'receita' | 'despesa'
    is_active?: boolean
    is_system?: boolean
    is_premium?: boolean
}

export interface Subcategory {
    id: string
    name: string
    category_id: string
}

export interface Transaction {
    id: string
    description: string
    amount: number
    type: 'receita' | 'despesa' | 'transferencia'
    date: string
    category_id?: string
    subcategory_id?: string
    account_id: string
    payment_method_id?: string
    invoice_id?: string
    credit_card_invoice_id?: string
    is_paid?: boolean
    subcategory?: Subcategory
    payment_method?: { name: string }
    notes?: string
    related_transaction_id?: string
    category?: Category
}

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

/**
 * Buscar transações via Backend API
 */
export async function getTransactions(filters?: TransactionFilters) {
    try {
        const client = await getApiClient()

        const params = new URLSearchParams()
        // Usar limite do filtro ou padrão 100
        const limit = filters?.limit ? filters.limit.toString() : '100'
        params.append('limit', limit)

        if (filters) {
            if (filters.accountId && filters.accountId !== 'all') {
                params.append('account_id', filters.accountId)
            }
            if (filters.categoryId && filters.categoryId !== 'all') {
                params.append('category_id', filters.categoryId)
            }
            if (filters.type && filters.type !== 'all') {
                params.append('type', filters.type)
            }
            // Filtros de data
            if (filters.from) {
                params.append('from', filters.from)
            }
            if (filters.to) {
                params.append('to', filters.to)
            }
            // Fallback para month/year se from/to não existirem
            else if (filters.month && filters.year) {
                const date = new Date(parseInt(filters.year), parseInt(filters.month) + 1, 0) // Último dia do mês
                const startDate = `${filters.year}-${(parseInt(filters.month) + 1).toString().padStart(2, '0')}-01`
                const endDate = `${filters.year}-${(parseInt(filters.month) + 1).toString().padStart(2, '0')}-${date.getDate()}`

                params.append('from', startDate)
                params.append('to', endDate)
            }
        }

        const transactions = await client.get<any[]>(`/api/transactions?${params.toString()}`)
        return transactions
    } catch (error) {
        console.error('Error fetching transactions:', error)
        return []
    }
}

/**
 * Criar transação via Backend API
 * O backend atualiza o saldo automaticamente!
 */
export async function createTransaction(formData: FormData) {
    const client = await getApiClient()

    const description = formData.get('description') as string
    const amountStr = (formData.get('amount') as string).replace('R$', '').trim()

    let amount = 0
    if (amountStr.includes(',')) {
        amount = parseFloat(amountStr.replace(/\./g, '').replace(',', '.'))
    } else {
        amount = parseFloat(amountStr)
    }

    const type = formData.get('type') as TransactionType
    const date = formData.get('date') as string
    const accountId = formData.get('accountId') as string
    const categoryId = formData.get('category_id') as string
    const subcategoryId = formData.get('subcategory_id') as string
    const paymentMethodId = formData.get('paymentMethodId') as string
    const creditCardInvoiceId = formData.get('credit_card_invoice_id') as string

    if (!description || !amount || !accountId || !date) {
        throw new Error('Dados inválidos')
    }

    const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

    // Ajustar Data para evitar timezone issue (fixar meio-dia UTC)
    const [y, m, d] = date.split('-').map(Number)
    const fixedDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).toISOString()

    await client.post('/api/transactions', {
        account_id: accountId,
        category_id: isValidUUID(categoryId) ? categoryId : undefined,
        subcategory_id: isValidUUID(subcategoryId) ? subcategoryId : undefined,
        payment_method_id: isValidUUID(paymentMethodId) ? paymentMethodId : undefined,
        invoice_id: isValidUUID(creditCardInvoiceId) ? creditCardInvoiceId : undefined,
        description,
        amount,
        type,
        date: fixedDate
    })

    revalidatePath('/', 'layout')
}

/**
 * Criar transferência entre contas
 * Gera uma despesa na origem e uma receita no destino com link entre elas
 */
export async function createTransfer(formData: FormData) {
    const client = await getApiClient()

    // 1. Verificação de Permissão
    const user = await getCurrentUser()
    const allowed = ['premium', 'premium_ia', 'enterprise']
    if (!user || !allowed.includes(user.subscription_plan)) {
        throw new Error("Funcionalidade exclusiva para assinantes Premium.")
    }

    const amountStr = (formData.get('amount') as string).replace('R$', '').trim()
    let amount = 0
    if (amountStr.includes(',')) {
        amount = parseFloat(amountStr.replace(/\./g, '').replace(',', '.'))
    } else {
        amount = parseFloat(amountStr)
    }

    const date = formData.get('date') as string
    const sourceAccountId = formData.get('sourceAccountId') as string
    const targetAccountId = formData.get('targetAccountId') as string
    const paymentMethodId = formData.get('paymentMethodId') as string
    const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

    if (!amount || !sourceAccountId || !targetAccountId || !date) {
        throw new Error('Dados incompletos para transferência')
    }

    if (sourceAccountId === targetAccountId) {
        throw new Error('A conta de origem e destino devem ser diferentes')
    }

    // Verificação de Permissão - Paralelizar chamadas externas para performance
    // Buscar/Criar Categoria "Transferência"
    const getTransferCategory = async (type: 'receita' | 'despesa') => {
        try {
            // 1. Tentar buscar primeiro
            const categories = await client.get<any[]>(`/api/categories?type=${type}`)
            const found = categories?.find((c: any) => c.name.toUpperCase() === 'TRANSFERÊNCIA' || c.name === 'Transferência')

            if (found) return found.id

            // 2. Se não encontrou, criar
            try {
                const newCat = await client.post<any>('/api/categories', {
                    name: 'Transferência',
                    type,
                    icon: 'arrow-right-left',
                    color: '#3b82f6',
                    is_active: true
                })
                return newCat.id
            } catch (createError: any) {
                // 3. Se deu erro 409 (Conflict), é porque correu uma race condition ou a busca anterior falhou, tentamos buscar de novo
                if (createError.status === 409 || createError.message?.includes('409') || createError.message?.includes('já existe')) {
                    const retryCategories = await client.get<any[]>(`/api/categories?type=${type}`)
                    const retryFound = retryCategories?.find((c: any) => c.name.toUpperCase() === 'TRANSFERÊNCIA' || c.name === 'Transferência')
                    if (retryFound) return retryFound.id
                }
                throw createError
            }
        } catch (e) {
            console.error('Erro ao buscar/criar categoria de transferência:', e)
            throw new Error('Erro ao configurar categoria de transferência')
        }
    }

    const [accounts, expenseCategoryId, incomeCategoryId] = await Promise.all([
        getAccounts(),
        getTransferCategory('despesa'),
        getTransferCategory('receita')
    ]);

    // Obter nomes das contas
    const sourceAccount = accounts.find(a => a.id === sourceAccountId)
    const targetAccount = accounts.find(a => a.id === targetAccountId)

    if (!sourceAccount || !targetAccount) throw new Error("Conta não encontrada")

    // Ajustar Data
    const [y, m, d] = date.split('-').map(Number)
    const fixedDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).toISOString()

    try {
        const payload = {
            source: {
                account_id: sourceAccountId,
                description: `Transferência Enviada para ${targetAccount.name}`,
                amount: amount,
                type: 'despesa',
                date: fixedDate,
                payment_method_id: isValidUUID(paymentMethodId) ? paymentMethodId : undefined,
                category_id: expenseCategoryId
            },
            target: {
                account_id: targetAccountId,
                description: `Transferência Recebida de ${sourceAccount.name}`,
                amount: amount,
                type: 'receita',
                date: fixedDate,
                payment_method_id: isValidUUID(paymentMethodId) ? paymentMethodId : undefined,
                category_id: incomeCategoryId
            }
        }

        await client.post('/api/transfers', payload)

    } catch (error) {
        console.error("Erro na transferência:", error)
        throw new Error("Falha ao processar transferência.")
    }

    revalidatePath('/', 'layout')
}

/**
 * Atualizar transação via Backend API
 * O backend recalcula o saldo e propaga para transferências automaticamente!
 */
export async function updateTransaction(id: string, formData: FormData) {
    const client = await getApiClient()

    const description = formData.get('description') as string
    const amountStr = (formData.get('amount') as string).replace('R$', '').trim()

    let amount = 0
    if (amountStr.includes(',')) {
        amount = parseFloat(amountStr.replace(/\./g, '').replace(',', '.'))
    } else {
        amount = parseFloat(amountStr)
    }

    const type = formData.get('type') as TransactionType
    const date = formData.get('date') as string
    const accountId = formData.get('accountId') as string
    const categoryId = formData.get('category_id') as string
    const subcategoryId = formData.get('subcategory_id') as string
    const paymentMethodId = formData.get('paymentMethodId') as string

    const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

    if (!isValidUUID(accountId)) {
        throw new Error('Conta inválida ou não selecionada')
    }

    // Ajustar Data para evitar timezone issue (fixar meio-dia UTC)
    const [uy, um, ud] = date.split('-').map(Number)
    const fixedDate = new Date(Date.UTC(uy, um - 1, ud, 12, 0, 0)).toISOString()

    // O Backend agora lida com a propagação para transações relacionadas (Transferências)
    await client.put(`/api/transactions/${id}`, {
        account_id: accountId,
        category_id: isValidUUID(categoryId) ? categoryId : undefined,
        subcategory_id: isValidUUID(subcategoryId) ? subcategoryId : undefined,
        payment_method_id: isValidUUID(paymentMethodId) ? paymentMethodId : undefined,
        description,
        amount,
        type,
        date: fixedDate
    })

    revalidatePath('/', 'layout')
}

/**
 * Deletar transação via Backend API
 * O backend reverte o saldo e deleta transferências relacionadas automaticamente!
 */
export async function deleteTransaction(id: string) {
    const client = await getApiClient()
    await client.delete(`/api/transactions/${id}`)
    revalidatePath('/', 'layout')
}

/**
 * Duplicar transação
 */
export async function duplicateTransaction(id: string) {
    const client = await getApiClient()

    // 1. Fetch original
    const original = await client.get<any>(`/api/transactions/${id}`)
    if (!original) throw new Error('Transação não encontrada')

    // 2. Create copy
    await client.post('/api/transactions', {
        account_id: original.account_id,
        category_id: original.category_id,
        subcategory_id: original.subcategory_id,
        payment_method_id: original.payment_method_id,
        invoice_id: original.invoice_id,
        description: `${original.description} (Cópia)`,
        amount: original.amount,
        type: original.type,
        date: original.date // Mantém a data original ou poderia ser new Date().toISOString()
    })

    revalidatePath('/', 'layout')
}

// ===== HELPERS REFACTORED TO USE BACKEND =====

export async function getCategories(type?: 'receita' | 'despesa', activeOnly = false) {
    try {
        const client = await getApiClient()
        let url = '/api/categories'
        const params = new URLSearchParams()
        if (type) params.append('type', type)
        params.append('active', activeOnly ? 'true' : 'false')

        url += `?${params.toString()}`

        return await client.get<any[]>(url)
    } catch (e) {
        console.error('Error fetching categories:', e)
        return []
    }
}

export async function getSubcategories(catId: string, activeOnly = false) {
    try {
        const client = await getApiClient()
        // Fetch all categories (including subs) and filter.
        // Less efficient but works without new endpoint.
        const categories = await client.get<any[]>('/api/categories?active=false')
        const category = categories.find((c: any) => c.id === catId)

        if (!category || !category.subcategories) return []

        let subs = category.subcategories
        if (activeOnly) {
            subs = subs.filter((s: any) => s.is_active)
        }
        return subs
    } catch (e) {
        console.error('Error fetching subcategories:', e)
        return []
    }
}

export async function getPaymentMethods(type?: string) {
    try {
        const client = await getApiClient()
        let url = '/api/payment-methods?active=true'
        if (type && type !== 'all') {
            url += `&type=${type}`
        }
        const res = await client.get<any[]>(url)
        return res || []
    } catch (e) {
        console.error('Error fetching payment methods:', e)
        return []
    }
}
