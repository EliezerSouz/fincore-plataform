"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { updateTransaction, Transaction } from "../actions"
import { FinancialTransactionForm, FinancialTransactionFormData } from "@/features/transactions/components/financial-transaction-form"

interface EditTransactionDialogProps {
    transaction: Transaction
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function EditTransactionDialog({ transaction, open, onOpenChange, onSuccess }: EditTransactionDialogProps) {
    const [isLoading, setIsLoading] = useState(false)

    // Preparar dados iniciais do form
    const initialData: Partial<FinancialTransactionFormData> = {
        type: 'despesa', // Itens de fatura são sempre despesas
        amount: transaction.amount,
        description: transaction.description,
        categoryId: transaction.category_id || "",
        subcategoryId: transaction.subcategory_id || "",
        notes: transaction.notes || "",
        date: new Date(transaction.transaction_date).toISOString().split('T')[0],
    }

    async function handleSubmit(data: FinancialTransactionFormData) {
        setIsLoading(true)
        try {
            const formData = new FormData()
            formData.append('id', transaction.id)
            formData.append('amount', data.amount.toString())
            formData.append('description', data.description)
            formData.append('transaction_date', data.date)
            formData.append('notes', data.notes || "")

            if (data.categoryId) {
                formData.append('category_id', data.categoryId)
            }
            if (data.subcategoryId) {
                formData.append('subcategory_id', data.subcategoryId)
            }

            await updateTransaction(formData)

            onSuccess()
            onOpenChange(false)
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
                        Editar Item da Fatura
                    </DialogTitle>
                    <DialogDescription>
                        Atualize os dados deste lançamento no cartão.
                    </DialogDescription>
                </DialogHeader>

                <FinancialTransactionForm
                    mode="edit"
                    initialData={initialData}
                    onSubmit={handleSubmit}
                    onCancel={() => onOpenChange(false)}
                    isLoading={isLoading}
                    showTypeSelector={false} // Fixo em despesa
                    showAccountSelector={false} // Cartão de crédito não usa "Conta" de saída imediata aqui
                    showPaymentMethodSelector={false} // O método é o próprio cartão
                />
            </DialogContent>
        </Dialog>
    )
}
