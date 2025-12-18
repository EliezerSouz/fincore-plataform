'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useTransactions } from '@/hooks/use-transactions'
import { PageLayout } from "@/components/layout/page-layout"
import { FilterBar } from "@/components/filter-bar"
import { TransactionBalanceCard } from "@/features/transactions/components/transaction-balance-card"
import { TransactionsFilters } from "@/features/transactions/components/transactions-filters"
import { TransactionRow } from "@/features/transactions/components/transactions-row"
import { CreateTransactionDialog } from "@/features/transactions/components/create-transaction-dialog"
import { ReceiptText, CircleDashed, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react"
import { useMemo } from 'react'
import { useAccounts } from '@/hooks/use-accounts'

export function TransactionsView({ accounts, categories, initialInsights }: { accounts: any[], categories: any[], initialInsights?: any[] }) {
    const router = useRouter()

    // Fallback fetching for accounts using client-side hook if server-side failed (empty)
    const { accounts: clientAccounts } = useAccounts({
        includeInactive: true,
        enabled: !accounts || accounts.length === 0
    })
    const activeAccounts = accounts && accounts.length > 0 ? accounts : clientAccounts

    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Debug log
    console.log('[TransactionsView] Search Params:', searchParams.toString())

    // Pagination & Limit Logic
    const currentLimit = searchParams.get('limit') || "25"
    const currentPage = parseInt(searchParams.get('page') || "1")

    // Sorting Logic
    const sortBy = searchParams.get('sort_by') || 'date'
    const sortOrder = (searchParams.get('sort_order') as 'asc' | 'desc') || 'desc'

    const { defaultFrom, defaultTo } = useMemo(() => {
        const now = new Date();
        return {
            defaultFrom: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
            defaultTo: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
        }
    }, [])

    // Inicializar filtros da URL com useMemo
    const filters = useMemo(() => ({
        accountId: searchParams.get('accountId') === 'all' ? undefined : searchParams.get('accountId') || undefined,
        categoryId: searchParams.get('categoryId') === 'all' ? undefined : searchParams.get('categoryId') || undefined,
        type: searchParams.get('type') === 'all' ? undefined : searchParams.get('type') || undefined,
        from: searchParams.get('from') || defaultFrom,
        to: searchParams.get('to') || defaultTo,
        month: searchParams.get('month') || undefined,
        year: searchParams.get('year') || undefined,
        limit: parseInt(currentLimit),
        offset: (currentPage - 1) * parseInt(currentLimit),
        sortBy: sortBy || undefined,
        sortOrder: sortOrder || undefined
    }), [searchParams, defaultFrom, defaultTo, currentLimit, currentPage, sortBy, sortOrder])

    const { transactions: tableTransactions, loading: tableLoading, refresh: refetchTable } = useTransactions(filters)

    // Chart Data (No pagination limits)
    const chartFilters = useMemo(() => ({
        ...filters,
        limit: 10000, // Fetch all for the period
        offset: 0
    }), [filters.accountId, filters.categoryId, filters.type, filters.from, filters.to, filters.month, filters.year])

    const { transactions: chartTransactions, loading: chartLoading, refresh: refetchChart } = useTransactions(chartFilters)

    const refetchAll = () => {
        refetchTable()
        refetchChart()
    }

    const updateLimit = (val: string) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('limit', val)
        params.set('page', '1') // Reset to page 1 on limit change
        router.push(pathname + '?' + params.toString())
    }

    const updatePage = (newPage: number) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('page', newPage.toString())
        router.push(pathname + '?' + params.toString())
    }

    const handleSort = (field: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (sortBy === field) {
            params.set('sort_order', sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            params.set('sort_by', field)
            // Default sort direction for new field
            if (field === 'date' || field === 'amount') {
                params.set('sort_order', 'desc')
            } else {
                params.set('sort_order', 'asc')
            }
        }
        router.push(pathname + '?' + params.toString())
    }

    const SortIcon = ({ field }: { field: string }) => {
        if (sortBy !== field) return <ArrowUpDown className="w-4 h-4 opacity-20" />
        if (sortOrder === 'asc') return <ArrowUp className="w-4 h-4 text-blue-500" />
        return <ArrowDown className="w-4 h-4 text-blue-500" />
    }

    const ThSortable = ({ field, children, className = "" }: { field: string, children: React.ReactNode, className?: string }) => (
        <th
            className={`p-3 font-semibold text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors select-none ${className}`}
            onClick={() => handleSort(field)}
        >
            <div className={`flex items-center gap-1 ${className.includes('text-right') ? 'justify-end' : ''}`}>
                {children}
                <SortIcon field={field} />
            </div>
        </th>
    )

    return (
        <PageLayout
            title="Transações"
            description="Gerencie suas entradas, saídas e transferências com detalhes."
            icon={ReceiptText}
            action={<CreateTransactionDialog onSuccess={refetchAll} />}
            filterBar={
                <FilterBar
                    summary={
                        <div className="w-full min-w-[300px] scale-90 origin-right">
                            <TransactionBalanceCard transactions={chartLoading ? [] : chartTransactions} />
                        </div>
                    }
                >
                    <TransactionsFilters accounts={activeAccounts} categories={categories} />
                </FilterBar>
            }
        >
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/50 shadow-sm overflow-hidden relative z-10">
                {tableLoading && tableTransactions.length === 0 ? (
                    <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-500">
                        <CircleDashed className="w-8 h-8 animate-spin text-blue-500" />
                        <p>Carregando transações...</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                                    <tr>
                                        <th className="p-3 font-semibold text-slate-500 dark:text-slate-400 w-[50px]"></th>

                                        <ThSortable field="date" className="w-[120px]">Data</ThSortable>
                                        <ThSortable field="description" className="w-[30%]">Descrição</ThSortable>
                                        <ThSortable field="category" className="hidden md:table-cell w-[15%]">Categoria</ThSortable>
                                        <ThSortable field="account" className="hidden md:table-cell w-[15%]">Conta / Pagamento</ThSortable>
                                        <ThSortable field="amount" className="text-right w-[15%]">Valor</ThSortable>

                                        <th className="p-3 font-semibold text-slate-500 dark:text-slate-400 w-[60px]"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {tableTransactions.length === 0 ? (
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
                                        tableTransactions.map((tx) => (
                                            <TransactionRow key={tx.id} tx={tx} />
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-sm text-slate-500 bg-slate-50/30 dark:bg-slate-900/10 transition-all">
                            <div className="flex items-center gap-2">
                                <span>Linhas por página:</span>
                                <Select value={currentLimit} onValueChange={updateLimit}>
                                    <SelectTrigger className="w-[70px] h-8 bg-white dark:bg-slate-900 text-xs shadow-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => updatePage(currentPage - 1)}
                                    disabled={currentPage <= 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-xs min-w-[60px] text-center font-medium">
                                    Página {currentPage}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => updatePage(currentPage + 1)}
                                    disabled={tableTransactions.length < parseInt(currentLimit)}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </PageLayout>
    )
}
