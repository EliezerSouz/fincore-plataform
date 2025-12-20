import { apiClient } from '../api/client'

export interface CreditCard {
    id: string
    name: string
    brand: string
    last_4_digits: string
    limit_amount: number
    closing_day: number
    due_day: number
    color: string
    available_limit?: number
}

export const cardService = {
    getAll: async () => {
        return await apiClient.get<CreditCard[]>('/api/cards') || []
    },
    getById: async (id: string) => {
        return await apiClient.get<CreditCard>(`/api/cards/${id}`)
    }
}
