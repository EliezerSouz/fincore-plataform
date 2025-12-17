/**
 * useAccounts Hook
 * Hook para gerenciar contas usando o backend API
 */

'use client'

import { useState, useEffect } from 'react'
import { accountService, type Account, type CreateAccountInput, type UpdateAccountInput } from '@financeiro/core'

export function useAccounts() {
    const [accounts, setAccounts] = useState<Account[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Carregar contas
    const fetchAccounts = async () => {
        try {
            setLoading(true)
            setError(null)
            const data = await accountService.list()
            setAccounts(data)
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
            const newAccount = await accountService.create(input)
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
            const updatedAccount = await accountService.update(id, input)
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
            await accountService.delete(id)
            setAccounts(prev => prev.filter(acc => acc.id !== id))
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar conta'
            setError(errorMessage)
            throw new Error(errorMessage)
        }
    }

    // Carregar contas ao montar o componente
    useEffect(() => {
        fetchAccounts()
    }, [])

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
