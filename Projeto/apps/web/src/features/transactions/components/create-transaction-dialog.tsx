"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BaseModal } from "@/components/ui/base-modal"
import { createTransaction, createTransfer } from "@/app/(protected)/caixa/transactions/actions"
import { createTransaction as createCardTransaction } from "@/app/(protected)/compromissos/cards/actions"
import { CreateButton } from "@/components/ui/create-button"
import { FinancialTransactionForm, FinancialTransactionFormData } from "./financial-transaction-form"
import { toTransactionFormData } from "../utils/form-data"
import { ArrowRightLeft } from "lucide-react"

interface CreateTransactionDialogProps {
    onSuccess?: () => void
    initialData?: Partial<FinancialTransactionFormData>
    buttonLabel?: string
    title?: string | React.ReactNode
    showTypeSelector?: boolean
}

export function CreateTransactionDialog({ 
    onSuccess, 
    initialData, 
    buttonLabel = "Nova Transação", 
    title,
    showTypeSelector = true 
}: CreateTransactionDialogProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(data: FinancialTransactionFormData) {
        setIsLoading(true)
        try {
            const formData = toTransactionFormData(data)

            if (data.type === 'transferencia') {
                await createTransfer(formData)
            } else if (data.type === 'compra') {
                await createCardTransaction(formData)
            } else {
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
            <CreateButton label={buttonLabel} onClick={() => setOpen(true)} />

            <BaseModal
                open={open}
                onOpenChange={setOpen}
                title={title || (
                    <div className="flex items-center gap-2">
                        <ArrowRightLeft className="w-5 h-5 text-blue-600" />
                        <span>Nova Transação</span>
                    </div>
                )}
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
                    initialData={initialData}
                    onSubmit={handleSubmit}
                    onCancel={() => setOpen(false)}
                    isLoading={isLoading}
                    showTypeSelector={showTypeSelector}
                    formId="create-transaction-form"
                    hideFooter={true}
                />
            </BaseModal>
        </>
    )
}
