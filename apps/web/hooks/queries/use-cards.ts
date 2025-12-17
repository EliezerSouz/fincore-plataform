import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { cardService } from '@financeiro/core'

export function useCardsQuery() {
    return useQuery({
        queryKey: queryKeys.cards.all,
        queryFn: () => cardService.getAll(),
    })
}
