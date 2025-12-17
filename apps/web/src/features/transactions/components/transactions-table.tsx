'use client'

import { useSearchParams } from 'next/navigation'
import { useTransactions } from '@/app/(protected)/caixa/transactions/use-transactions'
import { TransactionRow } from './transactions-row'
import { CircleDashed } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { TransactionBalanceCard } from './transaction-balance-card'

export function TransactionsTable({ onDataLoaded }: { onDataLoaded?: (transactions: any[]) => void }) {
    const searchParams = useSearchParams()

    const now = new Date();
    const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    // Inicializar filtros da URL com useMemo
    const filters = useMemo(() => ({
        accountId: searchParams.get('accountId') === 'all' ? undefined : searchParams.get('accountId') || undefined,
        categoryId: searchParams.get('categoryId') === 'all' ? undefined : searchParams.get('categoryId') || undefined,
        type: searchParams.get('type') === 'all' ? undefined : searchParams.get('type') || undefined,
        from: searchParams.get('from') || defaultFrom,
        to: searchParams.get('to') || defaultTo,
        month: searchParams.get('month') || undefined,
        year: searchParams.get('year') || undefined,
    }), [searchParams, defaultFrom, defaultTo])

    const { transactions, loading } = useTransactions(filters)

    // Notificar pai quando dados carregarem (para atualizar balanço, se necessário)
    useEffect(() => {
        if (!loading && onDataLoaded) {
            onDataLoaded(transactions)
        }
    }, [transactions, loading, onDataLoaded])

    if (loading) {
        return (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/50 shadow-sm p-12 flex justify-center items-center">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                    <CircleDashed className="w-8 h-8 animate-spin text-blue-500" />
                    <p>Carregando transações...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/50 shadow-sm overflow-hidden relative z-10">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                            <th className="p-5 font-semibold text-slate-500 dark:text-slate-400 w-[60px]"></th>
                            <th className="p-5 font-semibold text-slate-500 dark:text-slate-400 w-[120px]">Data</th>
                            <th className="p-5 font-semibold text-slate-500 dark:text-slate-400 w-[30%]">Descrição</th>
                            <th className="p-5 font-semibold text-slate-500 dark:text-slate-400 hidden md:table-cell w-[15%]">Categoria</th>
                            <th className="p-5 font-semibold text-slate-500 dark:text-slate-400 hidden md:table-cell w-[15%]">Conta / Pagamento</th>
                            <th className="p-5 font-semibold text-slate-500 dark:text-slate-400 text-right w-[15%]">Valor</th>
                            <th className="p-5 font-semibold text-slate-500 dark:text-slate-400 w-[60px]"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {transactions.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-12 text-center">
                                    <div className="flex flex-col items-center gap-3 text-slate-500">
                                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                                            <CircleDashed className="w-6 h-6 opacity-50" />
                                        </div>
                                        <p>Nenhuma transação encontrada neste período.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            transactions.map((tx) => (
                                <TransactionRow key={tx.id} tx={tx} />
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
