'use server'

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

// Helper to get API Client with token
async function getApiClient() {
    const supabase = await createClient()
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token

    if (!token) throw new Error('Unauthorized')

    // Dynamically import to use server-side
    const { ApiClient } = await import('@/lib/api-client')
    return new ApiClient(undefined, token)
}

export interface CreditCard {
    id: string,
    name: string,
    brand: string,
    last_4_digits: string,
    limit_amount: number,
    closing_day: number,
    due_day: number,
    color: string,
    available_limit?: number // Campo calculado
}

export async function getCreditCards() {
    try {
        const client = await getApiClient()
        // Backend calculates available_limit automatically
        return await client.get<CreditCard[]>('/api/cards') || []
    } catch (error) {
        console.error('Erro ao buscar cartões:', error)
        return []
    }
}

export async function getCreditCardById(id: string) {
    try {
        const client = await getApiClient()
        return await client.get<CreditCard>(`/api/cards/${id}`)
    } catch (error) {
        return null
    }
}

export async function createCreditCard(formData: FormData) {
    const client = await getApiClient()

    const name = formData.get('name') as string
    const brand = formData.get('brand') as string
    const last4 = formData.get('last_4_digits') as string
    const limitStr = formData.get('limit_amount') as string
    const closingDay = parseInt(formData.get('closing_day') as string)
    const dueDay = parseInt(formData.get('due_day') as string)
    const color = formData.get('color') as string

    // Parse do valor do limite
    const limit = parseFloat(
        limitStr
            .replace('R$', '')
            .replace(/\s/g, '')
            .replace(/\./g, '')
            .replace(',', '.')
            .trim()
    )

    if (isNaN(limit) || limit <= 0) {
        throw new Error('Valor do limite inválido')
    }

    await client.post('/api/cards', {
        name,
        brand,
        last_4_digits: last4 || null,
        limit_amount: limit,
        closing_day: closingDay,
        due_day: dueDay,
        color
    })

    // Revalidar a página de cartões especificamente
    revalidatePath('/compromissos/cards')
    revalidatePath('/compromissos/cards', 'page')

    return { success: true }
}

export async function updateCreditCard(formData: FormData) {
    const client = await getApiClient()

    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const brand = formData.get('brand') as string
    const last4 = formData.get('last_4_digits') as string
    const limitStr = formData.get('limit_amount') as string
    const closingDay = parseInt(formData.get('closing_day') as string)
    const dueDay = parseInt(formData.get('due_day') as string)
    const color = formData.get('color') as string

    // Parse do valor do limite
    const limit = parseFloat(
        limitStr
            .replace('R$', '')
            .replace(/\s/g, '')
            .replace(/\./g, '')
            .replace(',', '.')
            .trim()
    )

    if (isNaN(limit) || limit <= 0) {
        throw new Error('Valor do limite inválido')
    }

    await client.put(`/api/cards/${id}`, {
        name,
        brand,
        last_4_digits: last4 || null,
        limit_amount: limit,
        closing_day: closingDay,
        due_day: dueDay,
        color
    })

    // Revalidar a página de cartões
    revalidatePath('/compromissos/cards')
    revalidatePath('/compromissos/cards', 'page')

    return { success: true }
}

export async function deleteCreditCard(id: string) {
    const client = await getApiClient()

    // Backend handles cascade delete of transactions and invoices
    await client.delete(`/api/cards/${id}`)

    revalidatePath('/compromissos/cards')
    revalidatePath('/compromissos/cards', 'page')
}

export async function updateTransaction(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("Unauthorized")

    const id = formData.get('id') as string
    const description = formData.get('description') as string
    let amountStr = formData.get('amount') as string
    const dateStr = formData.get('transaction_date') as string

    // Limpeza robusta de valor monetário
    amountStr = amountStr.replace('R$', '').trim()

    let amount = 0
    if (amountStr.includes(',')) {
        // Se tem vírgula, é separador decimal (formato BR)
        // Remove pontos de milhar, troca vírgula por ponto
        amount = parseFloat(amountStr.replace(/\./g, '').replace(',', '.'))
    } else {
        // Se NÃO tem vírgula, assume que ponto é decimal (formato US/JS ou apenas números)
        amount = parseFloat(amountStr)
    }

    const { error } = await supabase
        .from('credit_card_transactions')
        .update({
            description,
            amount,
            transaction_date: dateStr
        })
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) {
        console.error('Erro ao atualizar transação:', error)
        throw new Error(error.message)
    }

    revalidatePath('/compromissos/cards', 'layout') // Revalida tudo relacionado a cartões
    return { success: true }
}

//Types
export interface Invoice {
    id: string
    credit_card_id: string
    reference_month: number
    reference_year: number
    closing_date: string
    due_date: string
    total_amount: number
    paid_amount: number
    status: 'open' | 'closed' | 'paid' | 'overdue' | 'partial'
}

export interface Transaction {
    id: string
    invoice_id: string
    description: string
    amount: number
    transaction_date: string
    is_installment: boolean
    installment_number?: number
    total_installments?: number
    category_id?: string
    transaction_type: 'purchase' | 'refund' | 'adjustment' | 'fee'
}

// --- INVOICES ---

export async function getCardInvoices(cardId: string) {
    const supabase = await createClient()

    // Buscar faturas ordenadas por data (mais recente primeiro)
    const { data, error } = await supabase
        .from('credit_card_invoices')
        .select('*')
        .eq('credit_card_id', cardId)
        .order('reference_year', { ascending: false })
        .order('reference_month', { ascending: false })

    if (error) {
        console.error('Error fetching invoices:', error)
        return []
    }

    return data as Invoice[]
}

export async function getNextInvoice(cardId: string, currentMonth: number, currentYear: number) {
    const supabase = await createClient()

    // Lógica para encontrar o próximo mês/ano
    let nextMonth = currentMonth + 1
    let nextYear = currentYear
    if (nextMonth > 12) {
        nextMonth = 1
        nextYear = nextYear + 1
    }

    const { data } = await supabase
        .from('credit_card_invoices')
        .select('id')
        .eq('credit_card_id', cardId)
        .eq('reference_month', nextMonth)
        .eq('reference_year', nextYear)
        .single()

    return data?.id as string | undefined
}

export async function getInvoiceDetails(invoiceId: string) {
    const supabase = await createClient()

    // Buscar detalhes da fatura + transações
    const { data: invoice, error: invoiceError } = await supabase
        .from('credit_card_invoices')
        .select(`
            *,
            credit_card:credit_cards(name, brand, color, last_4_digits)
        `)
        .eq('id', invoiceId)
        .single()

    if (invoiceError) throw new Error(invoiceError.message)

    const { data: transactions, error: transError } = await supabase
        .from('credit_card_transactions')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('transaction_date', { ascending: false })

    if (transError) throw new Error(transError.message)

    // Buscar pagamentos vinculados (Transações de Caixa)
    const { data: payments, error: payError } = await supabase
        .from('transactions') // Tabela Financeira Global
        .select('id, amount, date, description')
        .eq('credit_card_invoice_id', invoiceId)

    if (payError) console.error("Erro ao buscar pagamentos vinculados:", payError)

    // Calcular Rollover Real (Crédito vindo da anterior)
    let rolloverAmount = 0

    // Buscar fatura anterior
    const { data: currentInvData } = await supabase
        .from('credit_card_invoices')
        .select('credit_card_id, reference_month, reference_year')
        .eq('id', invoiceId)
        .single()

    if (currentInvData) {
        const { data: prevInv } = await supabase
            .from('credit_card_invoices')
            .select('id, total_amount')
            .eq('credit_card_id', currentInvData.credit_card_id)
            .or(`reference_year.lt.${currentInvData.reference_year},and(reference_year.eq.${currentInvData.reference_year},reference_month.lt.${currentInvData.reference_month})`)
            .order('reference_year', { ascending: false })
            .order('reference_month', { ascending: false })
            .limit(1)
            .single()

        if (prevInv) {
            const { data: prevTrans } = await supabase
                .from('transactions') // Transações de Pagamento (Caixa)
                .select('amount')
                .eq('credit_card_invoice_id', prevInv.id)

            const prevPaidSum = prevTrans?.reduce((sum, t) => sum + Number(t.amount), 0) || 0

            if (prevPaidSum > prevInv.total_amount) {
                rolloverAmount = prevPaidSum - prevInv.total_amount
            }
        }
    }

    return {
        invoice: invoice as Invoice & { credit_card: { name: string, brand: string, color: string } },
        transactions: transactions as Transaction[],
        payments: payments || [],
        rollover_amount: rolloverAmount
    }
}

// --- TRANSACTIONS ---

export async function createTransaction(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const cardId = formData.get('card_id') as string
    const description = formData.get('description') as string
    const amount = parseFloat((formData.get('amount') as string).replace('R$', '').replace(/\./g, '').replace(',', '.').trim())
    const date = formData.get('date') as string
    const installments = parseInt(formData.get('installments') as string || '1')
    const categoryId = formData.get('category_id') as string || null

    // Campos Retroativos
    const startingInstallment = parseInt(formData.get('startingInstallment') as string || '1')
    const installmentValueStr = formData.get('installmentValue') as string
    const installmentValue = installmentValueStr
        ? parseFloat(installmentValueStr.replace('R$', '').replace(/\./g, '').replace(',', '.').trim())
        : null

    if (installments > 1) {
        // Calcular valores para parcelas retroativas
        const actualInstallments = installments - startingInstallment + 1 // Quantas parcelas criar
        const perInstallmentAmount = installmentValue || (amount / installments) // Valor por parcela

        // Criar apenas as parcelas restantes
        for (let i = startingInstallment; i <= installments; i++) {
            // Calcular data da parcela (mês atual + offset)
            const purchaseDate = new Date(date)
            const monthOffset = i - 1
            const installmentDate = new Date(purchaseDate.getFullYear(), purchaseDate.getMonth() + monthOffset, purchaseDate.getDate())
            const installmentDateStr = installmentDate.toISOString().split('T')[0]

            // Buscar/criar fatura para esta parcela
            const { data: invoiceId, error: invoiceError } = await supabase.rpc('get_or_create_invoice', {
                p_user_id: user.id,
                p_card_id: cardId,
                p_transaction_date: installmentDateStr
            })

            if (invoiceError) throw new Error(invoiceError.message)

            // Inserir parcela
            const { error } = await supabase.from('credit_card_transactions').insert({
                user_id: user.id,
                credit_card_id: cardId,
                invoice_id: invoiceId,
                description: `${description} (${i}/${installments})`,
                amount: perInstallmentAmount,
                transaction_date: installmentDateStr,
                is_installment: true,
                installment_number: i,
                total_installments: installments,
                category_id: categoryId,
                transaction_type: 'purchase'
            })

            if (error) throw new Error(error.message)
        }
    } else {
        // Compra à vista: Buscar/Criar fatura e inserir
        const { data: invoiceId, error: invoiceError } = await supabase.rpc('get_or_create_invoice', {
            p_user_id: user.id,
            p_card_id: cardId,
            p_transaction_date: date
        })

        if (invoiceError) throw new Error(invoiceError.message)

        const { error } = await supabase.from('credit_card_transactions').insert({
            user_id: user.id,
            credit_card_id: cardId,
            invoice_id: invoiceId,
            description,
            amount,
            transaction_date: date,
            is_installment: false,
            category_id: categoryId,
            transaction_type: 'purchase'
        })

        if (error) throw new Error(error.message)
    }

    revalidatePath('/compromissos/cards/[id]', 'page')
}

export async function deleteTransaction(id: string) {
    const supabase = await createClient()

    // Tentar via Força Bruta (RPC) primeiro
    try {
        const { error: rpcError } = await supabase.rpc('force_delete_transaction', { transaction_id: id })
        if (rpcError) throw rpcError

        revalidatePath('/compromissos/cards/[id]', 'page')
        revalidatePath('/', 'layout')
        return
    } catch (e) {
        console.error('RPC falhou, tentando normal...', e)
    }

    // Fallback: Método normal
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const { error } = await supabase
        .from('credit_card_transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) {
        console.error('Erro ao excluir transação:', error)
        throw new Error(error.message)
    }

    revalidatePath('/compromissos/cards/[id]', 'page')
    revalidatePath('/', 'layout')
}

export async function payInvoice(invoiceId: string, amount: number) {
    const supabase = await createClient()
    const { error } = await supabase.rpc('pay_invoice', {
        p_invoice_id: invoiceId,
        p_amount: amount
    })
    if (error) throw new Error(error.message)
    revalidatePath('/compromissos/cards/[id]', 'page')
}

export async function revertInvoicePayment(invoiceId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    // 1. Buscar transações vinculadas à fatura via credit_card_invoice_id
    // Ordenar pela mais recente para estornar LIFO (Last In First Out)
    const { data: linkedTransactions } = await supabase
        .from('transactions')
        .select('id, description, amount, type')
        .eq('user_id', user.id)
        .eq('credit_card_invoice_id', invoiceId)
        .order('created_at', { ascending: false })
        .limit(1) // Pega apenas a última

    const client = await getApiClient()
    let reversedAmount = 0
    let transactionToDelete = null

    if (linkedTransactions && linkedTransactions.length > 0) {
        transactionToDelete = linkedTransactions[0]
    } else {
        // Fallback: busca heurística
        const { data: invoice } = await supabase
            .from('credit_card_invoices')
            .select('paid_amount, credit_card:credit_cards(name)')
            .eq('id', invoiceId)
            .single()

        if (invoice) {
            const cardName = invoice.credit_card?.name || ''
            const searchTerm = `Pagamento Fatura - ${cardName}%`

            const { data: candidateExpense } = await supabase
                .from('transactions')
                .select('id, amount, description')
                .eq('user_id', user.id)
                .eq('type', 'despesa')
                .ilike('description', searchTerm)
                // Tenta achar com valor aproximado ou apenas o último
                .order('created_at', { ascending: false })
                .limit(1)

            if (candidateExpense && candidateExpense.length > 0) {
                transactionToDelete = candidateExpense[0]
            }
        }
    }

    if (transactionToDelete) {
        console.log(`🗑️ Estornando transação específica: ${transactionToDelete.description} - R$ ${transactionToDelete.amount}`)
        try {
            // 1. Reverter saldo bancário
            await client.delete(`/api/transactions/${transactionToDelete.id}`)
            reversedAmount = Number(transactionToDelete.amount)

            // 2. Reverter saldo da fatura (Lógica de Distribuição Inteligente)
            // Antes de chamar a procedure, vamos calcular quanto desse estorno pertence a ESTA fatura

            // Buscar dados da fatura alvo
            const { data: targetInvoice } = await supabase
                .from('credit_card_invoices')
                .select('paid_amount, total_amount')
                .eq('id', invoiceId)
                .single()

            if (targetInvoice) {
                // Buscar TODAS as outras transações de pagamento vinculadas a esta fatura (EXCETO a que estamos apagando)
                const { data: otherPayments } = await supabase
                    .from('transactions')
                    .select('amount')
                    .eq('credit_card_invoice_id', invoiceId)
                    .neq('id', transactionToDelete.id) // Exclui a atual

                // Somar quanto sobra na fatura (transações REAIS vinculadas diretamente)
                const directPaidAmount = otherPayments?.reduce((sum, t) => sum + Number(t.amount), 0) || 0

                // CALCULAR ROLLOVER (CRÉDITO vindo de faturas anteriores)
                // O jeito certo: Verificar se a SOMA das transações da fatura anterior excede o total dela.
                // O paid_amount pode ter sido "clipado" ou resetado, mas as transações são imutáveis.
                let rolloverAmount = 0

                const { data: currentInvData } = await supabase
                    .from('credit_card_invoices')
                    .select('credit_card_id, reference_month, reference_year')
                    .eq('id', invoiceId)
                    .single()

                if (currentInvData) {
                    // Busca fatura anterior
                    const { data: prevInv } = await supabase
                        .from('credit_card_invoices')
                        .select('id, total_amount, reference_month')
                        .eq('credit_card_id', currentInvData.credit_card_id)
                        .or(`reference_year.lt.${currentInvData.reference_year},and(reference_year.eq.${currentInvData.reference_year},reference_month.lt.${currentInvData.reference_month})`)
                        .order('reference_year', { ascending: false })
                        .order('reference_month', { ascending: false })
                        .limit(1)
                        .single()

                    if (prevInv) {
                        // Somar transações da fatura anterior
                        const { data: prevTransactions } = await supabase
                            .from('transactions')
                            .select('amount')
                            .eq('credit_card_invoice_id', prevInv.id)
                            .eq('type', 'despesa') // Assumindo despesa positiva, ou ajustar se type for 'receita' pra pagamento? 
                        // IMPORTANTE: No createTransaction, pagamento de fatura é 'despesa' do caixa, mas aqui estamos olhando transactions?
                        // Não, createTransaction cria na tabela 'transactions' (Caixa).
                        // O vínculo é via credit_card_invoice_id.
                        // Pagamentos de fatura são DESPESAS na visão do usuário (Caixa -> Fatura).

                        const sumPrev = prevTransactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0
                        const pTotal = Number(prevInv.total_amount)

                        console.log(`🔎 Checando fatura anterior (Mês ${prevInv.reference_month}): Soma Tx ${sumPrev} / Total ${pTotal}`)

                        if (sumPrev > pTotal) {
                            rolloverAmount = sumPrev - pTotal
                            console.log(`   -> Encontrado Rollover REAL de: ${rolloverAmount}`)
                        }
                    }
                }

                // O valor que deve PERMANECER na fatura é: Pagamentos Diretos Outros + Rollover
                const remainingPaidAmount = directPaidAmount + rolloverAmount

                console.log(`🧮 Smart Revert Debug:`)
                console.log(`   - Paid Now (Banco): ${targetInvoice.paid_amount}`)
                console.log(`   - Direct Payments (Outros): ${directPaidAmount}`)
                console.log(`   - Rollover (Calculado): ${rolloverAmount}`)
                console.log(`   - TOTAL A MANTER (Goal): ${remainingPaidAmount}`)

                // Cálculos
                let amountToDeductFromThisInvoice = Number(targetInvoice.paid_amount) - remainingPaidAmount

                // Safety clamps
                if (amountToDeductFromThisInvoice < 0) amountToDeductFromThisInvoice = 0
                if (amountToDeductFromThisInvoice > reversedAmount) amountToDeductFromThisInvoice = reversedAmount

                const amountToDeductFromFuture = reversedAmount - amountToDeductFromThisInvoice

                console.log(`   => Tirar desta: ${amountToDeductFromThisInvoice}`)
                console.log(`   => Deferir para próxima: ${amountToDeductFromFuture}`)

                // 2a. Aplicar na Fatura Atual
                if (amountToDeductFromThisInvoice > 0) {
                    await supabase.rpc('decrement_invoice_paid', {
                        p_invoice_id: invoiceId,
                        p_amount: amountToDeductFromThisInvoice
                    })
                }

                // 2b. Aplicar nas Próximas
                if (amountToDeductFromFuture > 0) {
                    const { getNextInvoice } = await import("./actions")
                    const { data: refInvoice } = await supabase.from('credit_card_invoices').select('credit_card_id, reference_month, reference_year').eq('id', invoiceId).single()

                    if (refInvoice) {
                        const nextInvoiceId = await getNextInvoice(refInvoice.credit_card_id, refInvoice.reference_month, refInvoice.reference_year)
                        if (nextInvoiceId) {
                            console.log(`   -> Chamando revert recursivo na próxima fatura ${nextInvoiceId}`)
                            await supabase.rpc('revert_payment', {
                                p_invoice_id: nextInvoiceId,
                                p_amount: amountToDeductFromFuture
                            })
                        } else {
                            console.log("   -> Sem próxima fatura para estornar o resto.")
                        }
                    }
                }
            } else {
                // Fallback se não conseguir ler a fatura
                await supabase.rpc('revert_payment', {
                    p_invoice_id: invoiceId,
                    p_amount: reversedAmount
                })
            }

        } catch (e) {
            console.error(`❌ Falha ao excluir transação de estorno:`, e)
            throw e
        }
    } else {
        // Se não achou transação nenhuma, mas o usuário mandou estornar, deve ser um caso legado onde o paid_amount > 0 mas não tem transação.
        // Nesse caso, forçamos o reset da fatura para evitar travamento.
        const { data: inv } = await supabase.from('credit_card_invoices').select('paid_amount').eq('id', invoiceId).single()
        if (inv && inv.paid_amount > 0) {
            await supabase.from('credit_card_invoices').update({ paid_amount: 0, status: 'closed' }).eq('id', invoiceId)
        }
    }

    revalidatePath('/compromissos/cards/[id]', 'page')
    revalidatePath('/', 'layout')
}
