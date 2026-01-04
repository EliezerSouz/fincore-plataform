"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BaseModal } from "@/components/ui/base-modal"
import { updateTransaction } from "@/app/(protected)/caixa/transactions/actions"
import { updateTransaction as updateCardTransaction } from "@/app/(protected)/compromissos/cards/actions"
import { FinancialTransactionForm, FinancialTransactionFormData } from "@/features/transactions/components/financial-transaction-form"
import { toTransactionFormData } from "../utils/form-data"
import { ArrowDownCircle, ArrowUpCircle, ArrowRightLeft, CreditCard } from "lucide-react"

interface EditTransactionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    transaction: any
    isCardTransaction?: boolean
    onSuccess?: () => void
}

export function EditTransactionDialog({ open, onOpenChange, transaction, isCardTransaction, onSuccess }: EditTransactionDialogProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    // Preparar dados iniciais do form
    const initialData: Partial<FinancialTransactionFormData> = {
        type: isCardTransaction ? 'compra' : (transaction.type as 'receita' | 'despesa' | 'transferencia'),
        amount: transaction.amount,
        description: transaction.description,
        accountId: transaction.account_id,
        pocketId: transaction.pocket_id,
        targetPocketId: transaction.target_pocket_id,
        categoryId: transaction.category_id || "",
        subcategoryId: transaction.subcategory_id || "",
        paymentMethodId: transaction.payment_method_id || "",
        date: (transaction.date || transaction.transaction_date) ? new Date(transaction.date || transaction.transaction_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        selectedCardId: transaction.credit_card_id || "",
        notes: transaction.notes || "",
    }

    async function handleSubmit(data: FinancialTransactionFormData) {
        setIsLoading(true)
        try {
            // Using existingId ensures 'id' is appended to FormData, which is expected by some actions
            const formData = toTransactionFormData(data, transaction.id)

            if (isCardTransaction) {
                // Card transaction specific fields if needed
                await updateCardTransaction(formData)
            } else {
                await updateTransaction(transaction.id, formData)
            }

            onSuccess?.()
            onOpenChange(false)
            router.refresh()
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
                    {isCardTransaction ? (
                        <CreditCard className="w-5 h-5 text-orange-600" />
                    ) : (
                        <>
                            {transaction.type === 'despesa' && <ArrowDownCircle className="w-5 h-5 text-red-600" />}
                            {transaction.type === 'receita' && <ArrowUpCircle className="w-5 h-5 text-emerald-600" />}
                            {transaction.type === 'transferencia' && <ArrowRightLeft className="w-5 h-5 text-blue-600" />}
                        </>
                    )}

                    <span>
                        {isCardTransaction ? "Editar Item da Fatura" : (
                            <>
                                {transaction.type === 'despesa' && "Editar Despesa"}
                                {transaction.type === 'receita' && "Editar Receita"}
                                {transaction.type === 'transferencia' && "Editar Transferência"}
                            </>
                        )}
                    </span>
                </div>
            }
            description={isCardTransaction ? "Atualize os dados deste lançamento no cartão." : "Atualize os dados desta movimentação financeira."}
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
                showTypeSelector={!isCardTransaction}
                showAccountSelector={!isCardTransaction}
                showPaymentMethodSelector={!isCardTransaction}
                formId="edit-transaction-form"
                hideFooter={true}
            />
        </BaseModal>
    )
}
