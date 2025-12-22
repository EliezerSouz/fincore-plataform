'use server'

import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"

// Helper to get API Client with token
async function getApiClient() {
    const supabase = await createClient()
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token

    if (!token) throw new Error('Unauthorized')

    // Dynamically import to use server-side
    const { ApiClient } = await import('@/lib/api-client')
    return new ApiClient(undefined, token)
}

export interface Category {
    id: string
    name: string
    type: string
    color: string
    icon: string
    subcategories: any[]
    is_active?: boolean
    is_system?: boolean
    is_premium?: boolean
}

export async function getCategories(type: 'receita' | 'despesa') {
    try {
        const client = await getApiClient()
        const categories = await client.get<Category[]>(`/api/categories?type=${type}`)
        return categories || []
    } catch (error) {
        console.error("Error fetching categories:", error)
        return []
    }
}

export async function updateCategoryDetails(formData: FormData) {
    const client = await getApiClient()
    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const type = formData.get('type') as string
    const color = formData.get('color') as string
    const icon = formData.get('icon') as string

    await client.put(`/api/categories/${id}`, {
        name,
        type,
        color,
        icon
    })

    revalidatePath('/', 'layout')
}

export async function createCategory(formData: FormData) {
    const client = await getApiClient()

    const name = formData.get('name') as string
    const type = formData.get('type') as string
    const color = formData.get('color') as string
    const icon = formData.get('icon') as string

    const res = await client.post('/api/categories', {
        name,
        type,
        color,
        icon
    })

    revalidatePath('/', 'layout')
    return res
}

export async function deleteCategory(id: string) {
    const client = await getApiClient()
    await client.delete(`/api/categories/${id}`)
    revalidatePath('/', 'layout')
}

export async function createSubcategory(formData: FormData) {
    const client = await getApiClient()

    const name = formData.get('name') as string
    const categoryId = formData.get('categoryId') as string

    const res = await client.post('/api/subcategories', {
        name,
        category_id: categoryId
    })

    revalidatePath('/', 'layout')
    return res
}

export async function deleteSubcategory(id: string) {
    const client = await getApiClient()
    await client.delete(`/api/subcategories/${id}`)
    revalidatePath('/', 'layout')
}

export async function updateCategory(formData: FormData) {
    const client = await getApiClient()
    const id = formData.get('id') as string
    const is_active = formData.get('is_active') === 'true'

    await client.put(`/api/categories/${id}`, {
        is_active
    })

    revalidatePath('/', 'layout')
}

export async function updateSubcategory(formData: FormData) {
    const client = await getApiClient()
    const id = formData.get('id') as string
    const is_active = formData.get('is_active') === 'true'

    await client.put(`/api/subcategories/${id}`, {
        is_active
    })

    revalidatePath('/', 'layout')
}

// Helper para garantir categoria padrão de Faturas
export async function getOrCreateInvoiceCategory() {
    // This helper logic checks for a specific category. 
    // We can list categories via API and find it.

    try {
        const categories = await getCategories('despesa')
        
        // Try to find existing category (Singular or Plural)
        // Normalizes to lowercase for comparison to be safe
        const existing = categories.find(c => {
            const name = c.name.toLowerCase().trim()
            return name === 'pagamento de fatura' || name === 'pagamento de faturas' || name === 'faturas'
        })

        if (existing) return existing.id

        // Create if not exists (Default to Singular)
        const client = await getApiClient()
        const newCat = await client.post<Category>('/api/categories', {
            name: 'Pagamento de Fatura',
            type: 'despesa',
            color: '#8b5cf6', // Roxo
            icon: 'credit-card'
        })

        return newCat.id
    } catch (error) {
        console.error("Erro ao criar categoria padrao:", error)
        // If it fails, return undefined so the transaction is created without category (or handle upstream)
        // But throwing allows the UI to show an error or fallback.
        // Let's return null and handle it.
        return undefined
    }
}
