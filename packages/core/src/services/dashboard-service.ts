import { apiClient } from '../api/client'

export interface FinancialSummary {
    liquidez: number
    patrimonio: number
    compromissos: number
}

export const dashboardService = {
    getSummary: async () => {
        return await apiClient.get<FinancialSummary>('/api/dashboard/summary')
    }
}
