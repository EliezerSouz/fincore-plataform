'use server'

// TODO: MIGRATE TO BACKEND API
// This file currently uses direct Supabase calls for payment methods.
// Should be migrated to use /api/payment-methods endpoint (needs to be created in backend)
// Priority: Medium - Payment methods are not frequently modified

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export interface PaymentMethod {
    id: string
    name: string
    slug: string
    icon?: string

    // Flags de Contexto
    allows_income: boolean
    allows_expense: boolean
    allows_transfer?: boolean
    affects_credit_card?: boolean
    affects_invoice?: boolean
    is_internal?: boolean

    // Flags de Comportamento
    affects_balance?: boolean
    requires_bank_account?: boolean

    // Status
    is_active: boolean
    created_at?: string
}

export async function getPaymentMethods() {
    try {
        const supabase = await createClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError) {
            console.error('Erro ao obter usuário:', userError)
            return []
        }

        if (!user) {
            console.log('Usuário não autenticado')
            return []
        }

        console.log('Buscando payment_methods para user:', user.id)

        const { data, error } = await supabase
            .from('payment_methods')
            .select('*')
            .eq('user_id', user.id)
            .order('name')

        if (error) {
            console.error('Erro detalhado ao buscar payment_methods:', {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint
            })

            // Se for erro de permissão, retornar array vazio ao invés de throw
            if (error.code === '42501') {
                console.error('ERRO DE PERMISSÃO: Verifique as policies RLS da tabela payment_methods')
                return []
            }

            throw error
        }

        console.log('Payment methods encontrados:', data?.length || 0)
        return data || []
    } catch (e: any) {
        console.error('Erro ao carregar métodos de pagamento:', e)
        return []
    }
}

export async function createPaymentMethod(formData: FormData) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Usuário não autenticado')

        const name = formData.get('name') as string
        const slug = formData.get('slug') as string

        // Flags de Contexto
        const allows_income = formData.get('allows_income') === 'true'
        const allows_expense = formData.get('allows_expense') === 'true'
        const allows_transfer = formData.get('allows_transfer') === 'true'
        const affects_credit_card = formData.get('affects_credit_card') === 'true'
        const affects_invoice = formData.get('affects_invoice') === 'true'
        const is_internal = formData.get('is_internal') === 'true'

        // Flags de Comportamento
        const affects_balance = formData.get('affects_balance') === 'true'
        const requires_bank_account = formData.get('requires_bank_account') === 'true'

        if (!name || !slug) {
            throw new Error('Nome e slug são obrigatórios')
        }

        console.log('Criando payment_method:', { name, slug, user_id: user.id })

        const { data, error } = await supabase
            .from('payment_methods')
            .insert({
                user_id: user.id,
                name,
                slug,
                allows_income,
                allows_expense,
                allows_transfer,
                affects_credit_card,
                affects_invoice,
                is_internal,
                affects_balance,
                requires_bank_account,
                is_active: true
            })
            .select()
            .single()

        if (error) {
            console.error('Erro ao criar payment_method:', error)
            throw new Error(`Erro ao criar: ${error.message}`)
        }

        console.log('Payment method criado com sucesso:', data)

        revalidatePath('/sistema/payment-methods')
        revalidatePath('/', 'layout')

        return { success: true, data }
    } catch (error: any) {
        console.error('Erro na função createPaymentMethod:', error)
        throw error
    }
}

export async function updatePaymentMethod(id: string, formData: FormData) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Usuário não autenticado')

        const name = formData.get('name') as string
        const slug = formData.get('slug') as string

        // Flags de Contexto
        const allows_income = formData.get('allows_income') === 'true'
        const allows_expense = formData.get('allows_expense') === 'true'
        const allows_transfer = formData.get('allows_transfer') === 'true'
        const affects_credit_card = formData.get('affects_credit_card') === 'true'
        const affects_invoice = formData.get('affects_invoice') === 'true'
        const is_internal = formData.get('is_internal') === 'true'

        // Flags de Comportamento
        const affects_balance = formData.get('affects_balance') === 'true'
        const requires_bank_account = formData.get('requires_bank_account') === 'true'

        // Status
        const is_active = formData.get('is_active') === 'true'

        console.log('Atualizando payment_method:', { id, name, user_id: user.id })

        const { data, error } = await supabase
            .from('payment_methods')
            .update({
                name,
                slug,
                allows_income,
                allows_expense,
                allows_transfer,
                affects_credit_card,
                affects_invoice,
                is_internal,
                affects_balance,
                requires_bank_account,
                is_active
            })
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single()

        if (error) {
            console.error('Erro ao atualizar payment_method:', error)
            throw new Error(`Erro ao atualizar: ${error.message}`)
        }

        console.log('Payment method atualizado com sucesso:', data)

        revalidatePath('/sistema/payment-methods')
        revalidatePath('/', 'layout')

        return { success: true, data }
    } catch (error: any) {
        console.error('Erro na função updatePaymentMethod:', error)
        throw error
    }
}

export async function deletePaymentMethod(id: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Usuário não autenticado')

        console.log('Deletando payment_method:', { id, user_id: user.id })

        const { error } = await supabase
            .from('payment_methods')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)

        if (error) {
            console.error('Erro ao deletar payment_method:', error)
            throw new Error(`Erro ao deletar: ${error.message}`)
        }

        console.log('Payment method deletado com sucesso')

        revalidatePath('/sistema/payment-methods')
        revalidatePath('/', 'layout')

        return { success: true }
    } catch (error: any) {
        console.error('Erro na função deletePaymentMethod:', error)
        throw error
    }
}
