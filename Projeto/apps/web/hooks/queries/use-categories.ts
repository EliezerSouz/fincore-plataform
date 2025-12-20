import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { apiClient } from '@/lib/api-client'

export function useCategoriesQuery(type: 'receita' | 'despesa') {
    return useQuery({
        queryKey: queryKeys.categories.list(type),
        queryFn: () => apiClient.get(`/api/categories?type=${type}`),
    })
}
