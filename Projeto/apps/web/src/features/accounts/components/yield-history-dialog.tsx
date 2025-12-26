"use client"

import { useState, useEffect } from "react"
import { BaseModal } from "@/components/ui/base-modal"
import { TrendingUp, Calendar, DollarSign, Percent } from "lucide-react"
import { ApiClient } from "@/lib/api-client"

interface YieldRecord {
    id: string
    date: string
    base_amount: number
    yield_amount: number
    rate_applied: number
}

interface YieldHistoryProps {
    accountId: string
    accountName: string
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function YieldHistoryDialog({ accountId, accountName, open, onOpenChange }: YieldHistoryProps) {
    const [loading, setLoading] = useState(false)
    const [summary, setSummary] = useState<any>(null)

    useEffect(() => {
        if (open && accountId) {
            loadYieldHistory()
        }
    }, [open, accountId])

    async function loadYieldHistory() {
        setLoading(true)
        try {
            const client = new ApiClient()
            const data = await client.get(`/api/yields/account/${accountId}`)
            setSummary(data)
        } catch (error) {
            console.error("Error loading yield history:", error)
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR')
    }

    return (
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            title={
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                        <span>Histórico de Rendimentos CDI</span>
                    </div>
                    <p className="text-sm font-normal text-slate-500">{accountName}</p>
                </div>
            }
            secondaryButton={{
                label: "Fechar"
            }}
        >
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                </div>
            ) : summary ? (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                                <DollarSign className="w-3 h-3" />
                                <span>Saldo Operacional</span>
                            </div>
                            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                {formatCurrency(summary.operational_balance || 0)}
                            </p>
                        </div>

                        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/30">
                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs mb-1">
                                <TrendingUp className="w-3 h-3" />
                                <span>Rendimentos Totais</span>
                            </div>
                            <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">
                                {formatCurrency(summary.total_yields || 0)}
                            </p>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-900/30">
                            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs mb-1">
                                <Percent className="w-3 h-3" />
                                <span>Saldo Total</span>
                            </div>
                            <p className="text-lg font-semibold text-blue-700 dark:text-blue-400">
                                {formatCurrency(summary.total_balance || 0)}
                            </p>
                        </div>
                    </div>

                    {/* Yield Records */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Últimos 30 dias
                        </h3>

                        <div className="max-h-96 overflow-y-auto space-y-2">
                            {summary.recent_yields && summary.recent_yields.length > 0 ? (
                                summary.recent_yields.map((record: YieldRecord) => (
                                    <div
                                        key={record.id}
                                        className="flex items-center justify-between p-3 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                    {formatDate(record.date)}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    Base: {formatCurrency(record.base_amount)} • Taxa: {(record.rate_applied * 100).toFixed(4)}%
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                                + {formatCurrency(record.yield_amount)}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-slate-500">
                                    <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">Nenhum rendimento calculado ainda</p>
                                    <p className="text-xs mt-1">Os rendimentos são calculados diariamente às 10h</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-900/30">
                        <p className="text-xs text-blue-700 dark:text-blue-400">
                            <strong>ℹ️ Informação:</strong> Os rendimentos são calculados automaticamente todos os dias úteis às 10h da manhã,
                            baseados na taxa CDI do Banco Central. O saldo total inclui o saldo operacional mais todos os rendimentos acumulados.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="text-center py-8 text-slate-500">
                    <p>Erro ao carregar histórico de rendimentos</p>
                </div>
            )}
        </BaseModal>
    )
}
