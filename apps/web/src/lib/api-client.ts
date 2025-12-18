/**
 * API Client Configuration
 * Cliente HTTP para comunicação com o backend Golang
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export interface ApiError {
    error: string
    details?: any
}

export class ApiClient {
    private baseUrl: string
    private getToken: () => Promise<string | null>
    private staticToken?: string | null

    constructor(baseUrl: string = API_BASE_URL, token?: string | null) {
        this.baseUrl = baseUrl
        this.staticToken = token
        this.getToken = async () => {
            // Se um token foi passado no construtor, use-o (para server actions)
            if (this.staticToken !== undefined) {
                return this.staticToken
            }

            // Obter token do Supabase (para client-side)
            if (typeof window !== 'undefined') {
                const { createClient } = await import('@/utils/supabase/client')
                const supabase = createClient()
                const { data } = await supabase.auth.getSession()
                return data.session?.access_token || null
            }
            return null
        }
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const token = await this.getToken()

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string> || {}),
        }

        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers,
            cache: 'no-store',
        })

        if (!response.ok) {
            const error: ApiError = await response.json().catch(() => ({
                error: `HTTP ${response.status}: ${response.statusText}`,
            }))
            throw new Error(error.error)
        }

        return response.json()
    }

    async get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        return this.request<T>(endpoint, { method: 'GET', ...options })
    }

    async post<T>(endpoint: string, data: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        })
    }

    async put<T>(endpoint: string, data: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        })
    }

    async delete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE' })
    }
}

export const apiClient = new ApiClient()
