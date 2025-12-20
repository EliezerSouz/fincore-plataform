import { apiClient } from "@/lib/api-client"

export interface Account {
    id: string
    name: string
    type: string
    balance: number
    color?: string
    is_active?: boolean
}

export const accountService = {
    getAll: async (activeOnly = false) => {
        const accounts = await apiClient.get<Account[]>('/api/accounts') || []
        if (activeOnly) {
            return accounts.filter(acc => acc.is_active !== false)
        }
        return accounts
    }
}
