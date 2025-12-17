import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { getFinancialSummary } from "@/app/(protected)/summary-actions"
import { type FinancialSummary } from "@financeiro/core"

export function useFinancialSummaryQuery(initialData?: FinancialSummary) {
    return useQuery({
        queryKey: queryKeys.dashboard.summary(),
        queryFn: getFinancialSummary,
        initialData
    })
}
