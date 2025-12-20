/**
 * API Client Configuration
 * Generic HTTP Client for Web and Mobile
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export interface ApiError {
    error: string
    details?: any
}

// Token provider function type
export type TokenProvider = () => Promise<string | null>;

export class ApiClient {
    private baseUrl: string
    private tokenProvider?: TokenProvider
    private staticToken?: string | null

    constructor(baseUrl: string = API_BASE_URL, token?: string | null) {
        this.baseUrl = baseUrl
        this.staticToken = token
    }

    /**
     * Configure a dynamic token provider (e.g., getting from Supabase session)
     */
    setTokenProvider(provider: TokenProvider) {
        this.tokenProvider = provider;
    }

    private async getToken(): Promise<string | null> {
        if (this.staticToken) return this.staticToken;
        if (this.tokenProvider) return this.tokenProvider();
        return null;
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
