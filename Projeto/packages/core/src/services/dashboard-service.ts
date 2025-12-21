import { apiClient } from '../api/client'

export interface CategorySpending {
  name: string
  value: number
  percent: number
  color: string
  icon: string
}

export interface MonthlyHistory {
    name: string
    receita: number
    despesa: number
    saldo: number
}

export interface InvoiceAlert {
  card_id: string
  card_name: string
  card_last4: string
  amount: number
  due_date: string
  status: 'overdue' | 'due_today' | 'due_soon' | 'open'
  days_remaining: number
}

export interface FinancialSummary {
  liquidez: number
  patrimonio: number
  compromissos: number
  receita_mensal: number
  despesa_mensal: number
  history: MonthlyHistory[]
  top_categories: CategorySpending[]
  invoices: InvoiceAlert[]
}

export const dashboardService = {
    getSummary: async () => {
        return await apiClient.get<FinancialSummary>('/api/dashboard/summary')
    }
}
