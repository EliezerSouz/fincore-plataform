'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AlertTriangle, TrendingUp, TrendingDown, DollarSign, CheckCircle2 } from 'lucide-react'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { convertHistoricalPeriod } from '@/app/(protected)/caixa/accounts/balance-adjustments-actions'
import type { ControlledPeriod, ConvertPeriodResult } from '@/lib/types/balance-adjustments'

interface ConvertPeriodDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    accountId: string
    accountName: string
    period: ControlledPeriod
    onSuccess?: () => void
}

export function ConvertPeriodDialog({
    open,
    onOpenChange,
    accountId,
    accountName,
    period,
    onSuccess,
}: ConvertPeriodDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [understood, setUnderstood] = useState(false)
    const [result, setResult] = useState<ConvertPeriodResult | null>(null)

    useEffect(() => {
        if (!open) {
            setUnderstood(false)
            setResult(null)
        }
    }, [open])

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value)
    }

    const formatDate = (dateStr: string) => {
        return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR })
    }

    // Calculate what would happen
    const difference = period.endDate
        ? period.calculatedEndBalance - period.startingBalance
        : 0

    const handleConvert = async () => {
        if (!period.endDate) return

        setIsSubmitting(true)
        try {
            const conversionResult = await convertHistoricalPeriod({
                account_id: accountId,
                start_date: period.startDate,
                end_date: period.endDate,
                mode: 'auto-adjust',
                create_adjustment_transaction: true,
            })

            setResult(conversionResult)

            // Auto-close after success
            setTimeout(() => {
                onSuccess?.()
                onOpenChange(false)
            }, 3000)
        } catch (error) {
            console.error('Error converting period:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (result?.success) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="h-5 w-5" />
                            Período Convertido com Sucesso!
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <Alert>
                            <AlertDescription>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span>Transações convertidas:</span>
                                        <span className="font-semibold">{result.converted_count}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Impacto total:</span>
                                        <span className={`font-semibold ${result.total_impact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(result.total_impact)}
                                        </span>
                                    </div>
                                    {result.adjustment_created && (
                                        <div className="flex justify-between">
                                            <span>Ajuste de conciliação:</span>
                                            <span className="font-semibold">
                                                {formatCurrency(Math.abs(result.difference))}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between pt-2 border-t">
                                        <span>Novo saldo calculado:</span>
                                        <span className="font-semibold text-blue-600">
                                            {formatCurrency(result.new_calculated_balance)}
                                        </span>
                                    </div>
                                </div>
                            </AlertDescription>
                        </Alert>

                        <p className="text-sm text-muted-foreground text-center">
                            Fechando automaticamente...
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Converter Período para Controlado</DialogTitle>
                    <DialogDescription>{accountName}</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium">Período</h4>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="font-mono">
                                {formatDate(period.startDate)} - {period.endDate ? formatDate(period.endDate) : 'Atual'}
                            </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Transações históricas: {period.historicalTransactionCount}
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Impacto no Saldo
                        </h4>

                        <div className="space-y-2 p-4 rounded-lg bg-muted/50">
                            <div className="flex justify-between items-center">
                                <span className="text-sm">Saldo em {formatDate(period.startDate)}:</span>
                                <span className="font-mono font-semibold">
                                    {formatCurrency(period.startingBalance)}
                                </span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-sm flex items-center gap-1">
                                    {difference >= 0 ? (
                                        <TrendingUp className="h-3 w-3 text-green-600" />
                                    ) : (
                                        <TrendingDown className="h-3 w-3 text-red-600" />
                                    )}
                                    Transações do período:
                                </span>
                                <span className={`font-mono font-semibold ${difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {difference >= 0 ? '+' : ''}{formatCurrency(difference)}
                                </span>
                            </div>

                            <Separator />

                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Saldo calculado {period.endDate ? formatDate(period.endDate) : 'atual'}:</span>
                                <span className="font-mono font-semibold text-blue-600">
                                    {formatCurrency(period.calculatedEndBalance)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            <div className="space-y-2">
                                <p className="font-semibold">ATENÇÃO:</p>
                                <p className="text-sm">
                                    Ao converter este período, o sistema irá:
                                </p>
                                <ul className="text-sm space-y-1 ml-4 list-disc">
                                    <li>Converter {period.historicalTransactionCount} transações históricas para normais</li>
                                    <li>Estas transações passarão a afetar o saldo atual da conta</li>
                                    {period.endDate && (
                                        <li>
                                            Criar uma transação de ajuste automática para conciliar com o próximo
                                            período (se houver diferença)
                                        </li>
                                    )}
                                    <li>Recalcular o saldo atual considerando todas as transações</li>
                                </ul>
                            </div>
                        </AlertDescription>
                    </Alert>

                    <div className="flex items-start space-x-2 p-4 rounded-lg border">
                        <Checkbox
                            id="understood"
                            checked={understood}
                            onCheckedChange={(checked) => setUnderstood(checked as boolean)}
                        />
                        <div className="grid gap-1.5 leading-none">
                            <Label
                                htmlFor="understood"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                                Entendo que esta ação irá alterar o saldo atual da conta
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                O sistema criará automaticamente transações de ajuste se necessário para
                                manter a consistência com períodos posteriores.
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                        className="h-11 md:h-10"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConvert}
                        disabled={!understood || isSubmitting}
                        className="h-11 md:h-10"
                    >
                        {isSubmitting ? 'Convertendo...' : 'Converter Período'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
