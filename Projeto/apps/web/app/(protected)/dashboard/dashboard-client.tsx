"use client"
import * as React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { getTransactions } from "@/app/(protected)/caixa/transactions/actions"
import { Calendar as CalendarIcon, Landmark, Wallet, AlertCircle, CheckCircle2, TrendingUp, ArrowRight, CreditCard, DollarSign, Coins, Activity, ShieldCheck, Lock } from "lucide-react"
import { ResponsiveContainer, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Area, Bar, Line } from "recharts"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useFinancialSummary } from "@/hooks/use-financial-summary"
import { PageLayout } from "@/components/layout/page-layout"
import { UpsellModal } from "@/components/ui/upsell-modal"
import { OnboardingModal } from "@/components/onboarding-modal"
import { PremiumPassiveTip } from "@/components/premium-passive-tip"
import type { UserData } from "@/lib/get-user-data"

type Feature = 'advanced_reports' | 'ai_insights' | 'export_data'

interface DashboardClientProps {
    userData: NonNullable<UserData>
}

export function DashboardClient({ userData }: DashboardClientProps) {
    // ... (rest of code)

    const [date, setDate] = React.useState<Date | undefined>(undefined)
    const [isMounted, setIsMounted] = useState(false)
    const [period, setPeriod] = React.useState("3m")
    const [, setTransactions] = useState<any[]>([])
    const [chartData, setChartData] = useState<any[]>([])
    const [showUpsell, setShowUpsell] = useState(false)

    useEffect(() => {
        setIsMounted(true)
        setDate(new Date())
    }, [])

    // Permission Control - implementado localmente baseado em userData
    const can = (feature: Feature): boolean => {
        if (userData.isPremium) return true
        // Plano free não tem acesso a advanced_reports
        return false
    }

    // DADOS FINANCEIROS (REAIS)
    const { liquidez, patrimonio, compromissos, isLoading } = useFinancialSummary()

    // Fetch transactions and build chart data
    useEffect(() => {
        // Buscar dados dos últimos 12 meses para o gráfico
        const today = new Date()
        const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), 1)
        const from = oneYearAgo.toISOString().split('T')[0]
        const to = today.toISOString().split('T')[0]

        getTransactions({ from, to, limit: 1000 }).then(data => {
            setTransactions(data)

            // Gera os últimos 12 meses
            const last12Months = []
            const now = new Date()
            for (let i = 11; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
                const monthKey = d.toLocaleString('pt-BR', { month: 'short', year: 'numeric' })
                last12Months.push({
                    name: monthKey.charAt(0).toUpperCase() + monthKey.slice(1), // Capitaliza
                    receitas: 0,
                    despesas: 0,
                    saldo: 0,
                    date: d
                })
            }

            // Agrupa transações reais por mês
            const grouped: Record<string, { receitas: number; despesas: number }> = {}
            data.forEach((t: any) => {
                const date = new Date(t.date)
                const key = date.toLocaleString('pt-BR', { month: 'short', year: 'numeric' })
                const normalizedKey = key.charAt(0).toUpperCase() + key.slice(1)
                if (!grouped[normalizedKey]) grouped[normalizedKey] = { receitas: 0, despesas: 0 }
                if (t.type === 'receita') grouped[normalizedKey].receitas += Number(t.amount)
                else if (t.type === 'despesa') grouped[normalizedKey].despesas += Number(t.amount)
            })

            // Mescla dados reais com o template de 12 meses
            const chart = last12Months.map(month => {
                const realData = grouped[month.name]
                if (realData) {
                    return {
                        name: month.name,
                        receitas: realData.receitas,
                        despesas: realData.despesas,
                        saldo: realData.receitas - realData.despesas,
                    }
                }
                return month
            })

            setChartData(chart)
        })
    }, [])

    function handlePeriodChange(newPeriod: string) {
        if (newPeriod !== '3m' && !can('advanced_reports')) {
            setShowUpsell(true)
            return
        }
        setPeriod(newPeriod)
    }

    // Usando dados reais do hook
    const caixaLiquido = liquidez;
    const comprometido = compromissos;
    const saldoLivre = caixaLiquido - comprometido;
    const patrimonioTotal = patrimonio;

    // SAÚDE FINANCEIRA (calculada automaticamente)
    const calculateHealthScore = () => {
        if (caixaLiquido === 0) return { score: 0, status: "Crítico" }
        const ratio = comprometido / caixaLiquido
        if (ratio >= 0.9) return { score: 20, status: "Crítico" }
        if (ratio >= 0.7) return { score: 50, status: "Atenção" }
        if (ratio >= 0.5) return { score: 70, status: "Bom" }
        if (ratio >= 0.3) return { score: 85, status: "Muito Bom" }
        return { score: 95, status: "Excelente" }
    }
    const { score, status: healthStatus } = calculateHealthScore();

    // Filtragem de dados baseada no período
    const getFilteredData = () => {
        if (!chartData.length) return []

        switch (period) {
            case "3m": return chartData.slice(-3); // Últimos 3 meses
            case "6m": return chartData.slice(-6); // Últimos 6 meses
            case "1y": return chartData; // Tudo
            default: return chartData.slice(-6);
        }
    };
    const currentData = getFilteredData();

    // LÓGICA DO GRÁFICO (Dinâmica de Risco) Atualizada para dados filtrados
    const gradientOffset = () => {
        if (currentData.length === 0) return 0;
        const dataMax = Math.max(...currentData.map((i) => i.saldo));
        const dataMin = Math.min(...currentData.map((i) => i.saldo));
        if (dataMax <= 0) {
            return 0;
        }
        if (dataMin >= 0) {
            return 1;
        }
        return dataMax / (dataMax - dataMin);
    };
    const off = gradientOffset();

    return (
        <>
            <OnboardingModal />
            <PageLayout
                title="Dashboard"
                description="Boas vindas ao seu Financial OS."
                icon={Activity}
                action={
                    !isMounted ? (
                        <div className="h-10 w-[220px] bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
                    ) : (
                        <>
                            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                                {can('advanced_reports') ? (
                                    <div className="w-[220px]">
                                        <DatePicker
                                            date={date}
                                            setDate={setDate}
                                            placeholder="Selecione o período"
                                        />
                                    </div>
                                ) : (
                                    <Button
                                        variant={"ghost"}
                                        size="sm"
                                        className={cn("w-[220px] justify-start text-left font-medium text-sm text-slate-400 cursor-not-allowed")}
                                        onClick={() => setShowUpsell(true)}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                                        <span className="flex items-center gap-2">Mês Atual <Lock className="w-3 h-3" /></span>
                                    </Button>
                                )}
                            </div>
                            <UpsellModal
                                open={showUpsell}
                                onOpenChange={setShowUpsell}
                                title="Análise Avançada"
                                description="No plano Gratuito, a visão é limitada ao trimestre atual. Desbloqueie histórico completo, comparativos anuais e filtros personalizados no Premium."
                            />
                        </>
                    )
                }
                summaryCards={
                    <div className="flex flex-col gap-6">
                        <PremiumPassiveTip />
                        {/* BARRA GLOBAL DE SAÚDE FINANCEIRA (INTELIGÊNCIA) */}
                        <div className="w-full bg-slate-900 dark:bg-slate-950 rounded-xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg shadow-slate-900/10 border border-slate-800 relative overflow-hidden group">
                            {/* Background Glow */}
                            <div className="absolute top-0 right-0 w-[400px] h-full bg-gradient-to-l from-emerald-900/20 to-transparent pointer-events-none"></div>
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h2 className="text-white font-bold text-lg tracking-tight">Saúde Financeira: <span className="text-emerald-400">{healthStatus}</span></h2>
                                        <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-emerald-500/30">Score: {score}/100</Badge>
                                    </div>
                                    <p className="text-slate-400 text-sm font-medium flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Liquidez confortável
                                        <span className="text-slate-600 mx-1">•</span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Compromissos controlados
                                        <span className="text-slate-600 mx-1">•</span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Patrimônio crescente
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 w-full md:w-auto mt-2 md:mt-0 relative z-10">
                                <div className="flex-1 md:w-48">
                                    <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500 mb-1.5 tracking-wider">
                                        <span>Saldo Livre</span>
                                        <span className="text-white">{caixaLiquido > 0 ? Math.round((saldoLivre / caixaLiquido) * 100) : 0}%</span>
                                    </div>
                                    <Progress value={caixaLiquido > 0 ? (saldoLivre / caixaLiquido) * 100 : 0} className="h-1.5 bg-slate-800" indicatorClassName="bg-gradient-to-r from-emerald-500 to-teal-400" />
                                </div>
                                <Button variant="outline" size="sm" className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white h-9">
                                    Ver Diagnóstico
                                    <ArrowRight className="w-3.5 h-3.5 ml-2" />
                                </Button>
                            </div>
                        </div>

                        {/* FLUXO FINANCEIRO (Tríade da Verdade) */}
                        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
                            {/* 1. CAIXA */}
                            <Card className="group relative overflow-hidden border-l-4 border-l-blue-500 bg-white dark:bg-slate-900 shadow-sm hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Coins className="w-4 h-4 text-blue-500" />
                                            Dinheiro em Conta
                                        </div>
                                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-mono text-[10px]">LIQUIDEZ</Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-slate-900 dark:text-white mt-2 group-hover:text-blue-600 transition-colors">
                                        R$ {isLoading ? '...' : caixaLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2 font-medium">
                                        Disponível em conta corrente e carteiras.
                                    </p>
                                </CardContent>
                            </Card>
                            {/* 2. COMPROMISSOS */}
                            <Card className="group relative overflow-hidden border-l-4 border-l-amber-500 bg-white dark:bg-slate-900 shadow-sm hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 text-amber-500" />
                                            Comprometido
                                        </div>
                                        <Badge variant="secondary" className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-mono text-[10px]">OBRIGAÇÕES</Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-slate-900 dark:text-white mt-2 group-hover:text-amber-600 transition-colors">
                                        - R$ {isLoading ? '...' : comprometido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2 font-medium">
                                        Faturas de cartão e contas a pagar.
                                    </p>
                                </CardContent>
                            </Card>
                            {/* 3. DISPONIBILIDADE */}
                            <Card className="col-span-1 border-none bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/30 relative overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
                                <div className="absolute top-0 right-0 p-6 opacity-20">
                                    <CheckCircle2 className="w-32 h-32 text-white rotating-icon" />
                                </div>
                                <CardHeader className="pb-1">
                                    <CardTitle className="text-xs font-bold text-blue-100 uppercase tracking-widest flex items-center gap-2 relative z-10">
                                        <DollarSign className="w-4 h-4" /> Disponibilidade Real
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="relative z-10 pt-2">
                                    <div className="text-3xl font-bold tracking-tight">
                                        R$ {isLoading ? '...' : saldoLivre.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </div>
                                    <p className="text-xs text-blue-100 font-medium opacity-90 mt-2 flex items-center gap-2">
                                        <span className="bg-white/20 p-1 rounded-full"><CheckCircle2 className="w-3 h-3" /></span>
                                        Livre para usar agora.
                                    </p>
                                    <div className="mt-4 h-1 w-full bg-white/20 rounded-full overflow-hidden">
                                        <div className="h-full bg-white/80 w-[66%]"></div>
                                    </div>
                                </CardContent>
                            </Card>
                            {/* 4. PATRIMÔNIO */}
                            <Card className="bg-slate-900 text-white shadow-lg overflow-hidden relative border-none hover:shadow-xl hover:scale-[1.02] cursor-pointer transition-all duration-300 group">
                                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-900/40 to-slate-900"></div>
                                <CardHeader className="relative z-10 pb-2">
                                    <CardTitle className="text-xs font-bold text-emerald-300 uppercase tracking-widest flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4" /> Patrimônio Total
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="relative z-10">
                                    <div className="flex items-end gap-2 mt-2">
                                        <span className="text-3xl font-bold tracking-tight">R$ {isLoading ? '...' : patrimonioTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 bg-emerald-500/10 text-[10px]">+12.5% a.a.</Badge>
                                        <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">Não incluso na liquidez.</span>
                                    </div>
                                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 w-[80%] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                }
            >
                <div className="grid gap-8 lg:grid-cols-12">
                    {/* COLUNA ESQUERDA: Compromissos Detalhados */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        <Card className="shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full">
                            <CardHeader className="border-b border-slate-100 dark:border-slate-800/50 px-6 py-4 bg-slate-50/40 dark:bg-slate-900">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                        <CalendarIcon className="w-4 h-4 text-slate-500" />
                                        Cronograma
                                    </h3>
                                    <Button variant="link" size="sm" className="h-auto p-0 text-xs font-medium text-blue-600">Ver tudo</Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {[
                                        { desc: "Aluguel", date: "10 OUT", amount: 2500, status: "pending", icon: Landmark },
                                        { desc: "Energia (Enel)", date: "15 OUT", amount: 320.50, status: "pending", icon: AlertCircle },
                                        { desc: "Internet Fibra", date: "15 OUT", amount: 149.90, status: "future", icon: Wallet },
                                        { desc: "Nubank (Fatura)", date: "20 OUT", amount: 1250.00, status: "future", icon: CreditCard },
                                    ].map((bill, i) => (
                                        <div key={i} className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group cursor-default">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-full flex items-center justify-center border text-[10px] font-bold",
                                                    bill.status === 'pending'
                                                        ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800"
                                                        : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                                                )}>
                                                    {bill.date.split(' ')[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-blue-600 transition-colors">{bill.desc}</p>
                                                    <p className="text-[10px] text-slate-500 uppercase tracking-wide font-medium">{bill.status === 'pending' ? 'Vence em breve' : 'Agendado'}</p>
                                                </div>
                                            </div>
                                            <span className="font-semibold text-sm text-slate-900 dark:text-white tabular-nums">
                                                R$ {bill.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                            <CardFooter className="bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 p-4 mt-auto">
                                <div className="w-full flex justify-between items-center text-xs font-semibold uppercase text-slate-500 tracking-wider">
                                    <span>Total Previsto</span>
                                    <span className="text-base text-slate-900 dark:text-white font-bold">R$ 4.220,40</span>
                                </div>
                            </CardFooter>
                        </Card>
                    </div>
                    {/* COLUNA DIREITA: Tendência */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                        {/* Gráfico de Tendência COM ALERTA DE RISCO */}
                        <Card className="shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-1 min-h-[400px]">
                            <CardHeader className="border-b border-slate-100 dark:border-slate-800/50 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                            Tendência de Liquidez
                                        </CardTitle>
                                        <div className="text-xs text-slate-500">
                                            Simulação baseada em compromissos agendados.
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {['3m', '6m', '1y'].map((p) => (
                                            <Button
                                                key={p}
                                                variant={period === p ? 'secondary' : 'ghost'}
                                                size="sm"
                                                onClick={() => handlePeriodChange(p)}
                                                className={cn("h-7 text-xs font-medium px-2.5",
                                                    period === p
                                                        ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700"
                                                        : "text-slate-500 hover:text-slate-900",
                                                    !can('advanced_reports') && p !== '3m' && "opacity-50"
                                                )}
                                            >
                                                <span className="flex items-center gap-1">
                                                    {p === '3m' ? 'Trimestre' : p === '6m' ? 'Semestre' : 'Anual'}
                                                    {!can('advanced_reports') && p !== '3m' && <Lock className="w-2.5 h-2.5" />}
                                                </span>
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="px-6 pt-6 pb-2">
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={currentData}>
                                            <defs>
                                                <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset={off} stopColor="#2563EB" stopOpacity={0.2} />
                                                    <stop offset={off} stopColor="#EF4444" stopOpacity={0.2} />
                                                </linearGradient>
                                                {/* Gradientes para barras de Receitas e Despesas */}
                                                <linearGradient id="gradientReceitas" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.8} />
                                                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0.2} />
                                                </linearGradient>
                                                <linearGradient id="gradientDespesas" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8} />
                                                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.2} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800" vertical={false} />
                                            <XAxis dataKey="name" className="text-[10px] font-medium fill-slate-400" tickLine={false} axisLine={false} dy={10} />
                                            <YAxis className="text-[10px] font-medium fill-slate-400" tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} tickLine={false} axisLine={false} />
                                            <Tooltip
                                                content={({ active, payload, label }) => {
                                                    if (active && payload && payload.length) {
                                                        const saldo = payload.find(p => p.name === 'Saldo Projetado')?.value as number;
                                                        const receitas = payload.find(p => p.name === 'Receitas')?.value as number;
                                                        const despesas = payload.find(p => p.name === 'Despesas')?.value as number;

                                                        const isNegative = saldo < 0;
                                                        const formatVal = (val: number) => val?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00';

                                                        return (
                                                            <div className="bg-white dark:bg-slate-900 p-3 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl text-xs">
                                                                <p className="font-bold text-slate-700 dark:text-slate-300 mb-2">{label}</p>
                                                                <div className="space-y-1">
                                                                    <div className="flex items-center justify-between gap-4 text-emerald-600 dark:text-emerald-500">
                                                                        <span>Receitas:</span>
                                                                        <span>+{formatVal(receitas)}</span>
                                                                    </div>
                                                                    <div className="flex items-center justify-between gap-4 text-amber-600 dark:text-amber-500">
                                                                        <span>Despesas:</span>
                                                                        <span>-{formatVal(despesas)}</span>
                                                                    </div>
                                                                    <div className="my-2 border-t border-slate-100 dark:border-slate-800"></div>
                                                                    <div className={cn("flex items-center justify-between gap-4 font-bold text-base", isNegative ? "text-red-500" : "text-blue-600")}>
                                                                        <span className="flex items-center gap-1">
                                                                            {isNegative && <AlertCircle className="w-3 h-3" />}
                                                                            Saldo:
                                                                        </span>
                                                                        <span>R$ {formatVal(saldo)}</span>
                                                                    </div>
                                                                    {isNegative && (
                                                                        <div className="text-[10px] text-red-500 font-medium mt-1 bg-red-50 dark:bg-red-950/20 px-1.5 py-0.5 rounded">
                                                                            Risco de saldo negativo projetado
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Area
                                                name="Saldo Projetado"
                                                type="monotone"
                                                dataKey="saldo"
                                                stroke="#000"
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#splitColor)"
                                                style={{ stroke: 'url(#splitColorStroke)' }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="saldo"
                                                stroke="url(#splitColorStroke)"
                                                strokeWidth={3}
                                                dot={(props: any) => {
                                                    const { cx, cy, payload, key } = props;
                                                    if (payload.saldo < 0) {
                                                        return (
                                                            <circle key={key} cx={cx} cy={cy} r={4} stroke="#EF4444" strokeWidth={2} fill="#fff" />
                                                        );
                                                    }
                                                    return <circle key={key} cx={cx} cy={cy} r={0} />;
                                                }}
                                            />
                                            {/* Defining Gradient for Stroke matches visual requirement */}
                                            <defs>
                                                <linearGradient id="splitColorStroke" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset={off} stopColor="#2563EB" stopOpacity={1} />
                                                    <stop offset={off} stopColor="#EF4444" stopOpacity={1} />
                                                </linearGradient>
                                            </defs>
                                            {/* Barras de fundo COM GRADIENTE E BORDAS ARREDONDADAS */}
                                            <Bar name="Receitas" dataKey="receitas" fill="url(#gradientReceitas)" radius={[4, 4, 0, 0]} maxBarSize={24} />
                                            <Bar name="Despesas" dataKey="despesas" fill="url(#gradientDespesas)" radius={[4, 4, 0, 0]} maxBarSize={24} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </PageLayout>
        </>
    );
}
