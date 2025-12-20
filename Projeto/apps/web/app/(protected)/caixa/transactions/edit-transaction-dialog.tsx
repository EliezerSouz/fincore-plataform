"use client"

import { useState } from "react"
import { BaseModal } from "@/components/ui/base-modal"
import { updateTransaction } from "./actions"
import { FinancialTransactionForm, FinancialTransactionFormData } from "@/features/transactions/components/financial-transaction-form"
import { ArrowDownCircle, ArrowUpCircle, ArrowRightLeft } from "lucide-react"

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
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            title={
                <div className="flex items-center gap-2">
                    {transaction.type === 'despesa' && <ArrowDownCircle className="w-5 h-5 text-red-600" />}
                    {transaction.type === 'receita' && <ArrowUpCircle className="w-5 h-5 text-emerald-600" />}
                    {transaction.type === 'transferencia' && <ArrowRightLeft className="w-5 h-5 text-blue-600" />}

                    <span>
                        {transaction.type === 'despesa' && "Editar Despesa"}
                        {transaction.type === 'receita' && "Editar Receita"}
                        {transaction.type === 'transferencia' && "Editar Transferência"}
                    </span>
                </div>
            }
            description="Atualize os dados desta movimentação financeira."
            className="max-w-[500px]"
            primaryButton={{
                label: "Salvar Alterações",
                isLoading: isLoading,
                form: "edit-transaction-form",
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
                showTypeSelector={true}
                formId="edit-transaction-form"
                hideFooter={true}
            />
        </BaseModal>
    )
}
