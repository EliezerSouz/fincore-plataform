import { PageLayout } from "@/components/layout/page-layout"
import { CalendarClock, TrendingDown } from "lucide-react"
import { getPayables, Payable } from "./actions"
import { PayableList } from "./payable-list"
import { CreatePayableDialog } from "./create-payable-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
// import { DateRangeFilter } from "@/components/date-range-filter" // Substituído
import { FilterBar, FilterSummary } from "@/components/filter-bar"
import { PayableStatusFilter } from "@/features/payables/components/payable-status-filter"
// import { redirect } from "next/navigation" // Unused

import { getAccounts } from "@/app/(protected)/caixa/accounts/actions"
import { getPaymentMethods } from "@/app/(protected)/caixa/transactions/actions"

export default async function PayablesPage(props: { searchParams: Promise<any> }) {
    const searchParams = await props.searchParams
    const month = searchParams.month ? parseInt(searchParams.month) : undefined
    const year = searchParams.year ? parseInt(searchParams.year) : undefined
    const range = (searchParams.from && searchParams.to) ? { from: searchParams.from, to: searchParams.to } : undefined

    const statusFilter = searchParams.status || 'all'

    // Fetch data in parallel
    const [payablesRaw, accounts, paymentMethods] = await Promise.all([
        getPayables(month, year, range),
        getAccounts(true),
        getPaymentMethods()
    ])

    let payables = payablesRaw

    // Client-side filtering (Server Component level) for Status
    if (statusFilter !== 'all') {
        payables = payables.filter(p => p.status === statusFilter)
    }

    // Cálculos de Resumo
    const totalPending = payables.filter(p => p.status === 'pending').reduce((acc, p) => acc + p.amount, 0)

    // Data de referência para comparativos
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const overduePayables = payables.filter(p => {
        if (p.status !== 'pending') return false
        const dueDate = new Date(p.due_date)
        dueDate.setMinutes(dueDate.getMinutes() + dueDate.getTimezoneOffset())
        return dueDate < today
    })

    const totalOverdue = overduePayables.reduce((acc, p) => acc + p.amount, 0)

    const upcomingPayables = payables.filter(p => {
        if (p.status !== 'pending') return false;
        const dueDate = new Date(p.due_date)
        dueDate.setMinutes(dueDate.getMinutes() + dueDate.getTimezoneOffset())
        const nextWeek = new Date(today)
        nextWeek.setDate(today.getDate() + 7)
        return dueDate >= today && dueDate <= nextWeek
    })

    const totalUpcoming = upcomingPayables.reduce((acc, p) => acc + p.amount, 0)

    return (
        <PageLayout
            title="Contas a Pagar"
            description="Gerencie seus compromissos financeiros futuros e evite atrasos."
            icon={CalendarClock}
            action={
                <CreatePayableDialog activeCount={payables.filter(p => p.status === 'pending').length} />
            }
            filterBar={
                <FilterBar>
                    <PayableStatusFilter initialStatus={statusFilter} />
                </FilterBar>
            }
            summaryCards={
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="bg-slate-900 text-white dark:bg-slate-950 border-slate-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium opacity-80">
                                Total a Pagar
                            </CardTitle>
                            <CalendarClock className="h-4 w-4 text-slate-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(totalPending)}</div>
                            <p className="text-xs text-slate-400">
                                {payables.filter(p => p.status === 'pending').length} contas pendentes
                            </p>
                        </CardContent>
                    </Card>

                    <Card className={totalOverdue > 0 ? "bg-red-50 border-red-100 dark:bg-red-950/20 dark:border-red-900/50" : ""}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className={`text-sm font-medium ${totalOverdue > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                                Vencidas
                            </CardTitle>
                            <TrendingDown className={`h-4 w-4 ${totalOverdue > 0 ? 'text-red-600' : 'text-muted-foreground'}`} />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${totalOverdue > 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
                                {formatCurrency(totalOverdue)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {overduePayables.length} contas atrasadas
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Próximos 7 Dias
                            </CardTitle>
                            <CalendarClock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(totalUpcoming)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {upcomingPayables.length} contas em breve
                            </p>
                        </CardContent>
                    </Card>
                </div>
            }
        >
            <PayableList payables={payables} accounts={accounts} paymentMethods={paymentMethods} />
        </PageLayout>
    )
}


