"use client"

import { useState } from "react"
import { BaseModal } from "@/components/ui/base-modal"
import { updatePayable, Payable } from "./actions"
import { FinancialTransactionForm, FinancialTransactionFormData } from "@/features/transactions/components/financial-transaction-form"
import { useRouter } from "next/navigation"
import { FileText } from "lucide-react"

interface EditPayableDialogProps {
    payable: Payable
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditPayableDialog({ payable, open, onOpenChange }: EditPayableDialogProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    // Preparar dados iniciais do form
    const initialData: Partial<FinancialTransactionFormData> = {
        type: 'despesa', // Payables são sempre despesas
        amount: payable.amount,
        description: payable.description,
        categoryId: payable.category_id || "",
        subcategoryId: payable.subcategory_id || "",
        paymentMethodId: payable.payment_method_id || "",
        date: new Date(payable.due_date).toISOString().split('T')[0],
    }

    async function handleSubmit(data: FinancialTransactionFormData) {
        setLoading(true)
        try {
            const formData = new FormData()
            formData.append('description', data.description)
            formData.append('amount', data.amount.toString())
            formData.append('date', data.date)

            if (data.categoryId) formData.append('categoryId', data.categoryId)
            if (data.subcategoryId) formData.append('subcategoryId', data.subcategoryId)
            if (data.paymentMethodId) formData.append('paymentMethodId', data.paymentMethodId)

            await updatePayable(payable.id, formData)

            onOpenChange(false)
            router.refresh()
        } catch (error: any) {
            throw new Error(error.message || "Erro ao atualizar conta")
        } finally {
            setLoading(false)
        }
    }

    return (
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            title={
                <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span>Editar Conta a Pagar</span>
                </div>
            }
            description="Atualize os dados desta conta prevista."
            className="max-w-[500px]"
            primaryButton={{
                label: "Salvar Alterações",
                isLoading: loading,
                form: "edit-payable-form",
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
                isLoading={loading}
                showTypeSelector={false} // Fixo em despesa
                showAccountSelector={false} // Payables não têm conta até serem pagos
                dateLabel="Vencimento"
                formId="edit-payable-form"
                hideFooter={true}
            />
        </BaseModal>
    )
}
