"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BaseModal } from "@/components/ui/base-modal"
import { createTransaction, createTransfer } from "@/app/(protected)/caixa/transactions/actions"
import { createTransaction as createCardTransaction } from "@/app/(protected)/compromissos/cards/actions"
import { CreateButton } from "@/components/ui/create-button"
import { FinancialTransactionForm, FinancialTransactionFormData } from "./financial-transaction-form"
import { toTransactionFormData } from "../utils/form-data"
import { ArrowRightLeft, CheckCircle2, Plus } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

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
    const [showCreateAnother, setShowCreateAnother] = useState(false)
    const [lastTransactionType, setLastTransactionType] = useState<'receita' | 'despesa' | 'transferencia' | 'compra'>('despesa')

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

            // Save the transaction type for next creation
            setLastTransactionType(data.type)

            onSuccess?.()
            setOpen(false)
            router.refresh()

            // Show "Create Another" dialog
            setShowCreateAnother(true)
        } catch (error: any) {
            throw new Error(error.message || "Erro ao criar transação")
        } finally {
            setIsLoading(false)
        }
    }

    function handleCreateAnother() {
        setShowCreateAnother(false)
        // Reopen the dialog with the same transaction type
        setOpen(true)
    }

    function handleFinish() {
        setShowCreateAnother(false)
    }

    const getTransactionTypeLabel = () => {
        switch (lastTransactionType) {
            case 'receita': return 'Receita'
            case 'despesa': return 'Despesa'
            case 'transferencia': return 'Transferência'
            case 'compra': return 'Compra no Cartão'
            default: return 'Transação'
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
                    initialData={initialData || { type: lastTransactionType }}
                    onSubmit={handleSubmit}
                    onCancel={() => setOpen(false)}
                    isLoading={isLoading}
                    showTypeSelector={showTypeSelector}
                    formId="create-transaction-form"
                    hideFooter={true}
                />
            </BaseModal>

            <AlertDialog open={showCreateAnother} onOpenChange={setShowCreateAnother}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-500" />
                            </div>
                            <div>
                                <AlertDialogTitle className="text-lg">Lançamento Criado!</AlertDialogTitle>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    {getTransactionTypeLabel()} registrada com sucesso
                                </p>
                            </div>
                        </div>
                        <AlertDialogDescription className="text-base">
                            Deseja criar outra {getTransactionTypeLabel().toLowerCase()}?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleFinish}>
                            Não, finalizar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCreateAnother}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Sim, criar outra
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
