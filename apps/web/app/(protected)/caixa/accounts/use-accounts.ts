import { useState, useEffect, useCallback, useRef } from 'react'
import { apiClient } from '@/lib/api-client'
import { getPaymentMethods } from '@/app/(protected)/caixa/transactions/actions'

export interface Account {
    id: string
    name: string
    balance: number
    type: string
    bank?: string
    color?: string
    is_active?: boolean
    // ... outros campos
}

export function useAccounts() {
    const [accounts, setAccounts] = useState<Account[]>([])
    const [paymentMethods, setPaymentMethods] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const abortControllerRef = useRef<AbortController | null>(null)

    const fetchData = useCallback(async () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }

        const controller = new AbortController()
        abortControllerRef.current = controller

        setLoading(true)
        try {
            const [accs, methods] = await Promise.all([
                apiClient.get<Account[]>('/api/accounts', { signal: controller.signal }),
                getPaymentMethods()
            ])

            if (!controller.signal.aborted) {
                setAccounts(accs || [])
                setPaymentMethods(methods || [])
            }
        } catch (error: any) {
            if (error.name === 'AbortError') return
            console.error("Failed to fetch accounts", error)
        } finally {
            if (abortControllerRef.current === controller && !controller.signal.aborted) {
                setLoading(false)
            }
        }
    }, [])

    useEffect(() => {
        fetchData()
        return () => {
            if (abortControllerRef.current) abortControllerRef.current.abort()
        }
    }, [fetchData])

    return { accounts, paymentMethods, loading, refetch: fetchData }
}
