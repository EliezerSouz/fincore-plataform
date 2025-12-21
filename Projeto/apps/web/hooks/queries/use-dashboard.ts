import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { getFinancialSummary, type FinancialSummary } from "@/app/(protected)/summary-actions"

export function useFinancialSummaryQuery(initialData?: FinancialSummary) {
    return useQuery({
        queryKey: queryKeys.dashboard.summary(),
        queryFn: getFinancialSummary,
        initialData,
        staleTime: 0, // Always refetch on mount to ensure fresh data
        refetchOnMount: true,
        refetchOnWindowFocus: true // Update when switching tabs
    })
}
