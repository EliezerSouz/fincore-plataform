"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CurrencyInput } from "@/components/ui/currency-input"
import { DatePicker } from "@/components/ui/date-picker"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeftRight, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { createPocketTransfer } from "@/app/(protected)/caixa/pockets/pocket-transfer-actions"

interface Pocket {
    id: string
    name: string
    pocket_type: string
    balance: number
    parent_account_id: string
}

interface TransferBetweenPocketsDialogProps {
    sourcePocket?: Pocket
    pockets: Pocket[]
    onSuccess?: () => void
    trigger?: React.ReactNode
}

export function TransferBetweenPocketsDialog({
    sourcePocket,
    pockets,
    onSuccess,
    trigger
}: TransferBetweenPocketsDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [sourcePocketId, setSourcePocketId] = useState(sourcePocket?.id || "")
    const [targetPocketId, setTargetPocketId] = useState("")
    const [amount, setAmount] = useState(0)
    const [description, setDescription] = useState("")
    const [date, setDate] = useState<Date | undefined>(new Date())

    // Filter out the source pocket from target options
    const availableTargets = pockets.filter(p => p.id !== sourcePocketId)

    // Get selected pockets for display
    const selectedSource = pockets.find(p => p.id === sourcePocketId)
    const selectedTarget = pockets.find(p => p.id === targetPocketId)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validations
        if (!sourcePocketId || !targetPocketId) {
            toast.error("Selecione os pockets de origem e destino")
            return
        }

        if (sourcePocketId === targetPocketId) {
            toast.error("Os pockets de origem e destino devem ser diferentes")
            return
        }

        if (amount <= 0) {
            toast.error("O valor deve ser maior que zero")
            return
        }

        // Check for past date (ignore time)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const isPastDate = date && date < today

        if (selectedSource && amount > selectedSource.balance && !isPastDate) {
            toast.error("Saldo insuficiente no pocket de origem")
            return
        }

        if (!date) {
            toast.error("Selecione a data da transferência")
            return
        }

        setLoading(true)

        try {
            // Using local date string to avoid timezone shifts
            const dateStr = date.toLocaleDateString('pt-BR').split('/').reverse().join('-')

            await createPocketTransfer({
                source_pocket_id: sourcePocketId,
                target_pocket_id: targetPocketId,
                amount,
                description: description || `Transferência entre pockets`,
                date: dateStr
            })

            toast.success("Transferência realizada com sucesso!")
            setOpen(false)

            // Reset form
            if (!sourcePocket) {
                setSourcePocketId("")
            }
            setTargetPocketId("")
            setAmount(0)
            setDescription("")
            setDate(new Date())

            // Call onSuccess callback and reload page
            if (onSuccess) {
                onSuccess()
            } else {
                // Fallback: reload page to show updated balances
                window.location.reload()
            }
        } catch (error) {
            console.error("Error creating transfer:", error)
            toast.error("Erro ao realizar transferência")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm">
                        <ArrowLeftRight className="w-4 h-4 mr-2" />
                        Transferir
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Transferir entre Pockets</DialogTitle>
                        <DialogDescription>
                            Mova dinheiro entre seus pockets de forma rápida e organizada.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {/* Source Pocket */}
                        <div className="space-y-2">
                            <Label htmlFor="source">Pocket de Origem</Label>
                            {sourcePocket ? (
                                <div className="p-3 border rounded-lg bg-muted/50">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{sourcePocket.name}</p>
                                            <p className="text-sm text-muted-foreground">{sourcePocket.pocket_type}</p>
                                        </div>
                                        <p className="text-sm font-medium">
                                            R$ {sourcePocket.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <Select value={sourcePocketId} onValueChange={setSourcePocketId}>
                                    <SelectTrigger id="source">
                                        <SelectValue placeholder="Selecione o pocket de origem" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {pockets.map((pocket) => (
                                            <SelectItem key={pocket.id} value={pocket.id}>
                                                {pocket.name} ({pocket.pocket_type}) - R$ {pocket.balance.toFixed(2)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        {/* Arrow Indicator */}
                        <div className="flex justify-center">
                            <ArrowLeftRight className="w-6 h-6 text-muted-foreground" />
                        </div>

                        {/* Target Pocket */}
                        <div className="space-y-2">
                            <Label htmlFor="target">Pocket de Destino</Label>
                            <Select value={targetPocketId} onValueChange={setTargetPocketId}>
                                <SelectTrigger id="target">
                                    <SelectValue placeholder="Selecione o pocket de destino" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableTargets.map((pocket) => (
                                        <SelectItem key={pocket.id} value={pocket.id}>
                                            {pocket.name} ({pocket.pocket_type}) - R$ {pocket.balance.toFixed(2)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Amount */}
                        <div className="space-y-2">
                            <Label htmlFor="amount">Valor</Label>
                            <CurrencyInput
                                id="amount"
                                value={amount}
                                onChange={setAmount}
                                placeholder="R$ 0,00"
                                required
                            />
                            {selectedSource && amount > selectedSource.balance && (
                                <p className={`text-sm ${date && date < new Date(new Date().setHours(0, 0, 0, 0)) ? 'text-amber-600' : 'text-destructive'}`}>
                                    {date && date < new Date(new Date().setHours(0, 0, 0, 0))
                                        ? "Saldo atual insuficiente, mas permitido para data retroativa (histórico)."
                                        : `Saldo insuficiente (disponível: R$ ${selectedSource.balance.toFixed(2)})`}
                                </p>
                            )}
                        </div>

                        {/* Date */}
                        <div className="space-y-2">
                            <Label>Data da Transferência</Label>
                            <DatePicker date={date} setDate={setDate} required />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Descrição (Opcional)</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Ex: Aplicação em reserva de emergência"
                                rows={2}
                            />
                        </div>

                        {/* Transfer Preview */}
                        {selectedSource && selectedTarget && amount > 0 && (
                            <div className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                                    Resumo da Transferência:
                                </p>
                                <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                                    <div className="flex justify-between">
                                        <span>{selectedSource.name}:</span>
                                        <span className="font-medium">
                                            R$ {selectedSource.balance.toFixed(2)} → R$ {(selectedSource.balance - amount).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>{selectedTarget.name}:</span>
                                        <span className="font-medium">
                                            R$ {selectedTarget.balance.toFixed(2)} → R$ {(selectedTarget.balance + amount).toFixed(2)}
                                        </span>
                                    </div>
                                    {date && date < new Date(new Date().setHours(0, 0, 0, 0)) && (
                                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 pt-2 border-t border-blue-200 dark:border-blue-800 italic">
                                            * Para lançamentos históricos (anteriores ao último ajuste de saldo), os saldos atuais acima <strong>não serão alterados</strong>.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading || !sourcePocketId || !targetPocketId || amount <= 0}>
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Transferir
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
