"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { updateTransaction } from "./actions"
import { FinancialTransactionForm, FinancialTransactionFormData } from "@/features/transactions/components/financial-transaction-form"

interface EditTransactionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    transaction: any
}

export function EditTransactionDialog({ open, onOpenChange, transaction }: EditTransactionDialogProps) {
    const [isLoading, setIsLoading] = useState(false)

    // Preparar dados iniciais do form
    const initialData: Partial<FinancialTransactionFormData> = {
        type: transaction.type as 'receita' | 'despesa' | 'transferencia',
        amount: transaction.amount,
        description: transaction.description,
        accountId: transaction.account_id,
        categoryId: transaction.category_id || "",
        subcategoryId: transaction.subcategory_id || "",
        paymentMethodId: transaction.payment_method_id || "",
        date: transaction.transaction_date ? new Date(transaction.transaction_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        selectedCardId: transaction.credit_card_id || "",
        notes: transaction.notes || "",
    }

    async function handleSubmit(data: FinancialTransactionFormData) {
        setIsLoading(true)
        try {
            const formData = new FormData()
            formData.append('description', data.description)
            formData.append('amount', data.amount.toString())
            formData.append('type', data.type)
            formData.append('date', data.date)
            formData.append('accountId', data.accountId)

            if (data.type !== 'transferencia') {
                if (data.categoryId) formData.append('categoryId', data.categoryId)
                if (data.subcategoryId) formData.append('subcategoryId', data.subcategoryId)
            }

            if (data.notes) {
                formData.append('notes', data.notes)
            }

            if (data.paymentMethodId) {
                formData.append('paymentMethodId', data.paymentMethodId)
                if (data.selectedCardId) {
                    formData.append('cardId', data.selectedCardId)
                }
            }

            await updateTransaction(transaction.id, formData)

            onOpenChange(false)
            setTimeout(() => {
                window.location.reload()
            }, 300)
        } catch (error: any) {
            throw new Error(error.message || "Erro ao atualizar transação")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        {transaction.type === 'despesa' && "Editar Despesa"}
                        {transaction.type === 'receita' && "Editar Receita"}
                        {transaction.type === 'transferencia' && "Editar Transferência"}
                    </DialogTitle>
                    <DialogDescription>
                        Atualize os dados desta movimentação financeira.
                    </DialogDescription>
                </DialogHeader>

                <FinancialTransactionForm
                    mode="edit"
                    initialData={initialData}
                    onSubmit={handleSubmit}
                    onCancel={() => onOpenChange(false)}
                    isLoading={isLoading}
                    showTypeSelector={true}
                />
            </DialogContent>
        </Dialog>
    )
}
