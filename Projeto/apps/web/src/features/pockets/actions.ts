"use server"

import { revalidatePath } from "next/cache"
import { ApiClient } from "@/lib/api-client"
import { createClient } from '@/utils/supabase/server'
import {
    ParentAccount,
    Pocket,
    CreateParentAccountInput,
    CreatePocketInput
} from "@/types/pockets"

// Helper para obter cliente autenticado
async function getAuthenticatedClient() {
    const supabase = await createClient()
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token

    if (!token) {
        throw new Error("missing authorization header")
    }

    // Instanciar novo cliente com o token
    return new ApiClient(undefined, token)
}

// ============================================================================
// PARENT ACCOUNTS
// ============================================================================

export async function getParentAccounts(includeInactive = false): Promise<ParentAccount[]> {
    try {
        const client = await getAuthenticatedClient()
        const response = await client.get<ParentAccount[]>(
            `/api/parent-accounts?include_inactive=${includeInactive}`
        )
        return response || []
    } catch (error) {
        console.error("Error fetching parent accounts:", error)
        return []
    }
}

export async function getParentAccountWithPockets(id: string): Promise<ParentAccount | null> {
    try {
        const client = await getAuthenticatedClient()
        return await client.get<ParentAccount>(`/api/parent-accounts/${id}/with-pockets`)
    } catch (error) {
        console.error(`Error fetching parent account ${id}:`, error)
        return null
    }
}

export async function createParentAccount(data: CreateParentAccountInput): Promise<ParentAccount> {
    try {
        const client = await getAuthenticatedClient()
        const response = await client.post<ParentAccount>("/api/parent-accounts", data)
        revalidatePath("/caixa/accounts")
        return response
    } catch (error) {
        console.error("Error creating parent account:", error)
        throw error
    }
}

export async function updateParentAccount(id: string, data: Partial<CreateParentAccountInput>): Promise<ParentAccount> {
    try {
        const client = await getAuthenticatedClient()
        const response = await client.put<ParentAccount>(`/api/parent-accounts/${id}`, data)
        revalidatePath("/caixa/accounts")
        return response
    } catch (error) {
        console.error(`Error updating parent account ${id}:`, error)
        throw error
    }
}

export async function deleteParentAccount(id: string): Promise<void> {
    try {
        const client = await getAuthenticatedClient()
        await client.delete(`/api/parent-accounts/${id}`)
        revalidatePath("/caixa/accounts")
    } catch (error) {
        console.error(`Error deleting parent account ${id}:`, error)
        throw error
    }
}

// ============================================================================
// POCKETS
// ============================================================================

export async function getPockets(includeInactive = false): Promise<Pocket[]> {
    try {
        const client = await getAuthenticatedClient()
        const response = await client.get<Pocket[]>(
            `/api/pockets?include_inactive=${includeInactive}`
        )
        return response || []
    } catch (error) {
        console.error("Error fetching pockets:", error)
        return []
    }
}

export async function createPocket(data: CreatePocketInput): Promise<Pocket> {
    try {
        const client = await getAuthenticatedClient()
        const response = await client.post<Pocket>("/api/pockets", data)
        revalidatePath("/caixa/accounts")
        // Revalidar também a tela de detalhes se estivermos nela
        revalidatePath(`/caixa/accounts/${data.parent_account_id}`)
        return response
    } catch (error) {
        console.error("Error creating pocket:", error)
        throw error
    }
}

export async function updatePocket(id: string, data: Partial<CreatePocketInput>): Promise<Pocket> {
    try {
        const client = await getAuthenticatedClient()
        const response = await client.put<Pocket>(`/api/pockets/${id}`, data)
        revalidatePath("/caixa/accounts")
        return response
    } catch (error) {
        console.error(`Error updating pocket ${id}:`, error)
        throw error
    }
}

export async function deletePocket(id: string): Promise<void> {
    try {
        const client = await getAuthenticatedClient()
        await client.delete(`/api/pockets/${id}`)
        revalidatePath("/caixa/accounts")
    } catch (error) {
        console.error(`Error deleting pocket ${id}:`, error)
        throw error
    }
}

export async function recalculatePocketBalance(id: string): Promise<number> {
    try {
        const client = await getAuthenticatedClient()
        const response = await client.post<{ balance: number }>(`/api/pockets/${id}/recalculate-balance`, {})
        revalidatePath("/caixa/accounts")
        return response.balance
    } catch (error) {
        console.error(`Error recalculating pocket balance ${id}:`, error)
        throw error
    }
}
