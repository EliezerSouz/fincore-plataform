import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { accountService } from '@financeiro/core'

export function useAccountsQuery(activeOnly = false) {
    return useQuery({
        queryKey: queryKeys.accounts.list(),
        queryFn: () => accountService.list(), // method is list(), not getAll()
        select: (data) => activeOnly ? data.filter((acc: any) => acc.is_active !== false) : data
    })
}
