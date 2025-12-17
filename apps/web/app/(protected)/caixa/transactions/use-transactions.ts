import { useState, useEffect, useCallback, useRef } from 'react'
import { apiClient } from '@/lib/api-client'
import { TransactionFilters } from './actions'

interface Transaction {
    id: string
    description: string
    amount: number
    type: 'receita' | 'despesa'
    date: string
    category?: {
        name: string
        icon?: string
        color?: string
    }
    account?: {
        name: string
        type: string
    }
    // Adicione outros campos conforme necessidade
    [key: string]: any
}

export function useTransactions(filters: TransactionFilters) {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Ref para o AbortController
    const abortControllerRef = useRef<AbortController | null>(null)

    const fetchTransactions = useCallback(async () => {
        // Cancelar requisição anterior se existir
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }

        const controller = new AbortController()
        abortControllerRef.current = controller

        setLoading(true)
        setError(null)

        try {
            const params = new URLSearchParams()
            if (filters.limit) params.append('limit', filters.limit.toString())
            else params.append('limit', '25')

            if (filters.offset) params.append('offset', filters.offset.toString())

            if (filters.accountId && filters.accountId !== 'all') {
                params.append('account_id', filters.accountId)
            }
            if (filters.categoryId && filters.categoryId !== 'all') {
                params.append('category_id', filters.categoryId)
            }
            if (filters.type && filters.type !== 'all') {
                params.append('type', filters.type)
            }
            if (filters.from) {
                params.append('from', filters.from)
            }
            if (filters.to) {
                params.append('to', filters.to)
            }
            else if (filters.month && filters.year) {
                const date = new Date(parseInt(filters.year), parseInt(filters.month) + 1, 0)
                const startDate = `${filters.year}-${(parseInt(filters.month) + 1).toString().padStart(2, '0')}-01`
                const endDate = `${filters.year}-${(parseInt(filters.month) + 1).toString().padStart(2, '0')}-${date.getDate()}`

                params.append('from', startDate)
                params.append('to', endDate)
            }

            // Passar signal para o client
            const data = await apiClient.get<Transaction[]>(`/api/transactions?${params.toString()}`, {
                signal: controller.signal
            } as any) // Cast as any temporário se ApiClient type não estiver atualizado, mas fetch aceita

            if (!controller.signal.aborted) {
                setTransactions(data || [])
            }
        } catch (err: any) {
            // Ignorar erro de abort
            if (err.name === 'AbortError' || err?.message === 'Aborted') {
                return
            }
            console.error(err)
            setError('Erro ao carregar transações')
        } finally {
            // Apenas tira loading se não foi abortado (para não piscar se tiver outra req vindo)
            if (abortControllerRef.current === controller && !controller.signal.aborted) {
                setLoading(false)
            }
        }
    }, [filters])

    // Carregar ao montar ou mudar filtros
    useEffect(() => {
        fetchTransactions()

        // Cleanup function ao desmontar ou rechamar
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
        }
    }, [fetchTransactions])

    return {
        transactions,
        loading,
        error,
        refetch: fetchTransactions
    }
}
