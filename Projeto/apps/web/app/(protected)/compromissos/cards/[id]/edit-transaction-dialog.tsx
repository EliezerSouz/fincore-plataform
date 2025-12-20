"use client"

import { useState } from "react"
import { BaseModal } from "@/components/ui/base-modal"
import { updateTransaction, Transaction } from "../actions"
import { FinancialTransactionForm, FinancialTransactionFormData } from "@/features/transactions/components/financial-transaction-form"
import { CreditCard } from "lucide-react"

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
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            title={
                <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-orange-600" />
                    <span>Editar Item da Fatura</span>
                </div>
            }
            description="Atualize os dados deste lançamento no cartão."
            className="max-w-[500px]"
            primaryButton={{
                label: "Salvar Alterações",
                isLoading: isLoading,
                form: "edit-card-transaction-form",
                type: "submit"
            }}
            secondaryButton={{
                label: "Cancelar",
                onClick: () => onOpenChange(false)
            }}
        >
            <FinancialTransactionForm
                mode="edit"
                initialData={initialData}
                onSubmit={handleSubmit}
                onCancel={() => onOpenChange(false)}
                isLoading={isLoading}
                showTypeSelector={false} // Fixo em despesa
                showAccountSelector={false} // Cartão de crédito não usa "Conta" de saída imediata aqui
                showPaymentMethodSelector={false} // O método é o próprio cartão
                formId="edit-card-transaction-form"
                hideFooter={true}
            />
        </BaseModal>
    )
}
