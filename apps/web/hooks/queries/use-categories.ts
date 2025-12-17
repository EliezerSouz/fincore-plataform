import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { categoryService } from '@financeiro/core'

export function useCategoriesQuery(type: 'receita' | 'despesa') {
    return useQuery({
        queryKey: queryKeys.categories.list(type),
        queryFn: () => categoryService.getAll(type),
    })
}
