"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateTransaction } from "../actions"
import { Transaction } from "../actions"

interface EditTransactionDialogProps {
    transaction: Transaction
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function EditTransactionDialog({ transaction, open, onOpenChange, onSuccess }: EditTransactionDialogProps) {
    const [loading, setLoading] = useState(false)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)

        try {
            const formData = new FormData(event.currentTarget)
            formData.append('id', transaction.id)

            await updateTransaction(formData)

            onSuccess()
            onOpenChange(false)
        } catch (e: any) {
            console.error('Erro ao editar transação:', e)
            alert(e.message || 'Erro ao editar transação.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Editar Transação</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-desc">Descrição</Label>
                        <Input
                            id="edit-desc"
                            name="description"
                            defaultValue={transaction.description}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-amount">Valor (R$)</Label>
                            <Input
                                id="edit-amount"
                                name="amount"
                                defaultValue={transaction.amount.toString().replace('.', ',')}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-date">Data</Label>
                            <Input
                                id="edit-date"
                                name="transaction_date"
                                type="date"
                                defaultValue={new Date(transaction.transaction_date).toISOString().split('T')[0]}
                                required
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
