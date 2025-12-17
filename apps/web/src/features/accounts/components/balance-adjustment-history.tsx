'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
    Calendar,
    CheckCircle2,
    PauseCircle,
    TrendingUp,
    Edit,
    Trash2,
    RefreshCw,
} from 'lucide-react'

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { BalanceAdjustmentDialog } from './balance-adjustment-dialog'
import { ConvertPeriodDialog } from './convert-period-dialog'
import {
    getBalanceAdjustments,
    getControlledPeriods,
    deleteBalanceAdjustment,
} from '@/app/(protected)/caixa/accounts/balance-adjustments-actions'
import type { BalanceAdjustment, ControlledPeriod } from '@/lib/types/balance-adjustments'

interface BalanceAdjustmentHistoryProps {
    accountId: string
    accountName: string
}

export function BalanceAdjustmentHistory({
    accountId,
    accountName,
}: BalanceAdjustmentHistoryProps) {
    const [adjustments, setAdjustments] = useState<BalanceAdjustment[]>([])
    const [periods, setPeriods] = useState<ControlledPeriod[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [editingAdjustment, setEditingAdjustment] = useState<BalanceAdjustment | null>(null)
    const [deletingAdjustmentId, setDeletingAdjustmentId] = useState<string | null>(null)
    const [convertingPeriod, setConvertingPeriod] = useState<ControlledPeriod | null>(null)

    const loadData = async () => {
        setIsLoading(true)
        try {
            const [adjustmentsData, periodsData] = await Promise.all([
                getBalanceAdjustments(accountId),
                getControlledPeriods(accountId),
            ])
            setAdjustments(adjustmentsData)
            setPeriods(periodsData)
        } catch (error) {
            console.error('Error loading balance adjustments:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [accountId])

    const handleDelete = async () => {
        if (!deletingAdjustmentId) return

        try {
            await deleteBalanceAdjustment(deletingAdjustmentId)
            await loadData()
        } catch (error) {
            console.error('Error deleting adjustment:', error)
        } finally {
            setDeletingAdjustmentId(null)
        }
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value)
    }

    const getTypeLabel = (type: string) => {
        const labels = {
            initial: 'Saldo Inicial',
            reconciliation: 'Conciliação',
            correction: 'Correção',
        }
        return labels[type as keyof typeof labels] || type
    }

    const getTypeBadgeVariant = (type: string) => {
        const variants = {
            initial: 'default',
            reconciliation: 'secondary',
            correction: 'outline',
        }
        return variants[type as keyof typeof variants] || 'default'
    }

    if (isLoading) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Períodos de Controle
                    </CardTitle>
                    <CardDescription>
                        Histórico de ajustes de saldo e períodos controlados
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {periods.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>Nenhum ajuste de saldo definido</p>
                            <p className="text-sm mt-2">
                                Todas as transações afetarão o saldo da conta
                            </p>
                        </div>
                    ) : (
                        periods.map((period, index) => {
                            const isOngoing = !period.endDate
                            const hasHistoricalTransactions = period.historicalTransactionCount > 0

                            return (
                                <div key={period.adjustmentId} className="space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            {isOngoing ? (
                                                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                                            ) : (
                                                <PauseCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                                            )}
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">
                                                        {format(new Date(period.startDate), 'dd/MM/yyyy', {
                                                            locale: ptBR,
                                                        })}
                                                        {' - '}
                                                        {isOngoing
                                                            ? 'Atual'
                                                            : format(new Date(period.endDate!), 'dd/MM/yyyy', {
                                                                locale: ptBR,
                                                            })}
                                                    </span>
                                                    {isOngoing && (
                                                        <Badge variant="default" className="text-xs">
                                                            Ativo
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="text-sm text-muted-foreground space-y-1">
                                                    <div>Saldo inicial: {formatCurrency(period.startingBalance)}</div>
                                                    <div>Transações: {period.transactionCount}</div>
                                                    {hasHistoricalTransactions && (
                                                        <div className="text-amber-600">
                                                            Transações históricas: {period.historicalTransactionCount}
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-1">
                                                        <TrendingUp className="h-3 w-3" />
                                                        Saldo {isOngoing ? 'atual' : 'final'}:{' '}
                                                        {formatCurrency(period.calculatedEndBalance)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    const adj = adjustments.find(a => a.id === period.adjustmentId)
                                                    if (adj) setEditingAdjustment(adj)
                                                }}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setDeletingAdjustmentId(period.adjustmentId)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {!isOngoing && hasHistoricalTransactions && (
                                        <div className="ml-8 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                            <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
                                                Este período possui transações históricas que não afetam o saldo.
                                            </p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setConvertingPeriod(period)}
                                            >
                                                Converter para Controlado
                                            </Button>
                                        </div>
                                    )}

                                    {index < periods.length - 1 && <Separator />}
                                </div>
                            )
                        })
                    )}

                    {adjustments.length > 0 && (
                        <div className="pt-4">
                            <h4 className="text-sm font-medium mb-3">Histórico Completo de Ajustes</h4>
                            <div className="space-y-2">
                                {adjustments.map((adjustment) => (
                                    <div
                                        key={adjustment.id}
                                        className="flex items-center justify-between p-3 rounded-lg border bg-card text-card-foreground"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium">
                                                    {format(new Date(adjustment.adjustment_date), 'dd/MM/yyyy', {
                                                        locale: ptBR,
                                                    })}
                                                </span>
                                                <Badge variant={getTypeBadgeVariant(adjustment.type) as any}>
                                                    {getTypeLabel(adjustment.type)}
                                                </Badge>
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {formatCurrency(adjustment.balance)}
                                            </div>
                                            {adjustment.notes && (
                                                <div className="text-xs text-muted-foreground italic">
                                                    {adjustment.notes}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <BalanceAdjustmentDialog
                open={!!editingAdjustment}
                onOpenChange={(open) => !open && setEditingAdjustment(null)}
                accountId={accountId}
                accountName={accountName}
                adjustment={editingAdjustment || undefined}
                onSuccess={loadData}
            />

            {convertingPeriod && (
                <ConvertPeriodDialog
                    open={!!convertingPeriod}
                    onOpenChange={(open) => !open && setConvertingPeriod(null)}
                    accountId={accountId}
                    accountName={accountName}
                    period={convertingPeriod}
                    onSuccess={loadData}
                />
            )}

            <AlertDialog
                open={!!deletingAdjustmentId}
                onOpenChange={(open) => !open && setDeletingAdjustmentId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Ajuste de Saldo?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O ajuste de saldo será removido e o cálculo
                            do saldo será recalculado sem considerar este ajuste.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
