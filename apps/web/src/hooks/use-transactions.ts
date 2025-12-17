/**
 * useTransactions Hook
 * Hook para gerenciar transações usando o backend API
 */

'use client'

import { useState, useEffect } from 'react'
import { transactionService, type Transaction, type CreateTransactionInput, type UpdateTransactionInput, type TransactionListParams } from '@financeiro/core'

export function useTransactions(params?: TransactionListParams) {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Carregar transações
    const fetchTransactions = async () => {
        try {
            setLoading(true)
            setError(null)
            const data = await transactionService.list(params)
            setTransactions(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao carregar transações')
            console.error('Error fetching transactions:', err)
        } finally {
            setLoading(false)
        }
    }

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
    }, [params?.limit, params?.offset])

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
