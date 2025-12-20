"use client"

import { useFinancialSummaryQuery } from "@/hooks/queries/use-dashboard"

export function useFinancialSummary() {
    const { data, isLoading } = useFinancialSummaryQuery()

    return {
        liquidez: data?.liquidez ?? 0,
        patrimonio: data?.patrimonio ?? 0,
        compromissos: data?.compromissos ?? 0,
        isLoading
    }
}
