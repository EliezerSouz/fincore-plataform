import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { apiClient } from '@/lib/api-client'

export function useCardsQuery() {
    return useQuery({
        queryKey: queryKeys.cards.all,
        queryFn: () => apiClient.get('/api/cards'),
    })
}
