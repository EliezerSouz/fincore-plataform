"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatCurrency } from "@/lib/utils"
import { Loader2, ArrowRightLeft, CreditCard } from "lucide-react"

export interface PaymentData {
    amount: number
    date: string
    accountId: string
    paymentMethodId: string
}

interface UnifiedPaymentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description?: string
    defaultAmount: number
    defaultDate?: string
    sourceAccounts: any[]
    paymentMethods: any[]
    onConfirm: (data: PaymentData) => Promise<void>
    icon?: React.ElementType
    maxAmount?: number // Opcional: limite máximo
    surplusThreshold?: number // Valor a partir do qual é considerado excedente
}

export function UnifiedPaymentDialog({
    open,
    onOpenChange,
    title,
    description = "Realize o pagamento debitando de uma conta do caixa.",
    defaultAmount,
    defaultDate = new Date().toISOString().split('T')[0],
    sourceAccounts,
    paymentMethods,
    onConfirm,
    icon: Icon = CreditCard,
    maxAmount,
    surplusThreshold
}: UnifiedPaymentDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [amount, setAmount] = useState<string>(defaultAmount.toFixed(2))
    const [sourceAccountId, setSourceAccountId] = useState<string>('')
    const [paymentMethodId, setPaymentMethodId] = useState<string>('')
    const [date, setDate] = useState(defaultDate)

    const relevantSourceAccounts = sourceAccounts.filter(a =>
        ['corrente', 'digital', 'carteira', 'poupanca', 'poupança'].includes(a.type?.toLowerCase())
    )

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!sourceAccountId || !amount || parseFloat(amount) <= 0 || !paymentMethodId) {
            alert("Preencha todos os campos corretamente (Conta, Forma de Pagamento e Valor).")
            return
        }

        setIsLoading(true)
        try {
            await onConfirm({
                amount: parseFloat(amount),
                date,
                accountId: sourceAccountId,
                paymentMethodId
            })
            onOpenChange(false)
        } catch (error: any) {
            console.error(error)
            alert("Erro ao realizar pagamento: " + (error.message || "Erro desconhecido"))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-blue-600" />
                        {title}
                    </DialogTitle>
                    {description && (
                        <DialogDescription>{description}</DialogDescription>
                    )}
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Valor do Pagamento</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">R$</span>
                            <Input
                                type="number"
                                step="0.01"
                                className="pl-10 text-lg font-bold"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                placeholder="0,00"
                                required
                            />
                        </div>
                        {surplusThreshold && parseFloat(amount) > surplusThreshold && (
                            <div className="mt-2 p-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded text-xs text-emerald-700 dark:text-emerald-400 flex items-start gap-2">
                                <span className="mt-0.5">✨</span>
                                <div>
                                    <span className="font-bold">Pagamento Excedente:</span> R$ {(parseFloat(amount) - surplusThreshold).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} entrará como crédito na próxima fatura.
                                </div>
                            </div>
                        )}
                        {!surplusThreshold && (
                            <p className="text-xs text-muted-foreground">
                                💡 Você pode editar o valor para fazer um pagamento parcial ou excedente
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Debitada da Conta (Origem)</Label>
                        <Select value={sourceAccountId} onValueChange={setSourceAccountId} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione a conta de origem..." />
                            </SelectTrigger>
                            <SelectContent>
                                {relevantSourceAccounts.length === 0 ? (
                                    <SelectItem value="disabled" disabled>Nenhuma conta disponível</SelectItem>
                                ) : (
                                    relevantSourceAccounts.map(acc => (
                                        <SelectItem key={acc.id} value={acc.id}>
                                            {acc.name} ({formatCurrency(acc.balance)})
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Forma de Pagamento</Label>
                        <Select value={paymentMethodId} onValueChange={setPaymentMethodId} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o método..." />
                            </SelectTrigger>
                            <SelectContent>
                                {paymentMethods.length === 0 ? (
                                    <SelectItem value="disabled" disabled>Nenhum método cadastrado</SelectItem>
                                ) : (
                                    paymentMethods.map((method: any) => (
                                        <SelectItem key={method.id} value={method.id}>
                                            {method.name}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Data do Pagamento</Label>
                        <Input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            required
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isLoading} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightLeft className="h-4 w-4" />}
                            Confirmar Pagamento
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
