'use client'

import { useEffect, useState } from 'react'
import { Info, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { analyzePeriod } from '@/app/(protected)/caixa/accounts/balance-adjustments-actions'
import type { PeriodAnalysis } from '@/lib/types/balance-adjustments'

interface TransactionTypeDetectorProps {
    accountId: string
    transactionDate: string
    isHistorical: boolean
    onIsHistoricalChange: (isHistorical: boolean) => void
}

export function TransactionTypeDetector({
    accountId,
    transactionDate,
    isHistorical,
    onIsHistoricalChange,
}: TransactionTypeDetectorProps) {
    const [analysis, setAnalysis] = useState<PeriodAnalysis | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (!accountId || !transactionDate) return

        const analyze = async () => {
            setIsLoading(true)
            try {
                const result = await analyzePeriod(accountId, transactionDate)
                setAnalysis(result)

                // Auto-set based on suggestion if not manually changed
                if (result.suggested_type === 'historical' && !isHistorical) {
                    onIsHistoricalChange(true)
                }
            } catch (error) {
                console.error('Error analyzing period:', error)
            } finally {
                setIsLoading(false)
            }
        }

        analyze()
    }, [accountId, transactionDate])

    if (isLoading || !analysis) {
        return null
    }

    // Don't show if in normal controlled period
    if (analysis.is_in_controlled_period && !analysis.has_gap) {
        return null
    }

    return (
        <div className="space-y-3">
            <Alert variant={analysis.has_gap ? 'default' : 'default'}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    <p className="font-medium mb-2">
                        {analysis.has_gap ? '⚠️ Período sem controle ativo' : 'ℹ️ Período anterior ao controle'}
                    </p>
                    <p className="text-sm">{analysis.message}</p>
                </AlertDescription>
            </Alert>

            <div className="space-y-3 p-4 rounded-lg border bg-card">
                <Label className="text-sm font-medium">Como deseja lançar esta transação?</Label>

                <RadioGroup
                    value={isHistorical ? 'historical' : 'normal'}
                    onValueChange={(value) => onIsHistoricalChange(value === 'historical')}
                >
                    <div className="flex items-start space-x-2">
                        <RadioGroupItem value="normal" id="normal" />
                        <div className="grid gap-1.5 leading-none">
                            <Label
                                htmlFor="normal"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                                Lançamento Normal
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Esta transação afetará o saldo atual da conta
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start space-x-2">
                        <RadioGroupItem value="historical" id="historical" />
                        <div className="grid gap-1.5 leading-none">
                            <Label
                                htmlFor="historical"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                                Lançamento Histórico
                                {analysis.suggested_type === 'historical' && (
                                    <span className="ml-2 text-xs text-blue-600 font-normal">(Recomendado)</span>
                                )}
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Apenas para relatórios e análises. Não afetará o saldo atual da conta.
                            </p>
                        </div>
                    </div>
                </RadioGroup>

                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                        <strong>Lançamentos históricos</strong> são úteis para manter um histórico completo
                        de transações sem afetar o saldo atual. Ideal para períodos em que você não estava
                        usando o sistema ativamente.
                    </AlertDescription>
                </Alert>
            </div>
        </div>
    )
}
