/**
 * useAccounts Hook
 * Hook para gerenciar contas usando o backend API
 */

'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api-client'

export interface Account {
    id: string
    name: string
    type: string
    balance: number
    color?: string
    is_active?: boolean
    yield_rate?: number
    last_yield_date?: string
    yield_today?: number
    yield_month?: number
}

export interface CreateAccountInput {
    name: string
    type: string
    balance: number
    color?: string
    is_active?: boolean
}

export interface UpdateAccountInput {
    name?: string
    type?: string
    balance?: number
    color?: string
    is_active?: boolean
}

export function useAccounts(params?: { includeInactive?: boolean, enabled?: boolean }) {
    const [accounts, setAccounts] = useState<Account[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Carregar contas
    const fetchAccounts = async () => {
        try {
            setLoading(true)
            setError(null)
            // Use local apiClient for better control and consistency with useTransactions
            const query = new URLSearchParams()
            if (params?.includeInactive) query.append('include_inactive', 'true')
            const qStr = query.toString() ? `?${query.toString()}` : ''

            const data = await apiClient.get<Account[]>(`/api/accounts${qStr}`)
            setAccounts(data || [])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao carregar contas')
            console.error('Error fetching accounts:', err)
        } finally {
            setLoading(false)
        }
    }

    // Criar conta
    const createAccount = async (input: CreateAccountInput) => {
        try {
            const newAccount = await apiClient.post<Account>('/api/accounts', input)
            setAccounts(prev => [newAccount, ...prev])
            return newAccount
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao criar conta'
            setError(errorMessage)
            throw new Error(errorMessage)
        }
    }

    // Atualizar conta
    const updateAccount = async (id: string, input: UpdateAccountInput) => {
        try {
            const updatedAccount = await apiClient.put<Account>(`/api/accounts/${id}`, input)
            setAccounts(prev =>
                prev.map(acc => (acc.id === id ? updatedAccount : acc))
            )
            return updatedAccount
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar conta'
            setError(errorMessage)
            throw new Error(errorMessage)
        }
    }

    // Deletar conta
    const deleteAccount = async (id: string) => {
        try {
            await apiClient.delete(`/api/accounts/${id}`)
            setAccounts(prev => prev.filter(acc => acc.id !== id))
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar conta'
            setError(errorMessage)
            throw new Error(errorMessage)
        }
    }

    // Carregar contas ao montar o componente
    useEffect(() => {
        if (params?.enabled !== false) {
            fetchAccounts()
        }
    }, [params?.includeInactive, params?.enabled])

    return {
        accounts,
        loading,
        error,
        refresh: fetchAccounts,
        createAccount,
        updateAccount,
        deleteAccount,
    }
}
