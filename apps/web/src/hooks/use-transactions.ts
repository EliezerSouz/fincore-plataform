/**
 * useTransactions Hook
 * Hook para gerenciar transações usando o backend API
 */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { transactionService, type Transaction, type CreateTransactionInput, type UpdateTransactionInput, type TransactionListParams } from '@financeiro/core'
import { apiClient } from '@/lib/api-client'

export interface ExtendedTransactionListParams extends TransactionListParams {
    accountId?: string
    categoryId?: string
    type?: string
    from?: string
    to?: string
    month?: string
    year?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
}

export function useTransactions(params?: ExtendedTransactionListParams) {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const abortControllerRef = useRef<AbortController | null>(null)

    // Carregar transações
    const fetchTransactions = useCallback(async () => {
        // Cancel previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }

        const controller = new AbortController()
        abortControllerRef.current = controller

        try {
            setLoading(true)
            setError(null)

            const searchParams = new URLSearchParams()

            if (params) {
                if (params.limit) searchParams.append('limit', params.limit.toString())
                if (params.offset) searchParams.append('offset', params.offset.toString())
                if (params.accountId && params.accountId !== 'all') searchParams.append('account_id', params.accountId)
                if (params.categoryId && params.categoryId !== 'all') searchParams.append('category_id', params.categoryId)
                if (params.type && params.type !== 'all') searchParams.append('type', params.type)

                if (params.sortBy) searchParams.append('sort_by', params.sortBy)
                if (params.sortOrder) searchParams.append('sort_order', params.sortOrder)

                // Date filters
                if (params.from) searchParams.append('from', params.from)
                if (params.to) searchParams.append('to', params.to)

                // Legacy month/year support if needed
                if (!params.from && !params.to && params.month && params.year) {
                    const date = new Date(parseInt(params.year), parseInt(params.month) + 1, 0)
                    const startDate = `${params.year}-${(parseInt(params.month) + 1).toString().padStart(2, '0')}-01`
                    const endDate = `${params.year}-${(parseInt(params.month) + 1).toString().padStart(2, '0')}-${date.getDate()}`
                    searchParams.append('from', startDate)
                    searchParams.append('to', endDate)
                }
            } else {
                searchParams.append('limit', '25')
            }

            console.log('Fetching transactions with:', searchParams.toString())

            // Use local apiClient to ensure no-cache and correct params
            const data = await apiClient.get<Transaction[]>(`/api/transactions?${searchParams.toString()}`, {
                signal: controller.signal
            } as any)

            if (!controller.signal.aborted) {
                setTransactions(data || [])
            }
        } catch (err: any) {
            if (err.name === 'AbortError') return

            setError(err instanceof Error ? err.message : 'Erro ao carregar transações')
            console.error('Error fetching transactions:', err)
        } finally {
            if (abortControllerRef.current === controller && !controller.signal.aborted) {
                setLoading(false)
            }
        }
    }, [params])

    // Criar transação
    const createTransaction = async (input: CreateTransactionInput) => {
        try {
            const newTransaction = await transactionService.create(input)
            setTransactions(prev => [newTransaction, ...prev])
            return newTransaction
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao criar transação'
            setError(errorMessage)
            throw new Error(errorMessage)
        }
    }

    // Atualizar transação
    const updateTransaction = async (id: string, input: UpdateTransactionInput) => {
        try {
            const updatedTransaction = await transactionService.update(id, input)
            setTransactions(prev =>
                prev.map(tx => (tx.id === id ? updatedTransaction : tx))
            )
            return updatedTransaction
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar transação'
            setError(errorMessage)
            throw new Error(errorMessage)
        }
    }

    // Deletar transação
    const deleteTransaction = async (id: string) => {
        try {
            await transactionService.delete(id)
            setTransactions(prev => prev.filter(tx => tx.id !== id))
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar transação'
            setError(errorMessage)
            throw new Error(errorMessage)
        }
    }

    // Carregar transações ao montar o componente
    useEffect(() => {
        fetchTransactions()
        return () => {
            abortControllerRef.current?.abort()
        }
    }, [fetchTransactions])

    return {
        transactions,
        loading,
        error,
        refresh: fetchTransactions,
        createTransaction,
        updateTransaction,
        deleteTransaction,
    }
}
