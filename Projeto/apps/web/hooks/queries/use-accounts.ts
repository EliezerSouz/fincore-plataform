import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { apiClient } from '@/lib/api-client'

export function useAccountsQuery(activeOnly = false) {
    return useQuery({
        queryKey: queryKeys.accounts.list(),
        queryFn: () => apiClient.get('/api/accounts'),
        select: (data: any) => activeOnly ? data.filter((acc: any) => acc.is_active !== false) : data
    })
}
