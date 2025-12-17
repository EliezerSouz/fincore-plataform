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

export function TransactionForm({ cardId, cardName }: { cardId: string, cardName: string }) {
    const router = useRouter()
    const { can } = usePermission()
    const { primaryCardId } = usePrimaryCard()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [isInstallment, setIsInstallment] = useState(false)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)

        try {
            const formData = new FormData(event.currentTarget)
            formData.append('card_id', cardId)

            await createTransaction(formData)
            setOpen(false)

            // Recarregar a página completamente para atualizar os dados
            window.location.reload()
        } catch (e: any) {
            alert(e.message || 'Erro ao criar transação')
        } finally {
            setLoading(false)
        }
    }

    const isLocked = !can('unlimited_cards') && cardId !== primaryCardId

    // Default to today
    const today = new Date().toISOString().split('T')[0]

    // Se o cartão está bloqueado, não renderiza o botão
    if (isLocked) {
        return null
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <CreateButton label="Nova Despesa" />
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Nova Despesa - {cardName}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="description">Descrição</Label>
                        <Input id="description" name="description" placeholder="Ex: Supermercado" required autoFocus />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Valor (R$)</Label>
                            <Input id="amount" name="amount" placeholder="0,00" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="date">Data da Compra</Label>
                            <Input id="date" name="date" type="date" defaultValue={today} required />
                        </div>
                    </div>

                    <div className="flex items-center justify-between border p-3 rounded-lg">
                        <Label htmlFor="installment-mode" className="cursor-pointer">Parcelado?</Label>
                        <Switch
                            id="installment-mode"
                            checked={isInstallment}
                            onCheckedChange={setIsInstallment}
                        />
                    </div>

                    {isInstallment && (
                        <div className="space-y-3 animate-in slide-in-from-top-2">
                            <div className="space-y-2">
                                <Label htmlFor="installments">Número de Parcelas</Label>
                                <Input
                                    id="installments"
                                    name="installments"
                                    type="number"
                                    min="2"
                                    max="36"
                                    defaultValue="2"
                                    required
                                />
                            </div>

                            {/* Campos Retroativos */}
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-900/20 space-y-3">
                                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 text-sm font-medium">
                                    <span>📅</span>
                                    <span>Lançamento Retroativo (Opcional)</span>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="startingInstallment" className="text-xs">Começar da Parcela</Label>
                                        <Input
                                            id="startingInstallment"
                                            name="startingInstallment"
                                            type="number"
                                            min="1"
                                            defaultValue="1"
                                            placeholder="1"
                                            className="h-9 text-xs"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="installmentValue" className="text-xs">Valor por Parcela</Label>
                                        <Input
                                            id="installmentValue"
                                            name="installmentValue"
                                            placeholder="Auto"
                                            className="h-9 text-xs"
                                        />
                                    </div>
                                </div>

                                <p className="text-[10px] text-muted-foreground">
                                    💡 <strong>Exemplo:</strong> Compra de R$ 600 em 6x. Já pagou 3 faturas?
                                    Comece da parcela 4 e informe R$ 100 por parcela. Serão criadas apenas as parcelas 4, 5 e 6.
                                </p>
                            </div>

                            <p className="text-xs text-muted-foreground">
                                As parcelas serão criadas automaticamente nas próximas faturas.
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? 'Salvando...' : 'Adicionar Despesa'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
