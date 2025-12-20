'use client'

import { useEffect, useState } from 'react'
import { PaymentMethod, TransactionContext, CONTEXT_RULES } from '@/types/payment-method'
import { getPaymentMethods } from '@/app/(protected)/caixa/transactions/actions'

/**
 * Hook Central para Gerenciamento de Formas de Pagamento
 * 
 * REGRA DE OURO:
 * Este hook é a ÚNICA fonte de verdade para filtrar métodos de pagamento.
 * Nenhuma tela deve implementar lógica própria de filtragem.
 */
export function usePaymentMethods(context: TransactionContext) {
    const [allMethods, setAllMethods] = useState<PaymentMethod[]>([])
    const [validMethods, setValidMethods] = useState<PaymentMethod[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        loadMethods()
    }, [])

    useEffect(() => {
        if (allMethods.length > 0) {
            filterMethodsByContext()
        }
    }, [context, allMethods])

    async function loadMethods() {
        try {
            setLoading(true)
            const methods = await getPaymentMethods()
            setAllMethods(methods as PaymentMethod[])
        } catch (err) {
            setError('Erro ao carregar formas de pagamento')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    function filterMethodsByContext() {
        const rule = CONTEXT_RULES[context]
        if (!rule) {
            console.error(`Contexto inválido: ${context}`)
            setValidMethods([])
            return
        }

        const filtered = allMethods.filter(rule)
        setValidMethods(filtered)
    }

    /**
     * Valida se um método específico é válido para o contexto atual
     */
    function isMethodValid(methodId: string): boolean {
        return validMethods.some(m => m.id === methodId)
    }

    /**
     * Retorna o motivo pelo qual um método não está disponível
     */
    function getUnavailableReason(methodId: string): string | null {
        const method = allMethods.find(m => m.id === methodId)
        if (!method) return 'Método não encontrado'
        if (!method.is_active) return 'Método desativado'

        switch (context) {
            case 'INCOME':
                if (!method.allows_income) return 'Não permitido para receitas'
                break
            case 'EXPENSE':
                if (!method.allows_expense) return 'Não permitido para despesas'
                break
            case 'TRANSFER':
                if (!method.allows_transfer) return 'Não permitido para transferências'
                break
            case 'CREDIT_CARD_PAYMENT':
            case 'INVOICE_PAYMENT':
                if (!method.affects_credit_card && !method.affects_invoice) {
                    return 'Não permitido para pagamento de fatura'
                }
                break
            case 'INTERNAL_MOVEMENT':
                if (!method.is_internal) return 'Não é um movimento interno'
                break
        }

        return null
    }

    /**
     * Retorna avisos especiais sobre o método
     */
    function getMethodWarnings(methodId: string): string[] {
        const method = allMethods.find(m => m.id === methodId)
        if (!method) return []

        const warnings: string[] = []

        if (!method.affects_balance) {
            warnings.push('Este pagamento não altera o saldo da conta')
        }

        if (method.is_internal) {
            warnings.push('Movimento interno - não afeta resultado financeiro')
        }

        if (method.affects_invoice) {
            warnings.push('Valor será direcionado para fatura de cartão')
        }

        return warnings
    }

    return {
        allMethods,
        validMethods,
        loading,
        error,
        isMethodValid,
        getUnavailableReason,
        getMethodWarnings,
        reload: loadMethods,
    }
}
