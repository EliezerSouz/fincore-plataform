import { apiClient } from "@/lib/api-client"

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
}

export interface Transaction {
    id: string
    description: string
    amount: number
    type: TransactionType
    date: string
    category_id?: string
    subcategory_id?: string
    account_id: string
    payment_method_id?: string
    invoice_id?: string
    credit_card_invoice_id?: string
    is_paid?: boolean
    subcategory?: { id: string; name: string; category_id: string }
    payment_method?: { name: string }
}

export const transactionService = {
    getAll: async (filters?: TransactionFilters) => {
        const params = new URLSearchParams()
        const limit = filters?.limit ? filters.limit.toString() : '100'
        params.append('limit', limit)

        if (filters) {
            if (filters.accountId && filters.accountId !== 'all') params.append('account_id', filters.accountId)
            if (filters.categoryId && filters.categoryId !== 'all') params.append('category_id', filters.categoryId)
            if (filters.type && filters.type !== 'all') params.append('type', filters.type)

            if (filters.from) params.append('from', filters.from)
            if (filters.to) params.append('to', filters.to)
            else if (filters.month && filters.year) {
                const date = new Date(parseInt(filters.year), parseInt(filters.month) + 1, 0)
                const startDate = `${filters.year}-${(parseInt(filters.month) + 1).toString().padStart(2, '0')}-01`
                const endDate = `${filters.year}-${(parseInt(filters.month) + 1).toString().padStart(2, '0')}-${date.getDate()}`
                params.append('from', startDate)
                params.append('to', endDate)
            }
        }

        return await apiClient.get<Transaction[]>(`/api/transactions?${params.toString()}`)
    }
}
