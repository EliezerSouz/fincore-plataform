'use server'

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { ApiClient } from "@/lib/api-client"

async function getAuthToken() {
    const supabase = await createClient()
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token || null
}

async function getApiClient() {
    const token = await getAuthToken()
    if (!token) throw new Error('Unauthorized')
    return new ApiClient(undefined, token)
}

export interface Payable {
    id: string
    description: string
    amount: number
    due_date: string
    status: 'pending' | 'paid' | 'cancelled'
    recurrence_strategy: 'single' | 'installment' | 'fixed'
    installment_number?: number
    total_installments?: number

    category_id?: string
    subcategory_id?: string
    payment_method_id?: string

    category?: { name: string, color: string, icon: string }
    subcategory?: { name: string }

    paid_at?: string | null
    transaction_id?: string | null

    // Virtual fields for UI
    is_overdue?: boolean
}

export async function getPayables(month?: number, year?: number, range?: { from: string, to: string }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    let startDate: string
    let endDate: string

    if (range?.from && range?.to) {
        startDate = range.from
        endDate = range.to
    } else {
        // Default to current month if not provided or fallback to month/year logic
        const now = new Date()
        const targetMonth = month || (now.getMonth() + 1)
        const targetYear = year || now.getFullYear()

        startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`
        endDate = new Date(targetYear, targetMonth, 0).toISOString().split('T')[0]
    }

    const { data, error } = await supabase
        .from('payables')
        .select(`
            id, description, amount, due_date, status, paid_at, transaction_id,
            recurrence_strategy, installment_number, total_installments,
            category_id, subcategory_id,
            category:categories(name, color, icon),
            subcategory:subcategories(name)
        `)
        .eq('user_id', user.id)
        // .eq('status', 'pending') // Removido para mostrar históricos mês a mês
        .gte('due_date', startDate)
        .lte('due_date', endDate)
        .order('due_date', { ascending: true })

    if (error) {
        console.error("Error fetching payables:", error)
        console.error("Details:", JSON.stringify(error, null, 2))
        return []
    }

    // Processamento adicional e cast
    return (data as any[]).map(item => ({
        ...item,
        category: Array.isArray(item.category) ? item.category[0] : item.category,
        subcategory: Array.isArray(item.subcategory) ? item.subcategory[0] : item.subcategory
    })) as Payable[]
}

export async function createPayable(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const description = formData.get('description') as string
    const amountStr = formData.get('amount') as string
    const amount = parseFloat(amountStr.replace('R$', '').replace(/\./g, '').replace(',', '.'))
    const firstDate = formData.get('date') as string
    const categoryId = formData.get('categoryId') as string || null
    const subcategoryId = formData.get('subcategoryId') as string || null
    const paymentMethodId = formData.get('paymentMethodId') as string || null
    const mode = formData.get('mode') as 'single' | 'installment' | 'fixed'
    const installments = parseInt(formData.get('installments') as string || '1')

    if (!description || !amount || !firstDate) {
        throw new Error("Dados obrigatórios faltando.")
    }

    const payablesToInsert = []
    let currentDate = new Date(firstDate)
    currentDate.setUTCHours(12, 0, 0, 0)

    if (mode === 'single') {
        payablesToInsert.push({
            user_id: user.id,
            description,
            amount,
            due_date: firstDate,
            status: 'pending',
            recurrence_strategy: 'single',
            category_id: categoryId,
            subcategory_id: subcategoryId,
            payment_method_id: paymentMethodId
        })
    } else if (mode === 'installment') {
        const installmentValue = amount / installments
        for (let i = 1; i <= installments; i++) {
            payablesToInsert.push({
                user_id: user.id,
                description: `${description} (${i}/${installments})`,
                amount: installmentValue,
                due_date: currentDate.toISOString().split('T')[0],
                status: 'pending',
                recurrence_strategy: 'installment',
                installment_number: i,
                total_installments: installments,
                category_id: categoryId,
                subcategory_id: subcategoryId,
                payment_method_id: paymentMethodId
            })
            currentDate.setMonth(currentDate.getMonth() + 1)
        }
    } else if (mode === 'fixed') {
        for (let i = 1; i <= installments; i++) {
            payablesToInsert.push({
                user_id: user.id,
                description: `${description}`,
                amount: amount,
                due_date: currentDate.toISOString().split('T')[0],
                status: 'pending',
                recurrence_strategy: 'fixed',
                category_id: categoryId,
                subcategory_id: subcategoryId,
                payment_method_id: paymentMethodId
            })
            currentDate.setMonth(currentDate.getMonth() + 1)
        }
    }

    const { error } = await supabase.from('payables').insert(payablesToInsert)
    if (error) {
        console.error('Erro ao criar contas:', error)
        throw new Error(error.message)
    }
    revalidatePath('/compromissos/payables')
}

export async function updatePayable(id: string, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const description = formData.get('description') as string
    const amountStr = formData.get('amount') as string
    const amount = parseFloat(amountStr.replace('R$', '').replace(/\./g, '').replace(',', '.'))
    const dueDate = formData.get('date') as string
    const categoryId = formData.get('categoryId') as string || null
    const subcategoryId = formData.get('subcategoryId') as string || null
    const paymentMethodId = formData.get('paymentMethodId') as string || null

    // Recorrência geralmente não se edita facilmente num item solto, mas permitimos editar detalhes

    if (!description || !amount || !dueDate) {
        throw new Error("Dados obrigatórios faltando.")
    }

    const { error } = await supabase
        .from('payables')
        .update({
            description,
            amount,
            due_date: dueDate,
            category_id: categoryId,
            subcategory_id: subcategoryId,
            payment_method_id: paymentMethodId,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) {
        console.error('Erro ao atualizar conta:', error)
        throw new Error(error.message)
    }

    revalidatePath('/compromissos/payables')
}

export async function markAsPaid(id: string, accountId: string, customDate?: string, paidAmount?: number, paymentMethod?: string) {
    console.log(`[markAsPaid] Iniciando para payable ${id}, conta ${accountId}`)
    const supabase = await createClient()
    const client = await getApiClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    // 1. Buscar payable
    const { data: payable, error: fetchError } = await supabase
        .from('payables')
        .select('*')
        .eq('id', id)
        .single()

    if (fetchError || !payable) {
        console.error("[markAsPaid] Erro ao buscar payable:", fetchError)
        throw new Error("Conta não encontrada")
    }

    // 2. Criar Transação via API (Atualiza Saldo)
    const finalAmount = paidAmount !== undefined ? paidAmount : payable.amount
    const dateStr = customDate || new Date().toISOString().split('T')[0]

    // Ajustar Data para evitar timezone issue (fixar meio-dia UTC)
    const [y, m, d] = dateStr.split('-').map(Number)
    const fixedDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).toISOString()

    const isValidUUID = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val || '')

    const payload = {
        account_id: accountId,
        category_id: payable.category_id,
        subcategory_id: payable.subcategory_id,
        payment_method_id: isValidUUID(paymentMethod || '') ? paymentMethod : undefined,
        description: payable.description,
        amount: finalAmount,
        type: 'despesa',
        date: fixedDate,
        payable_id: id // Vínculo importante
    }

    let transactionId = null

    try {
        const res = await client.post<any>('/api/transactions', payload)
        transactionId = res.id || res.data?.id
        console.log(`[markAsPaid] Transação criada via API: ${transactionId}`)
    } catch (e: any) {
        console.error("[markAsPaid] Erro na API de transações:", e)
        throw new Error("Falha ao registrar pagamento no financeiro.")
    }

    // 3. Atualizar Payable
    // Usamos a data da transação confirmada ou a original formatada
    const { error: updateError } = await supabase
        .from('payables')
        .update({
            status: 'paid',
            paid_at: fixedDate,
            transaction_id: transactionId
        })
        .eq('id', id)

    if (updateError) {
        console.error("[markAsPaid] Erro ao atualizar payable:", updateError)
        // Se falhar aqui, deveríamos desfazer a transação? Idealmente sim.
        if (transactionId) {
            await client.delete(`/api/transactions/${transactionId}`).catch(err => console.error("Falha ao rollback:", err))
        }
        throw new Error(`Erro ao atualizar status da conta: ${updateError.message}`)
    }

    console.log("[markAsPaid] Sucesso. Revalidando paths.")

    revalidatePath('/compromissos/payables')
    revalidatePath('/caixa/transactions')
    revalidatePath('/', 'layout')
    return { success: true }
}

export async function deletePayable(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('payables').delete().eq('id', id)
    if (error) throw error
    revalidatePath('/compromissos/payables')
    revalidatePath('/', 'layout')
}

export async function revertPayment(id: string) {
    console.log(`[revertPayment] Iniciando para payable ${id}`)
    const supabase = await createClient()
    const client = await getApiClient()

    // 1. Buscar payable
    const { data: payable, error: fetchError } = await supabase
        .from('payables')
        .select('*')
        .eq('id', id)
        .single()

    if (fetchError || !payable) {
        console.error("[revertPayment] Erro ao buscar:", fetchError)
        throw new Error("Conta não encontrada")
    }

    if (payable.status !== 'paid') throw new Error("Esta conta não está paga")

    // 2. Remover transação via API (Reverte Saldo)
    if (payable.transaction_id) {
        console.log(`[revertPayment] Removendo transação via API ${payable.transaction_id}`)
        try {
            await client.delete(`/api/transactions/${payable.transaction_id}`)
        } catch (e) {
            console.error("[revertPayment] Erro ao deletar transação na API:", e)
            // Se der 404 (já deletada), continuamos. Se for outro erro, lançamos?
            // Vamos assumir que se falhar, o usuário deve saber.
            throw new Error("Erro ao desfazer transação financeira.")
        }
    } else {
        console.warn("[revertPayment] Payable não tem transaction_id. Revertendo apenas status.")
    }

    // 3. Reverter status do Payable
    const { error: updateError } = await supabase
        .from('payables')
        .update({
            status: 'pending',
            paid_at: null,
            transaction_id: null
        })
        .eq('id', id)

    if (updateError) {
        console.error("[revertPayment] Erro ao update:", updateError)
        throw new Error("Erro ao restaurar conta a pagar: " + updateError.message)
    }

    console.log("[revertPayment] Sucesso.")

    revalidatePath('/compromissos/payables')
    revalidatePath('/caixa/transactions')
    revalidatePath('/', 'layout')
    return { success: true }
}
