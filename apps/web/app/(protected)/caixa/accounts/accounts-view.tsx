'use client'

import { useAccounts } from '@/hooks/use-accounts'
import { AccountCard } from "@/features/accounts/components/account-card"
import { CreateAccountDialog } from "@/features/accounts/components/create-account-dialog"
import { ConsolidatedBalanceCard } from "@/features/accounts/components/consolidated-balance-card"
import { Wallet, Landmark, PiggyBank, TrendingUp, Activity, CreditCard, CircleDashed } from "lucide-react"
import { PageLayout } from "@/components/page-layout"

export function AccountsView() {
    const { accounts, loading } = useAccounts()

    // Separação de Contas
    const activeAccounts = accounts.filter((a: any) => a.is_active !== false)

    // Contas de Caixa (Corrente, Digital, Carteira, Poupança, etc) - tudo EXCETO Investimento
    const caixaAccounts = activeAccounts.filter((a: any) => a.type !== 'investimento')

    // Contas de Investimento
    const investmentAccounts = activeAccounts.filter((a: any) => a.type === 'investimento')

    // Totais
    const totalBalance = caixaAccounts.reduce((acc: any, curr: any) => acc + curr.balance, 0)
    const totalInvested = investmentAccounts.reduce((acc: any, curr: any) => acc + curr.balance, 0)

    // Agrupa por tipo (apenas contas ativas)
    const accountsByType = activeAccounts.reduce((acc: any, curr: any) => {
        const type = curr.type?.toLowerCase() || 'outros'
        if (!acc[type]) {
            acc[type] = {
                total: 0,
                count: 0,
                type: type
            }
        }
        acc[type].total += curr.balance
        acc[type].count += 1
        return acc
    }, {})

    // Converte para array e ordena por total (maior primeiro)
    const typeSummaries = Object.values(accountsByType).sort((a: any, b: any) => b.total - a.total)

    // Função para obter ícone por tipo
    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'corrente': return { Icon: Landmark, color: 'text-emerald-600' }
            case 'digital': return { Icon: Landmark, color: 'text-blue-600' }
            case 'poupanca':
            case 'poupança': return { Icon: PiggyBank, color: 'text-amber-600' }
            case 'investimento': return { Icon: TrendingUp, color: 'text-purple-600' }
            case 'carteira': return { Icon: Wallet, color: 'text-slate-600' }
            case 'cartao_credito': return { Icon: CreditCard, color: 'text-orange-600' }
            default: return { Icon: Activity, color: 'text-gray-600' }
        }
    }

    // Função para obter label por tipo
    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'corrente': return 'Correntes'
            case 'digital': return 'Digitais'
            case 'poupanca':
            case 'poupança': return 'Poupança'
            case 'investimento': return 'Investimentos'
            case 'carteira': return 'Carteiras'
            case 'internacional': return 'Internacional'
            case 'vale_alimentacao': return 'Vale Alimentação'
            case 'cartao_credito': return 'Cartões de Crédito'
            default: return type.charAt(0).toUpperCase() + type.slice(1)
        }
    }

    // Função para obter subtítulo explicativo por tipo
    const getTypeSubtitle = (type: string) => {
        switch (type) {
            case 'corrente': return 'Contas bancárias tradicionais'
            case 'digital': return 'Carteiras digitais e apps'
            case 'poupanca':
            case 'poupança': return 'Reserva de emergência'
            case 'investimento': return 'Patrimônio em aplicações'
            case 'carteira': return 'Dinheiro físico'
            case 'internacional': return 'Moeda estrangeira'
            case 'vale_alimentacao': return 'Benefícios corporativos'
            default: return null
        }
    }

    if (loading) {
        return (
            <PageLayout
                title="Minhas Contas"
                description="Gerencie seus saldos e fontes de recursos."
                icon={Wallet}
                action={<CreateAccountDialog />}
            >
                <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-500">
                    <CircleDashed className="w-8 h-8 animate-spin text-blue-500" />
                    <p>Carregando contas...</p>
                </div>
            </PageLayout>
        )
    }

    return (
        <PageLayout
            title="Minhas Contas"
            description="Gerencie seus saldos e fontes de recursos."
            action={<CreateAccountDialog />}
            icon={Wallet}
            summaryCards={
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    {/* Saldo Consolidado (Caixa) */}
                    <ConsolidatedBalanceCard
                        totalBalance={totalBalance}
                        accountCount={caixaAccounts.length}
                        title="Saldo em Caixa"
                        subtitle="Disponível para uso imediato"
                    />

                    {/* Saldo Investido (Patrimônio) - Só exibe se houver */}
                    {totalInvested > 0 && (
                        <ConsolidatedBalanceCard
                            totalBalance={totalInvested}
                            accountCount={investmentAccounts.length}
                            title="Total Investido"
                            subtitle="Patrimônio em aplicações"
                            variant="investment"
                        />
                    )}

                    {/* Cards dinâmicos por tipo */}
                    {typeSummaries.map((summary: any) => {
                        const { Icon, color } = getTypeIcon(summary.type)
                        const subtitle = getTypeSubtitle(summary.type)
                        const isNegative = summary.total < 0

                        return (
                            <div key={summary.type} className={`rounded-xl border p-6 flex flex-col justify-between space-y-2 hover:shadow-md transition-shadow ${isNegative
                                ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                                : 'bg-card border-slate-200 dark:border-slate-800'
                                }`}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className={`text-sm font-medium ${isNegative ? 'text-red-700 dark:text-red-400' : 'text-muted-foreground'}`}>
                                            {getTypeLabel(summary.type)}
                                        </span>
                                        {subtitle && <p className="text-[10px] text-slate-400 mt-0.5">{subtitle}</p>}
                                    </div>
                                    <Icon className={`h-4 w-4 ${isNegative ? 'text-red-600' : color}`} />
                                </div>
                                <div className={`text-2xl font-bold ${isNegative ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.total)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {summary.count} conta{summary.count !== 1 ? 's' : ''}
                                </div>
                            </div>
                        )
                    })}
                </div>
            }
        >

            {accounts.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 py-24 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-center bg-slate-50/50 dark:bg-slate-950/50 relative z-10">
                    <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-full mb-4">
                        <Wallet className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                        Nenhuma conta encontrada
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6">
                        Você ainda não cadastrou nenhuma conta bancária ou carteira. Comece agora para organizar suas finanças.
                    </p>
                    <CreateAccountDialog />
                </div>
            ) : (
                <div className="space-y-8 relative z-10">
                    {/* Agrupamento por tipo */}
                    {typeSummaries.map((summary: any) => {
                        const { Icon, color } = getTypeIcon(summary.type)
                        const accountsOfType = activeAccounts.filter((acc: any) => acc.type?.toLowerCase() === summary.type)

                        return (
                            <div key={summary.type} className="space-y-4">
                                {/* Header do grupo */}
                                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800`}>
                                            <Icon className={`h-5 w-5 ${color}`} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                                {getTypeLabel(summary.type)}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {summary.count} conta{summary.count !== 1 ? 's' : ''} • {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.total)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Grid de contas deste tipo */}
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {accountsOfType.map((account: any) => (
                                        <AccountCard
                                            key={account.id}
                                            account={account}
                                            allAccounts={activeAccounts}

                                        />
                                    ))}
                                </div>
                            </div>
                        )
                    })}

                    {/* Contas inativas (se houver) */}
                    {accounts.filter((a: any) => a.is_active === false).length > 0 && (
                        <div className="space-y-4 mt-12">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                        <Activity className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                            Contas Inativas
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {accounts.filter((a: any) => a.is_active === false).length} conta{accounts.filter((a: any) => a.is_active === false).length !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {accounts.filter((a: any) => a.is_active === false).map((account: any) => (
                                    <AccountCard key={account.id} account={account} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </PageLayout>
    )
}
