"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { updatePayable, Payable } from "./actions"
import { FinancialTransactionForm, FinancialTransactionFormData } from "@/features/transactions/components/financial-transaction-form"
import { useRouter } from "next/navigation"

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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        Editar Conta a Pagar
                    </DialogTitle>
                    <DialogDescription>
                        Atualize os dados desta conta prevista.
                    </DialogDescription>
                </DialogHeader>

                <FinancialTransactionForm
                    mode="edit"
                    initialData={initialData}
                    onSubmit={handleSubmit}
                    onCancel={() => onOpenChange(false)}
                    isLoading={loading}
                    showTypeSelector={false} // Fixo em despesa
                    showAccountSelector={false} // Payables não têm conta até serem pagos
                    dateLabel="Vencimento"
                />
            </DialogContent>
        </Dialog>
    )
}
