import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { apiClient } from '@/lib/api-client'

type TransactionFilters = {
    accountId?: string
    categoryId?: string
    type?: string
    from?: string
    to?: string
    month?: string
    year?: string
    limit?: number
    offset?: number
}

export function useTransactionsQuery(filters: TransactionFilters = {}) {
    return useQuery({
        queryKey: queryKeys.transactions.list(filters),
        queryFn: async () => {
            const searchParams = new URLSearchParams()
            if (filters.limit) searchParams.append('limit', filters.limit.toString())
            if (filters.offset) searchParams.append('offset', filters.offset.toString())
            if (filters.accountId && filters.accountId !== 'all') searchParams.append('account_id', filters.accountId)
            if (filters.categoryId && filters.categoryId !== 'all') searchParams.append('category_id', filters.categoryId)
            if (filters.type && filters.type !== 'all') searchParams.append('type', filters.type)
            if (filters.from) searchParams.append('from', filters.from)
            if (filters.to) searchParams.append('to', filters.to)
            
            if (!filters.from && !filters.to && filters.month && filters.year) {
                 const date = new Date(parseInt(filters.year), parseInt(filters.month) + 1, 0)
                 const startDate = `${filters.year}-${(parseInt(filters.month) + 1).toString().padStart(2, '0')}-01`
                 const endDate = `${filters.year}-${(parseInt(filters.month) + 1).toString().padStart(2, '0')}-${date.getDate()}`
                 searchParams.append('from', startDate)
                 searchParams.append('to', endDate)
            }

            return apiClient.get(`/api/transactions?${searchParams.toString()}`)
        },
    })
}
