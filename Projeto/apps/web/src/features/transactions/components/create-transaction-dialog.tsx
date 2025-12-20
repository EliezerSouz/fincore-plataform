"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BaseModal } from "@/components/ui/base-modal"
import { createTransaction, createTransfer } from "@/app/(protected)/caixa/transactions/actions"
import { createTransaction as createCardTransaction } from "@/app/(protected)/compromissos/cards/actions"
import { CreateButton } from "@/components/ui/create-button"
import { FinancialTransactionForm, FinancialTransactionFormData } from "./financial-transaction-form"
import { ArrowRightLeft } from "lucide-react"

interface CreateTransactionDialogProps {
    onSuccess?: () => void
}

export function CreateTransactionDialog({ onSuccess }: CreateTransactionDialogProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(data: FinancialTransactionFormData) {
        setIsLoading(true)
        try {
            const formData = new FormData()
            formData.append('description', data.description || (data.type === 'transferencia' ? 'Transferência' : ''))
            formData.append('amount', data.amount.toString())
            formData.append('type', data.type)
            formData.append('date', data.date)

            if (data.paymentMethodId) {
                formData.append('paymentMethodId', data.paymentMethodId)
            }

            if (data.notes) {
                formData.append('notes', data.notes)
            }

            if (data.type === 'transferencia') {
                formData.append('sourceAccountId', data.accountId)
                formData.append('targetAccountId', data.targetAccountId || "")
                await createTransfer(formData)
            } else if (data.type === 'compra') {
                // Fluxo de Cartão de Crédito (tabela credit_card_transactions)
                formData.append('card_id', data.selectedCardId || "")
                formData.append('installments', data.installments || "1")
                formData.append('category_id', data.categoryId || "")
                formData.append('subcategory_id', data.subcategoryId || "")

                if (data.isRetroactive) {
                    formData.append('startingInstallment', String(data.startInstallment))
                    const count = Number(data.endInstallment) - Number(data.startInstallment) + 1
                    formData.append('installmentValue', String(data.amount / count))
                }

                await createCardTransaction(formData)
            } else {
                // Fluxo Normal (Receita/Despesa no Caixa)
                formData.append('accountId', data.accountId || "")
                if (data.categoryId) formData.append('categoryId', data.categoryId)
                if (data.subcategoryId) formData.append('subcategoryId', data.subcategoryId)
                if (data.paymentMethodId) formData.append('paymentMethodId', data.paymentMethodId)

                await createTransaction(formData)
            }

            onSuccess?.()
            setOpen(false)
            router.refresh()
        } catch (error: any) {
            throw new Error(error.message || "Erro ao criar transação")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <CreateButton label="Nova Transação" onClick={() => setOpen(true)} />

            <BaseModal
                open={open}
                onOpenChange={setOpen}
                title={
                    <div className="flex items-center gap-2">
                        <ArrowRightLeft className="w-5 h-5 text-blue-600" />
                        <span>Nova Transação</span>
                    </div>
                }
                description="Registre uma nova movimentação financeira."
                className="max-w-[500px]"
                primaryButton={{
                    label: "Confirmar Lançamento",
                    isLoading: isLoading,
                    form: "create-transaction-form",
                    type: "submit"
                }}
                secondaryButton={{
                    label: "Cancelar"
                }}
            >
                <FinancialTransactionForm
                    mode="create"
                    onSubmit={handleSubmit}
                    onCancel={() => setOpen(false)}
                    isLoading={isLoading}
                    showTypeSelector={true}
                    formId="create-transaction-form"
                    hideFooter={true}
                />
            </BaseModal>
        </>
    )
}
