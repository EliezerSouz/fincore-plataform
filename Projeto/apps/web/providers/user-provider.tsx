"use client"

import * as React from "react"
import { createContext, useContext, useEffect, useState } from "react"

interface UserData {
    id: string
    name: string
    email: string
    phone: string | null
    initials: string
    plan: string
    planLabel: string
    // "free" | "premium" | "premium_ia"
    status: string
    statusLabel: string
    isInTrial: boolean
    trialDaysRemaining: number
    isPremium: boolean
    needsPayment: boolean
    subscriptionStartDate: string | null
    subscriptionEndDate: string | null
    tempAccessExpiresAt: string | null
    nextBillingDate: string | null
    createdAt: string | null
    avatarUrl: string | null
}

interface UserContextType {
    user: UserData | null
    isLoading: boolean
    error: string | null
    refreshUser: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchingRef = React.useRef(false)

    const fetchUser = React.useCallback(async (retryCount = 0) => {
        if (fetchingRef.current && retryCount === 0) return

        try {
            fetchingRef.current = true
            // Só ativa loading no primeiro try se não tiver user (evita flash em revalidação)
            if (retryCount === 0 && !user) setIsLoading(true)

            const res = await fetch('/api/user')

            if (res.status === 401) {
                console.warn('Sessão expirada ou inválida (sem usuário). Forçando logout...')

                // 1. Limpar estado local
                setUser(null)
                setIsLoading(false)
                fetchingRef.current = false

                // 2. Limpar sessão do Supabase (Client-Side) para remover cookies
                // Isso evita que o Middleware jogue o usuário de volta pro Dashboard
                const { createClient } = await import('@/utils/supabase/client')
                const supabase = createClient()
                await supabase.auth.signOut()

                // 3. Redirecionar para Login se não estiver em página pública
                if (typeof window !== 'undefined') {
                    const path = window.location.pathname
                    const isPublicPage = path === '/login' || path === '/signup' || path === '/'

                    if (!isPublicPage) {
                        window.location.href = '/login'
                    }
                }
                return
            }

            if (!res.ok) {
                throw new Error(`Failed to fetch user: ${res.status}`)
            }

            const data = await res.json()
            if (data.error) {
                setError(data.error)
            } else {
                setUser(data)
                setError(null)
            }
            setIsLoading(false)

        } catch (err) {
            console.error(`Error fetching user (Attempt ${retryCount + 1}/3):`, err)

            if (retryCount < 2) {
                const timeout = 1000 * Math.pow(2, retryCount) // 1s, 2s
                setTimeout(() => fetchUser(retryCount + 1), timeout)
            } else {
                setError('Erro de conexão. Verifique sua internet.')
                setIsLoading(false)
            }
        } finally {
            // Sempre libera o ref ao terminar (sucesso ou erro final)
            if (retryCount >= 2 || !error) {
                fetchingRef.current = false
            }
        }
    }, []) // Sem dependências para evitar loop infinito

    useEffect(() => {
        fetchUser()
    }, [fetchUser])

    const contextValue = React.useMemo(() => ({
        user,
        isLoading,
        error,
        refreshUser: () => fetchUser(0)
    }), [user, isLoading, error, fetchUser])

    return (
        <UserContext.Provider value={contextValue}>
            {children}
        </UserContext.Provider>
    )
}

export function useUser() {
    const context = useContext(UserContext)
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider')
    }
    return context
}
