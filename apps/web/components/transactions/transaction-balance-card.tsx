"use client"

import { useMemo } from "react"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from "recharts"
import { formatCurrency } from "@/lib/utils"
import { TrendingUp, TrendingDown, Wallet } from "lucide-react"

interface TransactionBalanceCardProps {
    transactions: any[]
}

export function TransactionBalanceCard({ transactions }: TransactionBalanceCardProps) {
    const data = useMemo(() => {
        // Ordena por data
        const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        // Agrupa por dia e calcula o resultado do dia (receita - despesa)
        const dailyMap = new Map<string, number>()

        sorted.forEach(tx => {
            const date = tx.date // YYYY-MM-DD
            const amount = Number(tx.amount)
            const val = tx.type === 'despesa' ? -amount : amount
            dailyMap.set(date, (dailyMap.get(date) || 0) + val)
        })

        // Cria array de acumulado
        // Como é apenas tendência do período, começamos do zero ou do primeiro movimento
        let accumulator = 0
        const chartData = []

        // Se não tiver transações, retorna vazio
        if (sorted.length === 0) return []

        // Pega range de datas (opcional, mas vamos usar as datas das transações existentes para simplificar o sparkline)
        for (const [date, val] of dailyMap.entries()) {
            accumulator += val
            chartData.push({ date, value: accumulator })
        }

        return chartData
    }, [transactions])

    const totalBalance = useMemo(() => {
        return transactions.reduce((acc, curr) => {
            const val = Number(curr.amount)
            return curr.type === 'despesa' ? acc - val : acc + val
        }, 0)
    }, [transactions])

    const isPositive = totalBalance >= 0
    const color = isPositive ? "#10b981" : "#ef4444" // emerald-500 : rose-500

    if (transactions.length === 0) return null

    return (
        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-sm gap-4">
            {/* Info Saldo */}
            <div className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Resultado do Período
                </span>
                <div className="flex flex-col">
                    <span className={`text-2xl font-bold tracking-tight leading-none ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {formatCurrency(totalBalance)}
                    </span>
                    <div className="flex items-center gap-1.5 mt-1.5">
                        <div className={`flex items-center text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-sm ${isPositive ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400' : 'text-rose-700 bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400'}`}>
                            {isPositive ? "Positivo" : "Negativo"}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sparkline Discreto */}
            <div className="h-[40px] w-[120px] opacity-60">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={color}
                            fill="transparent"
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={true}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
