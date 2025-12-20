'use server'

import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"

async function getApiClient() {
    const supabase = await createClient()
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) throw new Error('Unauthorized')
    const { ApiClient } = await import('@/lib/api-client')
    return new ApiClient(undefined, token)
}

export interface CreditCard {
    id: string,
    name: string,
    brand: string,
    last_4_digits: string,
    limit_amount: number,
    closing_day: number,
    due_day: number,
    color: string,
    available_limit?: number // Campo calculado
}

export async function getCreditCards() {
    try {
        const client = await getApiClient()
        // Backend calculates available_limit automatically
        return await client.get<CreditCard[]>('/api/cards') || []
    } catch (error) {
        console.error('Erro ao buscar cartões:', error)
        return []
    }
}

export async function getCreditCardById(id: string) {
    try {
        const client = await getApiClient()
        return await client.get<CreditCard>(`/api/cards/${id}`)
    } catch (error) {
        return null
    }
}

export async function createCreditCard(formData: FormData) {
    const client = await getApiClient()

    const name = formData.get('name') as string
    const brand = formData.get('brand') as string
    const last4 = formData.get('last_4_digits') as string
    const limitStr = formData.get('limit_amount') as string
    const closingDay = parseInt(formData.get('closing_day') as string)
    const dueDay = parseInt(formData.get('due_day') as string)
    const color = formData.get('color') as string

    // Parse do valor do limite
    const limit = parseFloat(
        limitStr
            .replace('R$', '')
            .replace(/\s/g, '')
            .replace(/\./g, '')
            .replace(',', '.')
            .trim()
    )

    if (isNaN(limit) || limit <= 0) {
        throw new Error('Valor do limite inválido')
    }

    await client.post('/api/cards', {
        name,
        brand,
        last_4_digits: last4 || null,
        limit_amount: limit,
        closing_day: closingDay,
        due_day: dueDay,
        color
    })

    // Revalidar a página de cartões especificamente
    revalidatePath('/compromissos/cards')
    revalidatePath('/compromissos/cards', 'page')

    return { success: true }
}

export async function updateCreditCard(formData: FormData) {
    const client = await getApiClient()

    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const brand = formData.get('brand') as string
    const last4 = formData.get('last_4_digits') as string
    const limitStr = formData.get('limit_amount') as string
    const closingDay = parseInt(formData.get('closing_day') as string)
    const dueDay = parseInt(formData.get('due_day') as string)
    const color = formData.get('color') as string

    // Parse do valor do limite
    const limit = parseFloat(
        limitStr
            .replace('R$', '')
            .replace(/\s/g, '')
            .replace(/\./g, '')
            .replace(',', '.')
            .trim()
    )

    if (isNaN(limit) || limit <= 0) {
        throw new Error('Valor do limite inválido')
    }

    await client.put(`/api/cards/${id}`, {
        name,
        brand,
        last_4_digits: last4 || null,
        limit_amount: limit,
        closing_day: closingDay,
        due_day: dueDay,
        color
    })

    // Revalidar a página de cartões
    revalidatePath('/compromissos/cards')
    revalidatePath('/compromissos/cards', 'page')

    return { success: true }
}

export async function deleteCreditCard(id: string) {
    const client = await getApiClient()

    // Backend handles cascade delete of transactions and invoices
    await client.delete(`/api/cards/${id}`)

    revalidatePath('/compromissos/cards')
    revalidatePath('/compromissos/cards', 'page')
}

export async function updateTransaction(formData: FormData) {
    const client = await getApiClient()
    const id = formData.get('id') as string
    const description = formData.get('description') as string
    let amountStr = formData.get('amount') as string
    const dateStr = (formData.get('transaction_date') as string) || (formData.get('date') as string)

    amountStr = amountStr.replace('R$', '').trim()
    let amount = 0
    amount = amountStr.includes(',')
        ? parseFloat(amountStr.replace(/\./g, '').replace(',', '.'))
        : parseFloat(amountStr)

    const subcategoryId = formData.get('subcategory_id') as string || null
    const notes = formData.get('notes') as string || null

    await client.put(`/api/invoices/transactions/${id}`, {
        description,
        amount,
        transaction_date: dateStr,
        category_id: formData.get('category_id') as string || null,
        subcategory_id: subcategoryId,
        notes: notes
    })

    revalidatePath('/compromissos/cards', 'layout') // Revalida tudo relacionado a cartões
    return { success: true }
}

//Types
export interface Invoice {
    id: string
    credit_card_id: string
    reference_month: number
    reference_year: number
    closing_date: string
    due_date: string
    total_amount: number
    paid_amount: number
    status: 'open' | 'closed' | 'paid' | 'overdue' | 'partial'
}

export interface Transaction {
    id: string
    invoice_id: string
    description: string
    amount: number
    transaction_date: string
    is_installment: boolean
    installment_number?: number
    total_installments?: number
    category_id?: string
    subcategory_id?: string
    notes?: string
    group_id?: string
    transaction_type: 'purchase' | 'refund' | 'adjustment' | 'fee'
}

// --- INVOICES ---

export async function getCardInvoices(cardId: string) {
    try {
        const client = await getApiClient()
        return await client.get<Invoice[]>(`/api/cards/${cardId}/invoices`) || []
    } catch (error) {
        console.error('Error fetching invoices:', error)
        return []
    }
}

export async function getNextInvoice(cardId: string, currentMonth: number, currentYear: number) {
    // Backend can compute next on demand later; keep placeholder
    return undefined
}

export interface InvoicePayment {
    id: string
    description: string
    amount: number
    date: string
    account_id: string
}

export async function getInvoiceDetails(invoiceId: string) {
    const client = await getApiClient()
    const data = await client.get<{ invoice: Invoice, transactions: Transaction[], payments: InvoicePayment[], rollover_amount?: number }>(`/api/invoices/${invoiceId}`)
    return {
        invoice: data.invoice,
        transactions: data.transactions,
        payments: data.payments || [],
        rollover_amount: data.rollover_amount || 0
    }
}

// --- TRANSACTIONS ---

export async function createTransaction(formData: FormData) {
    const client = await getApiClient()
    const cardId = formData.get('card_id') as string
    const description = formData.get('description') as string
    const amount = parseFloat((formData.get('amount') as string).replace('R$', '').replace(/\./g, '').replace(',', '.').trim())
    const date = (formData.get('transaction_date') as string) || (formData.get('date') as string)
    const installments = parseInt(formData.get('installments') as string || '1')
    const categoryId = formData.get('category_id') as string || null
    const subcategoryId = formData.get('subcategory_id') as string || null
    const notes = formData.get('notes') as string || null

    const startingInstallment = parseInt(formData.get('startingInstallment') as string || '1')
    const installmentValueStr = formData.get('installmentValue') as string
    const installmentValue = installmentValueStr
        ? parseFloat(installmentValueStr.replace('R$', '').replace(/\./g, '').replace(',', '.').trim())
        : undefined

    await client.post('/api/invoices/transactions', {
        credit_card_id: cardId,
        description,
        amount,
        transaction_date: date,
        category_id: categoryId,
        subcategory_id: subcategoryId,
        notes,
        installments,
        start_installment: startingInstallment,
        installment_value: installmentValue
    })

    revalidatePath('/compromissos/cards/[id]', 'page')
}

export async function deleteInstallmentSeries(transactionId: string) {
    const client = await getApiClient()
    await client.delete(`/api/invoices/transactions/${transactionId}?series=true`)

    revalidatePath('/compromissos/cards/[id]', 'page')
    return { success: true }
}

export async function deleteTransaction(id: string) {
    const client = await getApiClient()
    await client.delete(`/api/invoices/transactions/${id}`)

    revalidatePath('/compromissos/cards/[id]', 'page')
    revalidatePath('/', 'layout')
}

export async function payInvoice(invoiceId: string, amount: number, accountId: string, date: string) {
    const client = await getApiClient()
    // Ensure date is in ISO format with time, as Go's time.Time binding expects a full RFC3339 string
    // If date is YYYY-MM-DD, append T00:00:00Z
    let isoDate = date
    if (date.length === 10) {
        isoDate = `${date}T00:00:00Z`
    } else {
        // Ensure it's a valid date object and convert to ISO string if needed
        try {
            isoDate = new Date(date).toISOString()
        } catch (e) {
            console.error("Invalid date format", date)
            // Fallback to original if conversion fails, though it might still error
        }
    }

    await client.post(`/api/invoices/${invoiceId}/pay`, {
        amount,
        account_id: accountId,
        date: isoDate
    })
    revalidatePath('/compromissos/cards/[id]', 'page')
}

export async function revertInvoicePayment(invoiceId: string) {
    const client = await getApiClient()
    await client.post(`/api/invoices/${invoiceId}/revert`, {})

    revalidatePath('/compromissos/cards/[id]', 'page')
    revalidatePath('/', 'layout')
}
