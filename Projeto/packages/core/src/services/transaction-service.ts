/**
 * Transaction Service
 * Serviço para gerenciar transações via API Backend
 */

import { apiClient } from '../api/client'

export interface Transaction {
    id: string
    user_id: string
    account_id: string
    category_id?: string
    subcategory_id?: string
    payment_method_id?: string
    invoice_id?: string
    payable_id?: string
    description: string
    amount: number
    type: 'receita' | 'despesa'
    date: string
    created_at: string
    updated_at: string
}

export interface CreateTransactionInput {
    account_id: string
    category_id?: string
    subcategory_id?: string
    payment_method_id?: string
    description: string
    amount: number
    type: 'receita' | 'despesa'
    date: string
}

export interface UpdateTransactionInput {
    account_id?: string
    category_id?: string
    subcategory_id?: string
    payment_method_id?: string
    description?: string
    amount?: number
    type?: 'receita' | 'despesa'
    date?: string
}

export interface TransactionListParams {
    limit?: number
    offset?: number
}

export const transactionService = {
    /**
     * Listar transações com paginação
     */
    async list(params?: TransactionListParams): Promise<Transaction[]> {
        const queryParams = new URLSearchParams()
        if (params?.limit) queryParams.append('limit', params.limit.toString())
        if (params?.offset) queryParams.append('offset', params.offset.toString())

        const query = queryParams.toString()
        const endpoint = query ? `/api/transactions?${query}` : '/api/transactions'

        return apiClient.get<Transaction[]>(endpoint)
    },

    /**
     * Buscar uma transação por ID
     */
    async getById(id: string): Promise<Transaction> {
        return apiClient.get<Transaction>(`/api/transactions/${id}`)
    },

    /**
     * Criar nova transação
     * O backend atualiza o saldo automaticamente
     */
    async create(data: CreateTransactionInput): Promise<Transaction> {
        return apiClient.post<Transaction>('/api/transactions', data)
    },

    /**
     * Atualizar transação existente
     * O backend recalcula o saldo automaticamente
     */
    async update(id: string, data: UpdateTransactionInput): Promise<Transaction> {
        return apiClient.put<Transaction>(`/api/transactions/${id}`, data)
    },

    /**
     * Deletar transação
     * O backend reverte o saldo automaticamente
     */
    async delete(id: string): Promise<{ message: string }> {
        return apiClient.delete(`/api/transactions/${id}`)
    },
}
