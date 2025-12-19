"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createTransaction } from "../actions"
import { Switch } from "@/components/ui/switch"
import { useRouter } from "next/navigation"
import { CreateButton } from "@/components/ui/create-button"
import { usePermission } from "@/hooks/use-permission"
import { usePrimaryCard } from "@/hooks/use-primary-card"
import { Lock } from "lucide-react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { FinancialTransactionForm, FinancialTransactionFormData } from "@/features/transactions/components/financial-transaction-form"

export function TransactionForm({ cardId, cardName }: { cardId: string, cardName: string }) {
    const router = useRouter()
    const { can } = usePermission()
    const { primaryCardId } = usePrimaryCard()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    async function handleFormSubmit(data: FinancialTransactionFormData) {
        setLoading(true)
        try {
            const formData = new FormData()
            formData.append('description', data.description)
            formData.append('amount', data.amount.toString())
            formData.append('date', data.date)
            formData.append('categoryId', data.categoryId || "")
            formData.append('subcategoryId', data.subcategoryId || "")
            formData.append('card_id', cardId)

            if (data.isRetroactive) {
                formData.append('installments', data.installments || "1")
                formData.append('startingInstallment', String(data.startInstallment))
                formData.append('installmentValue', String(data.amount / (Number(data.endInstallment) - Number(data.startInstallment) + 1)))
            } else {
                formData.append('installments', data.installments || "1")
            }

            await createTransaction(formData)
            setOpen(false)
            window.location.reload()
        } catch (e: any) {
            alert(e.message || 'Erro ao criar transação')
        } finally {
            setLoading(false)
        }
    }

    const isLocked = !can('unlimited_cards') && cardId !== primaryCardId
    if (isLocked) return null

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <CreateButton label="Nova Despesa" />
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="text-xl font-bold">Nova Despesa - {cardName}</DialogTitle>
                </DialogHeader>

                <div className="p-6 pt-4">
                    <FinancialTransactionForm
                        mode="create"
                        onSubmit={handleFormSubmit}
                        onCancel={() => setOpen(false)}
                        isLoading={loading}
                        showTypeSelector={false}
                        showAccountSelector={false}
                        showPaymentMethodSelector={false}
                        initialData={{
                            type: 'compra',
                            selectedCardId: cardId // Já passa o cardId para evitar seleção redundante
                        }}
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}
