import { apiClient } from '../api/client'

export interface Category {
    id: string
    name: string
    type: string
    color: string
    icon: string
    subcategories: any[]
    is_active?: boolean
}

export const categoryService = {
    getAll: async (type: 'receita' | 'despesa') => {
        return await apiClient.get<Category[]>(`/api/categories?type=${type}`) || []
    }
}
