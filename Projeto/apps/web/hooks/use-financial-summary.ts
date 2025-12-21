"use client"

import { useFinancialSummaryQuery } from "@/hooks/queries/use-dashboard"

export function useFinancialSummary() {
    const { data, isLoading, refetch } = useFinancialSummaryQuery()

    return {
        liquidez: data?.liquidez ?? 0,
        patrimonio: data?.patrimonio ?? 0,
        compromissos: data?.compromissos ?? 0,
        payablesTotal: data?.payables_total ?? 0,
        invoicesTotal: data?.invoices_total ?? 0,
        receitaMensal: data?.receita_mensal ?? 0,
        despesaMensal: data?.despesa_mensal ?? 0,
        history: data?.history ?? [],
        topCategories: data?.top_categories ?? [],
        invoices: data?.invoices ?? [],
        totalBalance: data?.total_balance ?? 0,
        availableForCalculations: data?.available_for_calculations ?? 0,
        healthStatus: data?.health_status ?? 'Estável',
        score: data?.score ?? 0,
        runway: data?.runway ?? 0,
        isLoading,
        refetch
    }
}
