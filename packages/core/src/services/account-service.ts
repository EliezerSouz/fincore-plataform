/**
 * Account Service
 * Serviço para gerenciar contas via API Backend
 */

import { apiClient } from '../api/client'

export interface Account {
    id: string
    user_id: string
    name: string
    type: string
    balance: number
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface CreateAccountInput {
    name: string
    type: string
    balance?: number
}

export interface UpdateAccountInput {
    name?: string
    type?: string
    balance?: number
    is_active?: boolean
}

export const accountService = {
    /**
     * Listar todas as contas do usuário
     */
    async list(): Promise<Account[]> {
        return apiClient.get<Account[]>('/api/accounts')
    },

    /**
     * Buscar uma conta por ID
     */
    async getById(id: string): Promise<Account> {
        return apiClient.get<Account>(`/api/accounts/${id}`)
    },

    /**
     * Criar nova conta
     */
    async create(data: CreateAccountInput): Promise<Account> {
        return apiClient.post<Account>('/api/accounts', data)
    },

    /**
     * Atualizar conta existente
     */
    async update(id: string, data: UpdateAccountInput): Promise<Account> {
        return apiClient.put<Account>(`/api/accounts/${id}`, data)
    },

    /**
     * Deletar conta (soft delete)
     */
    async delete(id: string): Promise<{ message: string }> {
        return apiClient.delete(`/api/accounts/${id}`)
    },
}
