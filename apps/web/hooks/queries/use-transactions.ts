import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { transactionService } from '@financeiro/core'

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
        queryFn: () => transactionService.list(filters),
    })
}
