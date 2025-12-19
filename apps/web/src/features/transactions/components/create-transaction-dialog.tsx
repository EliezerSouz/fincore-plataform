"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { createTransaction, createTransfer } from "@/app/(protected)/caixa/transactions/actions"
import { CreateButton } from "@/components/ui/create-button"
import { FinancialTransactionForm, FinancialTransactionFormData } from "./financial-transaction-form"

interface CreateTransactionDialogProps {
    onSuccess?: () => void
}

export function CreateTransactionDialog({ onSuccess }: CreateTransactionDialogProps) {
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

            if (data.type === 'transferencia') {
                formData.append('sourceAccountId', data.accountId)
                formData.append('targetAccountId', data.targetAccountId || "")
                await createTransfer(formData)
            } else {
                formData.append('accountId', data.accountId)
                if (data.categoryId) formData.append('categoryId', data.categoryId)
                if (data.subcategoryId) formData.append('subcategoryId', data.subcategoryId)

                // Lógica de Cartão de Crédito
                if (data.selectedCardId) {
                    formData.append('cardId', data.selectedCardId)
                    formData.append('installments', data.installments || "1")
                }

                await createTransaction(formData)
            }

            onSuccess?.()
            setOpen(false)
            setTimeout(() => {
                window.location.reload()
            }, 300)
        } catch (error: any) {
            throw new Error(error.message || "Erro ao criar transação")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <CreateButton label="Nova Transação" />
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        Nova Transação
                    </DialogTitle>
                    <DialogDescription>
                        Registre uma nova movimentação financeira.
                    </DialogDescription>
                </DialogHeader>

                <FinancialTransactionForm
                    mode="create"
                    onSubmit={handleSubmit}
                    onCancel={() => setOpen(false)}
                    isLoading={isLoading}
                    showTypeSelector={true}
                />
            </DialogContent>
        </Dialog>
    )
}
