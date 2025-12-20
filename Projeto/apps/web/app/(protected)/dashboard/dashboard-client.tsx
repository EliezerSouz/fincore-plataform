"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Activity, AlertTriangle, ArrowRight, ArrowUpRight, Calendar as CalendarIcon, CheckCircle2, HeartPulse, Lock, TrendingUp, Wallet, AlertCircle, PieChart, Target, TrendingDown } from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
import { DatePicker } from "@/components/ui/date-picker"
import { UpsellModal } from "@/components/ui/upsell-modal"
import { PremiumPassiveTip } from "@/components/premium-passive-tip"
import { PageLayout } from "@/components/layout/page-layout"
import { OnboardingModal } from "@/components/onboarding-modal"
import { useFinancialSummary } from "@/hooks/use-financial-summary"
import { usePermission } from "@/hooks/use-permission"
import { Progress } from "@/components/ui/progress"
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    ReferenceLine
} from 'recharts'

import { Skeleton } from "@/components/ui/skeleton"

// Tooltip Personalizado Rico
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const txData = payload[0].payload
        const isNegative = txData.saldo < 0

        return (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl shadow-xl min-w-[200px]">
                <p className="font-bold text-slate-800 dark:text-slate-100 mb-3 text-sm border-b border-slate-100 dark:border-slate-800 pb-2">{label}</p>

                <div className="space-y-2 text-xs">
                    {/* Receitas */}
                    <div className="flex justify-between items-center group">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                            <span className="text-slate-500 group-hover:text-slate-700 transition-colors">Receitas</span>
                        </div>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                            {formatCurrency(txData.receita)}
                        </span>
                    </div>

                    {/* Despesas */}
                    <div className="flex justify-between items-center group">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.5)]" />
                            <span className="text-slate-500 group-hover:text-slate-700 transition-colors">Despesas</span>
                        </div>
                        <span className="font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                            {formatCurrency(txData.despesa)}
                        </span>
                    </div>

                    {/* Divisor */}
                    <div className="my-2 border-t border-slate-100 dark:border-slate-700" />

                    {/* Saldo Líquido */}
                    <div className="flex justify-between items-center">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Resultado</span>
                        <span className={`font-bold text-sm tabular-nums transition-colors duration-300 ${isNegative ? 'text-red-600 dark:text-red-500' : 'text-blue-600 dark:text-blue-400'}`}>
                            {formatCurrency(txData.saldo)}
                        </span>
                    </div>

                    {/* Alerta Condicional */}
                    {isNegative && (
                        <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-900/30 flex items-center gap-2 text-red-700 dark:text-red-300 animate-in fade-in slide-in-from-top-1">
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="text-[10px] font-bold uppercase tracking-wide">Déficit Mensal Detectado</span>
                        </div>
                    )}
                </div>
            </div>
        )
    }
    return null
}

const CustomizedDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (payload.saldo < 0) {
        return (
            <svg x={cx - 10} y={cy - 10} width={20} height={20} fill="red" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="#ef4444" stroke="white" strokeWidth="2" />
                <path d="M12 8v4M12 16h.01" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
        )
    }
    return <circle cx={cx} cy={cy} r={4} stroke="white" strokeWidth={2} fill="#3b82f6" />
};

interface DashboardClientProps {
    userData: any
}

export function DashboardClient({ userData }: DashboardClientProps) {
    const [isMounted, setIsMounted] = useState(false)
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [showUpsell, setShowUpsell] = useState(false)
    const [period, setPeriod] = useState('3m')
    
    const { can } = usePermission()
    const { liquidez, compromissos, patrimonio, isLoading } = useFinancialSummary()

    useEffect(() => {
        setIsMounted(true)
    }, [])

    // --- FINANCIAL INTELLIGENCE LOGIC ---

    // Mock Income (Receita Mensal Estimada) - Em produção viria do backend
    const estimatedIncome = 8500 
    
    // Mock Investment Data (Should come from backend)
    const investments = {
        total: 125000.50,
        monthlyReturn: 1250.00,
        returnRate: 1.0, // 1%
        allocation: [
            { name: 'Renda Fixa', value: 65, color: '#10b981' }, // emerald-500
            { name: 'Renda Variável', value: 25, color: '#3b82f6' }, // blue-500
            { name: 'Cripto', value: 10, color: '#8b5cf6' }, // violet-500
        ]
    }
    const hasInvestments = investments.total > 0

    // 1. Calculate Score (0-1000)
    // Logic: Ratio of Liquidity coverage + Low Commitment ratio
    const calculateScore = () => {
        if (compromissos === 0) return 1000
        const coverageRatio = liquidez / compromissos // Ideal > 1.5
        const commitmentRatio = compromissos / estimatedIncome // Ideal < 0.6
        
        let s = 500 // Base score
        
        // Bonus for liquidity
        if (coverageRatio >= 1) s += 200
        if (coverageRatio >= 3) s += 100
        
        // Penalty for high commitments
        if (commitmentRatio > 0.8) s -= 200
        if (commitmentRatio > 1.0) s -= 300
        
        return Math.max(0, Math.min(1000, s))
    }

    const score = calculateScore()
    
    // 2. Determine Health Status & Color
    let healthStatus = 'Excelente'
    let healthColor = 'text-emerald-500'
    let healthBg = 'bg-emerald-500'
    let healthBorder = 'border-emerald-500'
    
    if (score < 500) {
        healthStatus = 'Crítico'
        healthColor = 'text-red-500'
        healthBg = 'bg-red-500'
        healthBorder = 'border-red-500'
    } else if (score < 800) {
        healthStatus = 'Atenção'
        healthColor = 'text-amber-500'
        healthBg = 'bg-amber-500'
        healthBorder = 'border-amber-500'
    }

    // 3. Calculate Runway (Sobrevivência)
    // Quantos meses vivo sem renda?
    const monthlyBurn = compromissos > 0 ? compromissos : 1
    const runwayMonths = (liquidez / monthlyBurn).toFixed(1)

    // 4. Generate Insights
    const getMainInsight = () => {
        if (score >= 800) return "Seu coração financeiro está batendo forte. Você tem reserva para emergências e sobra de caixa."
        if (score >= 500) return "Sinais de arritmia detectados. Seus compromissos estão altos em relação à sua liquidez."
        return "Alerta de parada cardíaca. Seus compromissos superam sua capacidade de pagamento imediata."
    }

    // Mock Chart Data for Trend
    const trendData = [
         { name: 'Ago', receita: 4600, despesa: 3000, saldo: 1600 },
         { name: 'Set', receita: 5210, despesa: 3000, saldo: 2210 },
         { name: 'Out', receita: 2500, despesa: 3000, saldo: -500 }, // Negative moment
         { name: 'Nov', receita: 5000, despesa: 3000, saldo: 2000 },
         { name: 'Dez', receita: 5181, despesa: 3000, saldo: 2181 },
         { name: 'Jan', receita: 5500, despesa: 3000, saldo: 2500 },
    ]

    // Mock Spending Data (Pillar 3: Consciência)
    const spendingCategories = [
        { name: 'Moradia', value: 3200, percent: 38, status: 'normal' },
        { name: 'Alimentação', value: 1800, percent: 21, status: 'warning' }, // Higher than usual
        { name: 'Lazer', value: 1200, percent: 14, status: 'normal' },
    ]

    // Mock Goal Data (Pillar 5: Progresso)
    const mainGoal = {
        name: 'Reserva de Emergência',
        current: liquidez,
        target: compromissos * 6, // 6 months of runway
        deadline: 'Dez 2024'
    }

    const handlePeriodChange = (p: string) => {
        if (!can('advanced_reports') && p !== '3m') {
            setShowUpsell(true)
            return
        }
        setPeriod(p)
    }

    return (
        <>
            <OnboardingModal />
            <PageLayout
                title="FinCore Dashboard"
                description="O coração da sua vida financeira."
                icon={Activity}
                action={
                    !isMounted ? (
                        <Skeleton className="h-10 w-[220px]" />
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
                                        className={cn("h-11 w-full md:w-[220px] justify-start text-left font-medium text-sm text-slate-400 cursor-not-allowed")}
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
                    <div className="flex flex-col gap-8 animate-in slide-in-from-bottom-4 duration-700">
                        <PremiumPassiveTip />
                        
                        {/* 1. HEALTH MONITOR (Diagnóstico Principal) */}
                        <div className="grid gap-6 lg:grid-cols-3">
                            <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-800 p-8 flex flex-col justify-between min-h-[280px]">
                                {/* Background Pulse Effect */}
                                <div className="absolute top-0 right-0 w-[400px] h-full bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none"></div>
                                <div className={cn("absolute -bottom-24 -right-24 w-64 h-64 blur-[100px] rounded-full animate-pulse opacity-30", healthBg)}></div>
                                
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className={cn("px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider flex items-center gap-2", 
                                            healthStatus === 'Excelente' ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : 
                                            healthStatus === 'Crítico' ? "bg-red-500/20 text-red-400 border-red-500/30" :
                                            "bg-amber-500/20 text-amber-400 border-amber-500/30"
                                        )}>
                                            <Activity className="w-3 h-3 animate-pulse" />
                                            {isLoading ? "Analisando..." : `Status: ${healthStatus}`}
                                        </div>
                                    </div>
                                    
                                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 leading-tight">
                                        {isLoading ? (
                                            <Skeleton className="h-12 w-3/4 bg-slate-800" />
                                        ) : (
                                            getMainInsight()
                                        )}
                                    </h2>
                                </div>

                                <div className="relative z-10 mt-auto pt-6 border-t border-slate-800/50 flex flex-wrap gap-8">
                                    <div>
                                        <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Score FinCore</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className={cn("text-4xl font-mono font-bold", healthColor)}>
                                                {isLoading ? "..." : score}
                                            </span>
                                            <span className="text-slate-500 text-sm">/ 1000</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Sobrevivência (Runway)</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-mono font-bold text-white">
                                                {isLoading ? "..." : runwayMonths}
                                            </span>
                                            <span className="text-slate-500 text-sm">meses</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. ALERTS & ACTION (O que fazer agora) */}
                            <Card className="flex flex-col h-full border-l-4 border-l-amber-500 shadow-lg bg-amber-50/50 dark:bg-slate-900 dark:border-l-amber-500 dark:border-slate-800">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg flex items-center gap-2 text-amber-700 dark:text-amber-500">
                                        <AlertTriangle className="w-5 h-5" />
                                        Atenção Necessária
                                    </CardTitle>
                                    <CardDescription>Ações recomendadas para hoje.</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    {isLoading ? (
                                        <div className="space-y-3">
                                            <Skeleton className="h-12 w-full" />
                                            <Skeleton className="h-12 w-full" />
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {compromissos > liquidez && (
                                                <div className="flex gap-3 p-3 rounded-lg bg-white dark:bg-slate-950 border border-amber-100 dark:border-slate-800 shadow-sm">
                                                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Liquidez Baixa</p>
                                                        <p className="text-xs text-slate-500">Seus compromissos superam seu caixa atual.</p>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex gap-3 p-3 rounded-lg bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-sm group cursor-pointer hover:border-emerald-200 transition-colors">
                                                <CheckCircle2 className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Revisar Assinaturas</p>
                                                    <p className="text-xs text-slate-500">Detectamos 3 pagamentos recorrentes esta semana.</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-3 p-3 rounded-lg bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-sm group cursor-pointer hover:border-emerald-200 transition-colors">
                                                <CheckCircle2 className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Definir Meta de Reserva</p>
                                                    <p className="text-xs text-slate-500">Você ainda não tem uma meta de emergência.</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="pt-2 border-t border-amber-100/50 dark:border-slate-800">
                                    <Button variant="ghost" size="sm" className="w-full text-amber-700 dark:text-amber-500 hover:text-amber-800 hover:bg-amber-100/50">
                                        Ver todos os alertas <ArrowRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>

                        {/* 2. FLOW & SPENDING (Fluxo e Consciência) */}
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Card de Fluxo (Input vs Output) */}
                            <Card className="shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                        <Activity className="w-4 h-4" /> Fluxo Vital
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <span className="text-3xl font-bold text-slate-900 dark:text-white">
                                                    {Math.round((compromissos / estimatedIncome) * 100)}%
                                                </span>
                                                <span className="text-sm text-slate-500 ml-2">da renda comprometida</span>
                                            </div>
                                            <div className="text-right">
                                                <span className={cn("text-sm font-medium", (estimatedIncome - compromissos) > 0 ? "text-emerald-600 dark:text-emerald-500" : "text-red-500")}>
                                                    {((estimatedIncome - compromissos) > 0 ? "+ " : "") + "R$ " + (estimatedIncome - compromissos).toLocaleString('pt-BR')}
                                                </span>
                                                <p className="text-xs text-slate-400">Sobra Mensal</p>
                                            </div>
                                        </div>
                                        
                                        {/* Progress Bar Visualization */}
                                        <div className="relative pt-2">
                                            <div className="flex justify-between text-xs font-semibold mb-2 text-slate-400">
                                                <span>0%</span>
                                                <span>60% (Limite)</span>
                                                <span>100%</span>
                                            </div>
                                            <Progress value={(compromissos / estimatedIncome) * 100} className="h-4 bg-slate-100 dark:bg-slate-800" indicatorClassName={cn(compromissos / estimatedIncome > 0.8 ? "bg-red-500" : compromissos / estimatedIncome > 0.6 ? "bg-amber-500" : "bg-emerald-500")} />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1">Entradas (Est.)</p>
                                                <p className="font-semibold text-slate-700 dark:text-slate-300">R$ {estimatedIncome.toLocaleString('pt-BR')}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1">Saídas (Fixas)</p>
                                                <p className="font-semibold text-slate-700 dark:text-slate-300">R$ {compromissos.toLocaleString('pt-BR')}</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Card de Consciência (Spending) */}
                            <Card className="shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                        <PieChart className="w-4 h-4" /> Para onde vai o dinheiro?
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {spendingCategories.map((cat, i) => (
                                            <div key={i} className="group">
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="font-medium text-slate-700 dark:text-slate-300">{cat.name}</span>
                                                    <span className="text-slate-900 dark:text-white font-bold">R$ {cat.value.toLocaleString('pt-BR')}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Progress value={cat.percent} className="h-2 bg-slate-100 dark:bg-slate-800" indicatorClassName={cat.status === 'warning' ? 'bg-amber-500' : 'bg-slate-900 dark:bg-slate-400'} />
                                                    <span className="text-xs text-slate-500 w-8 text-right">{cat.percent}%</span>
                                                </div>
                                                {cat.status === 'warning' && (
                                                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                                        <TrendingUp className="w-3 h-3" /> 12% acima da média
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                                        <Button variant="link" className="p-0 h-auto text-xs text-slate-500 hover:text-primary">
                                            Ver detalhamento completo <ArrowRight className="w-3 h-3 ml-1" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                }
            >
                {/* 3. EVOLUTION & GOALS (Progresso) */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Evolution Chart */}
                    <Card className="lg:col-span-2 shadow-sm border border-slate-200 dark:border-slate-800">
                        <CardHeader className="border-b border-slate-100 dark:border-slate-800/50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                                        <HeartPulse className="w-5 h-5 text-emerald-500" />
                                        Eletrocardiograma Financeiro
                                    </CardTitle>
                                    <CardDescription>
                                        Evolução do seu Saldo Livre nos últimos 6 meses.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart
                                        data={trendData}
                                        margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                                        <XAxis
                                            dataKey="name"
                                            scale="point"
                                            padding={{ left: 10, right: 10 }}
                                            tick={{ fontSize: 12, fill: '#64748b' }}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            tickFormatter={(value) => `R$${value / 1000}k`}
                                            tick={{ fontSize: 12, fill: '#64748b' }}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', opacity: 0.5 }} />
                                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                        <ReferenceLine y={0} stroke="#94a3b8" />
                                        <Bar dataKey="receita" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} fillOpacity={0.9} />
                                        <Bar dataKey="despesa" name="Despesas" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} fillOpacity={0.9} />
                                        <Line
                                            type="monotone"
                                            dataKey="saldo"
                                            name="Saldo Líquido"
                                            stroke="#3b82f6"
                                            strokeWidth={3}
                                            dot={<CustomizedDot />}
                                            activeDot={{ r: 8, stroke: "#fff", strokeWidth: 2 }}
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Goals Card or Investments Summary */}
                    {hasInvestments ? (
                        <Card className="shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                    <Wallet className="w-4 h-4" /> Investimentos
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="mb-6">
                                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                                        {formatCurrency(investments.total)}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-400">
                                            <ArrowUpRight className="w-3 h-3 mr-1" />
                                            {investments.returnRate}% este mês
                                        </Badge>
                                        <span className="text-xs text-slate-500">+{formatCurrency(investments.monthlyReturn)}</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {investments.allocation.map((item) => (
                                        <div key={item.name} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                                <span className="text-slate-600 dark:text-slate-400">{item.name}</span>
                                            </div>
                                            <span className="font-medium">{item.value}%</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                                    <Button variant="outline" className="w-full text-xs" size="sm">
                                        Ver Detalhes <ArrowRight className="w-3 h-3 ml-2" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col">
                             <CardHeader>
                                <CardTitle className="text-base font-semibold flex items-center gap-2">
                                    <Target className="w-5 h-5 text-indigo-500" />
                                    Próxima Conquista
                                </CardTitle>
                                <CardDescription>Foco total nesta meta.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col justify-center">
                                <div className="text-center mb-6">
                                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 mb-3 relative">
                                        <Target className="w-8 h-8" />
                                        <svg className="absolute w-full h-full transform -rotate-90">
                                            <circle
                                                cx="40"
                                                cy="40"
                                                r="36"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                                fill="none"
                                                className="text-slate-100 dark:text-slate-800"
                                            />
                                            <circle
                                                cx="40"
                                                cy="40"
                                                r="36"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                                fill="none"
                                                strokeDasharray={226}
                                                strokeDashoffset={226 - (226 * Math.min((mainGoal.current / mainGoal.target), 1))}
                                                className="text-indigo-500 transition-all duration-1000 ease-out"
                                            />
                                        </svg>
                                    </div>
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{mainGoal.name}</h3>
                                    <p className="text-sm text-slate-500">Alvo: R$ {mainGoal.target.toLocaleString('pt-BR')}</p>
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Progresso</span>
                                        <span className="font-bold text-indigo-600">{Math.round((mainGoal.current / mainGoal.target) * 100)}%</span>
                                    </div>
                                    <Progress value={(mainGoal.current / mainGoal.target) * 100} className="h-2 bg-slate-100 dark:bg-slate-800" indicatorClassName="bg-indigo-500" />
                                    <p className="text-xs text-center text-slate-400 mt-4">
                                        Faltam R$ {(mainGoal.target - mainGoal.current).toLocaleString('pt-BR')} para atingir.
                                    </p>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                 <Button variant="ghost" size="sm" className="w-full text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
                                    Gerenciar Metas <ArrowRight className="w-4 h-4 ml-1" />
                                </Button>
                            </CardFooter>
                        </Card>
                    )}
                </div>
            </PageLayout>
        </>
    )
}
