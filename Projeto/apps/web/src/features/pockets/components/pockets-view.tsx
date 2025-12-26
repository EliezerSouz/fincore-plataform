"use client"

import { ParentAccount } from "@/types/pockets"
import { PageLayout } from "@/components/layout/page-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet, TrendingUp, Landmark, Building2, Smartphone, Briefcase, PiggyBank, CircleDashed, Info } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { useState, useEffect } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { ManageParentAccountModal } from "./manage-parent-account-modal"
import { ParentAccountCard } from "./parent-account-card"

export function PocketsView({ accounts }: { accounts: ParentAccount[] }) {
    const [showNewInstitutionModal, setShowNewInstitutionModal] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    // 1. Calcular Totais
    let caixaTotal = 0
    let investmentTotal = 0
    let reservaTotal = 0

    accounts.forEach(acc => {
        acc.pockets?.forEach(p => {
            if (p.pocket_type === 'INVESTIMENTO') {
                investmentTotal += p.balance
            } else if (p.pocket_type === 'RESERVA_CDI') {
                reservaTotal += p.balance
            } else {
                caixaTotal += p.balance
            }
        })
    })

    const displayCaixa = caixaTotal
    const displayInvestimentos = investmentTotal + reservaTotal
    const totalGeneral = displayCaixa + displayInvestimentos

    // 2. Agrupar por Tipo de Instituição
    const groupedAccounts = accounts.reduce((acc, curr) => {
        const type = curr.institution_type || 'other'
        if (!acc[type]) {
            acc[type] = []
        }
        acc[type].push(curr)
        return acc
    }, {} as Record<string, ParentAccount[]>)

    // Ordem de exibição dos grupos
    const groupOrder = ['digital_bank', 'traditional_bank', 'fintech', 'broker', 'other']

    // Configuração dos Labels e Ícones
    const getGroupConfig = (type: string) => {
        switch (type) {
            case 'digital_bank': return { label: 'Bancos Digitais', icon: Smartphone, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' }
            case 'traditional_bank': return { label: 'Bancos Tradicionais', icon: Landmark, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' }
            case 'fintech': return { label: 'Carteiras & Fintechs', icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' }
            case 'broker': return { label: 'Corretoras de Investimento', icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' }
            default: return { label: 'Outras Instituições', icon: Building2, color: 'text-slate-600', bg: 'bg-slate-50 dark:bg-slate-800' }
        }
    }

    if (!mounted) return null

    return (
        <PageLayout
            title="Minhas Contas"
            description="Gerencie seus saldos, instituições e pockets."
            icon={Wallet}
            action={
                <Button onClick={() => setShowNewInstitutionModal(true)} className="gap-2">
                    <Building2 className="w-4 h-4" />
                    Nova Instituição
                </Button>
            }
        >
            <ManageParentAccountModal
                open={showNewInstitutionModal}
                onOpenChange={setShowNewInstitutionModal}
            />

            {/* Cards de Resumo */}
            <div className="grid gap-4 md:grid-cols-3 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-sm font-medium">Caixa (Disponível)</CardTitle>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Info className="w-3 h-3 text-slate-400" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="max-w-xs">Valor livre para gastos do dia a dia, pagamentos e transferências imediatas.</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <Wallet className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(displayCaixa)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Disponível para uso imediato
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-sm font-medium">Reservas & Investimentos</CardTitle>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Info className="w-3 h-3 text-slate-400" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="max-w-xs">Este valor não entra no saldo em caixa e não deve ser usado para gastos do dia a dia.</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <TrendingUp className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(displayInvestimentos)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Dinheiro guardado e investido
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Patrimônio Total</CardTitle>
                        <Landmark className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(totalGeneral)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Soma de todas as contas
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Lista Agrupada */}
            {accounts.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 py-24 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-center bg-slate-50/50 dark:bg-slate-950/50 relative z-10">
                    <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-full mb-4">
                        <Wallet className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                        Nenhuma instituição encontrada
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6">
                        Você ainda não cadastrou nenhuma instituição financeira.
                    </p>
                    <Button onClick={() => setShowNewInstitutionModal(true)}>
                        Criar Primeira Instituição
                    </Button>
                </div>
            ) : (
                <div className="space-y-10 relative z-10">
                    {groupOrder.map(type => {
                        const groupAccounts = groupedAccounts[type]
                        if (!groupAccounts?.length) return null

                        const config = getGroupConfig(type)
                        const Icon = config.icon
                        const groupTotal = groupAccounts.reduce((sum, acc) => sum + acc.total_balance, 0)

                        return (
                            <div key={type} className="space-y-4">
                                {/* Header do Grupo */}
                                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg border border-slate-200 dark:border-slate-800 ${config.bg}`}>
                                            <Icon className={`h-5 w-5 ${config.color}`} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                                {config.label}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {groupAccounts.length} instituição{groupAccounts.length !== 1 ? 'ões' : ''} • {formatCurrency(groupTotal)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Grid de Instituições do Grupo */}
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                                    {groupAccounts.map(account => (
                                        <ParentAccountCard key={account.id} account={account} />
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </PageLayout>
    )
}
