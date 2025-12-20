'use server'

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { ApiClient } from "@/lib/api-client"

async function getApiClient() {
    const supabase = await createClient()
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token || null
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

    category?: { id: string, name: string, color: string, icon: string }
    subcategory?: { id: string, name: string }

    paid_at?: string | null
    transaction_id?: string | null

    // Virtual fields for UI
    is_overdue?: boolean
}

export async function getPayables(month?: number, year?: number, range?: { from: string, to: string }) {
    try {
        const client = await getApiClient()

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
            // Last day of month
            endDate = new Date(targetYear, targetMonth, 0).toISOString().split('T')[0]
        }

        const payables = await client.get<Payable[]>(`/api/payables?from=${startDate}&to=${endDate}`)
        return payables
    } catch (error) {
        console.error("Error fetching payables:", error)
        return []
    }
}

export async function createPayable(formData: FormData) {
    const client = await getApiClient()

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

    // Adjust Date to noon UTC to avoid timezone shifts
    const [y, m, d] = firstDate.split('-').map(Number)
    const fixedDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0))

    const payload = {
        description,
        amount,
        due_date: fixedDate.toISOString(),
        recurrence_strategy: mode,
        installments: installments,
        category_id: categoryId,
        subcategory_id: subcategoryId,
        payment_method_id: paymentMethodId
    }

    await client.post('/api/payables', payload)
    revalidatePath('/compromissos/payables')
}

export async function updatePayable(id: string, formData: FormData) {
    const client = await getApiClient()

    const description = formData.get('description') as string
    const amountStr = formData.get('amount') as string
    const amount = parseFloat(amountStr.replace('R$', '').replace(/\./g, '').replace(',', '.'))
    const dueDateStr = formData.get('date') as string
    const categoryId = formData.get('categoryId') as string || null
    const subcategoryId = formData.get('subcategoryId') as string || null
    const paymentMethodId = formData.get('paymentMethodId') as string || null

    if (!description || !amount || !dueDateStr) {
        throw new Error("Dados obrigatórios faltando.")
    }

    // Adjust Date
    const [y, m, d] = dueDateStr.split('-').map(Number)
    const fixedDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0))

    const payload = {
        description,
        amount,
        due_date: fixedDate.toISOString(),
        category_id: categoryId,
        subcategory_id: subcategoryId,
        payment_method_id: paymentMethodId
    }

    await client.put(`/api/payables/${id}`, payload)
    revalidatePath('/compromissos/payables')
}

export async function markAsPaid(id: string, accountId: string, customDate?: string, paidAmount?: number, paymentMethod?: string) {
    console.log(`[markAsPaid] Iniciando para payable ${id}, conta ${accountId}`)
    const client = await getApiClient()
    
    const dateStr = customDate || new Date().toISOString().split('T')[0]
    // Fix timezone issue (noon UTC)
    const [y, m, d] = dateStr.split('-').map(Number)
    const fixedDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).toISOString()

    const isValidUUID = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val || '')

    const payload = {
        account_id: accountId,
        date: fixedDate,
        amount: paidAmount,
        payment_method_id: isValidUUID(paymentMethod || '') ? paymentMethod : undefined
    }

    try {
        await client.post(`/api/payables/${id}/pay`, payload)
        console.log("[markAsPaid] Sucesso.")
    } catch (e: any) {
        console.error("[markAsPaid] Erro:", e)
        throw new Error(e.message || "Falha ao pagar conta")
    }

    revalidatePath('/compromissos/payables')
    revalidatePath('/caixa/transactions')
    revalidatePath('/', 'layout')
    return { success: true }
}

export async function revertPayment(id: string) {
    console.log(`[revertPayment] Iniciando para payable ${id}`)
    const client = await getApiClient()
    
    try {
        await client.post(`/api/payables/${id}/revert`, {})
        console.log("[revertPayment] Sucesso.")
    } catch (e: any) {
        console.error("[revertPayment] Erro:", e)
        throw new Error(e.message || "Falha ao reverter pagamento")
    }

    revalidatePath('/compromissos/payables')
    revalidatePath('/caixa/transactions')
    revalidatePath('/', 'layout')
    return { success: true }
}

export async function deletePayable(id: string) {
    const client = await getApiClient()
    await client.delete(`/api/payables/${id}`)

    revalidatePath('/compromissos/payables')
    revalidatePath('/', 'layout')
}
