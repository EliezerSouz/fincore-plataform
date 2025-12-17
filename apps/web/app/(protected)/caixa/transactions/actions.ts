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

    const { ApiClient } = await import('@/lib/api-client')
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
    const categoryId = formData.get('categoryId') as string
    const subcategoryId = formData.get('subcategoryId') as string
    const paymentMethodId = formData.get('paymentMethodId') as string
    const creditCardInvoiceId = formData.get('credit_card_invoice_id') as string

    if (!description || !amount || !accountId || !date) {
        throw new Error('Dados inválidos')
    }

    const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

    // Ajustar Data para evitar timezone issue (fixar meio-dia UTC)
    // Se "2024-12-14", new Date() assume UTC 00:00 -> Brasil -3h = Dia 13 21:00
    // Vamos criar manualmente UTC 12:00
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

    // ... (revalidate)
}

/**
 * Criar transferência entre contas
 * Gera uma despesa na origem e uma receita no destino com link entre elas
 */
export async function createTransfer(formData: FormData) {
    const client = await getApiClient()
    const supabase = await createClient()

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

    // Obter nomes das contas
    const accounts = await getAccounts()
    const sourceAccount = accounts.find(a => a.id === sourceAccountId)
    const targetAccount = accounts.find(a => a.id === targetAccountId)

    if (!sourceAccount || !targetAccount) throw new Error("Conta não encontrada")

    // Ajustar Data
    const [y, m, d] = date.split('-').map(Number)
    const fixedDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).toISOString()

    // Buscar/Criar Categoria "Transferência"
    const getTransferCategory = async (type: 'receita' | 'despesa') => {
        const { data } = await supabase.from('categories')
            .select('id')
            .eq('name', 'Transferência')
            .eq('type', type)
            .single()

        if (data) return data.id

        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) throw new Error("Auth required")

        const { data: newCat } = await supabase.from('categories')
            .insert({
                name: 'Transferência',
                type,
                user_id: authUser.id,
                icon: 'arrow-right-left',
                color: '#3b82f6',
                is_active: true
            })
            .select('id')
            .single()
        return newCat?.id
    }

    const expenseCategoryId = await getTransferCategory('despesa')
    const incomeCategoryId = await getTransferCategory('receita')

    let expenseId: string | null = null
    let incomeId: string | null = null

    try {
        // 1. Criar Despesa na Origem
        const expenseRes = await client.post<any>('/api/transactions', {
            account_id: sourceAccountId,
            description: `Transferência Enviada para ${targetAccount.name}`,
            amount: amount,
            type: 'despesa',
            date: fixedDate,
            payment_method_id: isValidUUID(paymentMethodId) ? paymentMethodId : undefined,
            category_id: expenseCategoryId
        })
        expenseId = expenseRes?.id || (expenseRes as any)?.data?.id // Adjust based on API structure

        // 2. Criar Receita no Destino
        const incomeRes = await client.post<any>('/api/transactions', {
            account_id: targetAccountId,
            description: `Transferência Recebida de ${sourceAccount.name}`,
            amount: amount,
            type: 'receita',
            date: fixedDate,
            payment_method_id: isValidUUID(paymentMethodId) ? paymentMethodId : undefined,
            category_id: incomeCategoryId
        })
        incomeId = incomeRes?.id || (incomeRes as any)?.data?.id

        // 3. Linkar Transações
        if (expenseId && incomeId) {
            await supabase.from('transactions').update({ related_transaction_id: incomeId }).eq('id', expenseId)
            await supabase.from('transactions').update({ related_transaction_id: expenseId }).eq('id', incomeId)
        }

    } catch (error) {
        console.error("Erro na transferência:", error)
        // Rollback attempts
        if (expenseId) await client.delete(`/api/transactions/${expenseId}`).catch(() => { })
        if (incomeId) await client.delete(`/api/transactions/${incomeId}`).catch(() => { })
        throw new Error("Falha ao processar transferência.")
    }

    revalidatePath('/', 'layout')
}

// Em updateTransaction também:
/**
 * Atualizar transação via Backend API
 * O backend recalcula o saldo automaticamente!
 * Se for transferência, propaga alterações de Valor e Data para a transação vinculada.
 */
export async function updateTransaction(id: string, formData: FormData) {
    const client = await getApiClient()
    const supabase = await createClient()

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
    const categoryId = formData.get('categoryId') as string
    const subcategoryId = formData.get('subcategoryId') as string
    const paymentMethodId = formData.get('paymentMethodId') as string

    const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

    if (!isValidUUID(accountId)) {
        throw new Error('Conta inválida ou não selecionada')
    }

    // Ajustar Data para evitar timezone issue (fixar meio-dia UTC)
    const [uy, um, ud] = date.split('-').map(Number)
    const fixedDate = new Date(Date.UTC(uy, um - 1, ud, 12, 0, 0)).toISOString()

    // 1. Atualizar Transação Principal
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

    // 2. Verificar e Atualizar Transação Vinculada (Transferência)
    const { data: current } = await supabase
        .from('transactions')
        .select('related_transaction_id')
        .eq('id', id)
        .single()

    if (current?.related_transaction_id) {
        try {
            // Buscar dados da relacionada para preservar campos
            // Usando Supabase para leitura rápida, mas update via API para recalculo de saldo
            const { data: related } = await supabase
                .from('transactions')
                .select('*')
                .eq('id', current.related_transaction_id)
                .single()

            if (related) {
                await client.put(`/api/transactions/${related.id}`, {
                    account_id: related.account_id, // Mantém a conta original da relacionada
                    category_id: related.category_id,
                    subcategory_id: related.subcategory_id,
                    payment_method_id: isValidUUID(paymentMethodId) ? paymentMethodId : related.payment_method_id, // Pode sincronizar método? Sim.
                    description: description, // Sincronizar descrição editada? O usuário pode querer editar. Vamos sincronizar.
                    amount, // Sincroniza Valor
                    type: related.type, // Mantém tipo
                    date: fixedDate // Sincroniza Data
                })
            }
        } catch (e) {
            console.error("Falha ao atualizar transação relacionada:", e)
            // Não impede o sucesso da principal, mas loga erro
        }
    }

    revalidatePath('/', 'layout')
}

/**
 * Deletar transação via Backend API
 * O backend reverte o saldo automaticamente!
 */
/**
 * Deletar transação via Backend API
 * Se for transferência, deleta a relacionada também.
 */
export async function deleteTransaction(id: string) {
    const client = await getApiClient()
    const supabase = await createClient()

    // Verifica vínculo antes de deletar
    const { data: transaction } = await supabase
        .from('transactions')
        .select('related_transaction_id')
        .eq('id', id)
        .single()

    if (transaction?.related_transaction_id) {
        try {
            console.log(`[deleteTransaction] Tentando deletar relacionada: ${transaction.related_transaction_id}`)
            await client.delete(`/api/transactions/${transaction.related_transaction_id}`)
            console.log(`[deleteTransaction] Relacionada deletada.`)
        } catch (e) {
            console.error('[deleteTransaction] Erro deletando transação relacionada:', e)
        }
    } else {
        console.log(`[deleteTransaction] Nenhuma relacionada encontrada para: ${id}`)
    }

    await client.delete(`/api/transactions/${id}`)
    revalidatePath('/', 'layout')
}

/**
 * Duplicar transação
 * TODO: Implementar no backend
 */
export async function duplicateTransaction(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: original, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single()

    if (fetchError || !original) throw new Error('Erro ao buscar original')

    const { id: _, created_at: __, updated_at: ___, ...rest } = original

    const { error } = await supabase.from('transactions').insert({
        ...rest,
        description: `${rest.description} (Cópia)`,
        user_id: user.id
    })

    if (error) throw error
    revalidatePath('/', 'layout')
}

// ===== HELPERS (Ainda usando Supabase) =====
// TODO: Migrar para backend quando endpoints estiverem prontos

export async function getCategories(type?: 'receita' | 'despesa', activeOnly = false) {
    const supabase = await createClient()
    let q = supabase.from('categories').select('*').order('name')
    if (type) q = q.eq('type', type)
    if (activeOnly) q = q.eq('is_active', true)
    const { data } = await q
    return data || []
}

export async function getSubcategories(catId: string, activeOnly = false) {
    const supabase = await createClient()
    let q = supabase.from('subcategories').select('*').eq('category_id', catId).order('name')
    if (activeOnly) q = q.eq('is_active', true)
    const { data } = await q
    return data || []
}

export async function getPaymentMethods() {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase.from('payment_methods')
            .select('*, allows_income, allows_expense')
            .eq('is_active', true)
            .order('name')

        if (error) throw error
        return data || []
    } catch (e) {
        console.error('Erro ao carregar métodos:', e)
        return []
    }
}
