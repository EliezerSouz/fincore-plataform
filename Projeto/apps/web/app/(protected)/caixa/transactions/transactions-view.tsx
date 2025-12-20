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
import { ReceiptText, CircleDashed, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown, Zap, BrainCircuit, AlertTriangle, TrendingUp, Info, CheckCircle } from "lucide-react"
import { useMemo, useState, useEffect } from 'react'
import { useAccounts } from '@/hooks/use-accounts'
import { getGroqTransactionInsight } from '@/features/ai/actions/groq-insight'
import { BaseModal } from '@/components/ui/base-modal'

export function TransactionsView({ accounts, categories, initialInsights, lastUpdated }: { accounts: any[], categories: any[], initialInsights?: any[], lastUpdated?: number }) {
    const router = useRouter()
    const [insightOpen, setInsightOpen] = useState(false)
    const [insightLoading, setInsightLoading] = useState(false)
    const [insightData, setInsightData] = useState<{ title: string, message: string, type: string } | null>(null)

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

    // Effect to refetch when lastUpdated changes (triggered by router.refresh())
    useEffect(() => {
        if (lastUpdated) {
            refetchAll()
        }
    }, [lastUpdated, refetchTable, refetchChart])

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

    const handleGenerateInsight = async () => {
        setInsightLoading(true)
        setInsightOpen(true)
        setInsightData(null) // Reset previous data

        try {
            // Use chartTransactions (all data in filter) instead of tableTransactions (paginated)
            const data = await getGroqTransactionInsight(chartTransactions)
            setInsightData(data)
        } catch (e) {
            console.error(e)
            setInsightData({
                title: "Erro",
                message: "Falha ao conectar com a inteligência artificial.",
                type: "warning"
            })
        } finally {
            setInsightLoading(false)
        }
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
            action={
                <div className="flex gap-2">
                    <Button
                        onClick={handleGenerateInsight}
                        className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0 shadow-md shadow-violet-500/20"
                    >
                        <Zap className="w-4 h-4 mr-2 fill-yellow-300 text-yellow-300" />
                        IA Insight
                    </Button>
                    <CreateTransactionDialog onSuccess={refetchAll} />
                </div>
            }
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

            {/* AI Insight Modal */}
            <BaseModal
                open={insightOpen}
                onOpenChange={setInsightOpen}
                title={
                    <div className="flex items-center gap-2 text-violet-600">
                        <BrainCircuit className="w-5 h-5" />
                        <span>Análise de Inteligência Artificial</span>
                    </div>
                }
                primaryButton={{
                    label: "Entendi",
                    onClick: () => setInsightOpen(false)
                }}
            >
                {insightLoading ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-4">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-full border-4 border-violet-100 dark:border-violet-900/30 border-t-violet-600 animate-spin"></div>
                            <Zap className="w-5 h-5 text-violet-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <p className="text-sm text-slate-500 animate-pulse">Otimizando seus dados financeiros...</p>
                    </div>
                ) : insightData ? (
                    (insightData as any).insights ? (
                        <div className="py-4">
                            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-4 px-1">
                                Análise Financeira Inteligente
                            </h3>
                            <div className="space-y-3">
                                {((insightData as any).insights || []).map((insight: any, idx: number) => {
                                    const isAlert = insight.type === 'alerta';
                                    const isOpp = insight.type === 'oportunidade';

                                    return (
                                        <div key={idx} className={`p-4 rounded-xl border transition-all ${isAlert ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30' :
                                            isOpp ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30' :
                                                'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800'
                                            }`}>
                                            <div className="flex gap-3 mb-2">
                                                <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isAlert ? 'bg-red-100 dark:bg-red-900/30 text-red-600' :
                                                    isOpp ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' :
                                                        'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                                                    }`}>
                                                    {isAlert ? <AlertTriangle className="w-5 h-5" /> : isOpp ? <TrendingUp className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <h4 className={`font-bold text-sm ${isAlert ? 'text-red-900 dark:text-red-200' :
                                                        isOpp ? 'text-emerald-900 dark:text-emerald-200' :
                                                            'text-slate-900 dark:text-slate-200'
                                                        }`}>
                                                        {insight.title}
                                                    </h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${isAlert ? 'bg-red-100 border-red-200 text-red-700' :
                                                            isOpp ? 'bg-emerald-100 border-emerald-200 text-emerald-700' :
                                                                'bg-slate-100 border-slate-200 text-slate-600'
                                                            }`}>
                                                            {insight.category}
                                                        </span>
                                                        {insight.priority === 'alta' && (
                                                            <span className="text-[10px] font-bold text-red-600 flex items-center gap-1">
                                                                <AlertTriangle className="w-3 h-3" /> Alta Prioridade
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-3 pl-11">
                                                {insight.description}
                                            </p>

                                            {insight.suggestedAction && (
                                                <div className="ml-11 bg-white dark:bg-slate-950 rounded-lg p-3 border border-slate-100 dark:border-slate-800 flex items-start gap-2 shadow-sm">
                                                    <CheckCircle className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
                                                    <div className="flex-1">
                                                        <span className="text-xs font-bold text-violet-600 block mb-0.5">Sugestão de Ação</span>
                                                        <p className="text-xs text-slate-600 dark:text-slate-400">
                                                            {insight.suggestedAction}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
                                <Zap className="w-3 h-3 text-yellow-500" />
                                <span>Análise gerada via Llama 3.3 • Exclui transferências</span>
                            </div>
                        </div>
                    ) : (
                        // Standard Title/Message rendering (Fallback)
                        <div className="py-2 space-y-4">
                            <div className={`p-4 rounded-xl border ${insightData.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' : insightData.type === 'alert' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                                    {insightData.title || "Insight"}
                                </h3>
                                <p className="leading-relaxed opacity-90">
                                    {insightData.message || JSON.stringify(insightData)}
                                </p>
                            </div>
                        </div>
                    )
                ) : null}
            </BaseModal>
        </PageLayout>
    )
}
