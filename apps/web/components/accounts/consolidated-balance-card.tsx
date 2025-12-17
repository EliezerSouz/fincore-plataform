"use client"
import { Wallet, TrendingUp } from "lucide-react"

interface ConsolidatedBalanceCardProps {
    totalBalance: number
    accountCount: number
    title?: string
    subtitle?: string
    variant?: 'default' | 'investment'
}

export function ConsolidatedBalanceCard({
    totalBalance,
    accountCount,
    title = "Saldo Consolidado",
    subtitle = "Soma de contas disponíveis (Caixa)",
    variant = "default"
}: ConsolidatedBalanceCardProps) {

    const isInvestment = variant === 'investment'
    const Icon = isInvestment ? TrendingUp : Wallet

    const bgClasses = isInvestment
        ? "from-purple-600 to-indigo-600 dark:from-purple-700 dark:to-indigo-700"
        : "from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700"

    return (
        <div className={`lg:col-span-2 rounded-xl border bg-gradient-to-br ${bgClasses} text-white shadow-lg p-6 flex flex-col justify-between space-y-3 relative overflow-hidden group`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
            <div className="flex items-center justify-between relative z-10">
                <div>
                    <span className="text-sm font-medium text-white/90">{title}</span>
                    <p className="text-[10px] text-white/70 mt-0.5">{subtitle}</p>
                </div>
                <Icon className="h-5 w-5 text-white/70" />
            </div>
            <div className="text-3xl font-bold relative z-10">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalBalance)}
            </div>
            <div className="text-xs text-white/80 relative z-10">
                {accountCount} conta{accountCount !== 1 ? 's' : ''} {isInvestment ? 'de investimento' : 'ativas'}
            </div>
        </div>
    )
}
