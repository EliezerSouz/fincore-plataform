import { PageLayout } from "@/components/layout/page-layout"
import { CalendarClock, TrendingDown, AlertCircle } from "lucide-react"
import { getPayables, Payable } from "./actions"
import { PayableList } from "./payable-list"
import { CreatePayableDialog } from "./create-payable-dialog"
import { formatCurrency } from "@/lib/utils"
import { FilterBar, FilterSummary } from "@/components/filter-bar"
import { PayableStatusFilter } from "@/features/payables/components/payable-status-filter"
import { getAccounts } from "@/app/(protected)/caixa/accounts/actions"
import { getPaymentMethods } from "@/app/(protected)/caixa/transactions/actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
        >
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total a Pagar</CardTitle>
                            <CalendarClock className="h-4 w-4 text-slate-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalPending)}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {payables.filter(p => p.status === 'pending').length} contas pendentes
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
                            <AlertCircle className={`h-4 w-4 ${totalOverdue > 0 ? "text-red-500" : "text-slate-500"}`} />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${totalOverdue > 0 ? "text-red-600" : "text-slate-900 dark:text-white"}`}>{formatCurrency(totalOverdue)}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {overduePayables.length} contas atrasadas
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Próximos 7 Dias</CardTitle>
                            <CalendarClock className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalUpcoming)}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {upcomingPayables.length} contas em breve
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <CardTitle>Contas</CardTitle>
                            <div className="flex items-center gap-2">
                                <FilterBar>
                                    <PayableStatusFilter initialStatus={statusFilter} />
                                </FilterBar>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <PayableList payables={payables} accounts={accounts} paymentMethods={paymentMethods} />
                    </CardContent>
                </Card>
            </div>
        </PageLayout>
    )
}


