"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Activity, AlertTriangle, ArrowRight, ArrowUpRight, Calendar as CalendarIcon, CheckCircle2, HeartPulse, Heart, Lock, TrendingUp, Wallet, AlertCircle, PieChart, Target, TrendingDown, Tag, CreditCard, Info, ChevronDown, ChevronUp } from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
import { CATEGORY_ICONS } from "@/lib/icons"
import { DatePicker } from "@/components/ui/date-picker"
import { UpsellModal } from "@/components/ui/upsell-modal"
import { PremiumPassiveTip } from "@/components/premium-passive-tip"
import { PageLayout } from "@/components/layout/page-layout"
import { OnboardingModal } from "@/components/onboarding-modal"
import { useFinancialSummary } from "@/hooks/use-financial-summary"
import { usePermission } from "@/hooks/use-permission"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    Legend,
    ReferenceLine
} from 'recharts'

import { Skeleton } from "@/components/ui/skeleton"
import { InvoiceDetailsModal } from "@/features/cards/components/invoice-details-modal"
import { HeartbeatCore } from "@/components/heartbeat-core"

import { siteConfig } from "@/config/site"

// Tooltip Personalizado Rico
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const txData = payload[0].payload
        const isNegative = txData.saldo < 0

        return (
            <div className="bg-card border border-border p-4 rounded-xl shadow-xl min-w-[200px]">
                <p className="font-bold text-foreground mb-3 text-sm border-b border-border pb-2">{label}</p>

                <div className="space-y-2 text-xs">
                    {/* Receitas */}
                    <div className="flex justify-between items-center group">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-wealth shadow-[0_0_5px_rgba(5,150,105,0.5)]" />
                            <span className="text-muted-foreground group-hover:text-foreground transition-colors">Receitas</span>
                        </div>
                        <span className="font-semibold text-wealth tabular-nums">
                            {formatCurrency(txData.receita)}
                        </span>
                    </div>

                    {/* Despesas */}
                    <div className="flex justify-between items-center group">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-danger shadow-[0_0_5px_rgba(239,68,68,0.5)]" />
                            <span className="text-muted-foreground group-hover:text-foreground transition-colors">Despesas</span>
                        </div>
                        <span className="font-semibold text-danger tabular-nums">
                            {formatCurrency(txData.despesa)}
                        </span>
                    </div>

                    {/* Divisor */}
                    <div className="my-2 border-t border-border" />

                    {/* Saldo Líquido */}
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground font-medium">Resultado Mensal</span>
                        <span className={`font-bold text-sm tabular-nums transition-colors duration-300 ${isNegative ? 'text-danger' : 'text-primary'}`}>
                            {formatCurrency(txData.saldo)}
                        </span>
                    </div>

                    {/* Alerta Condicional */}
                    {isNegative && (
                        <div className="mt-3 p-2 bg-danger/10 rounded border border-danger/20 flex items-center gap-2 text-danger animate-in fade-in slide-in-from-top-1">
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
            <svg x={cx - 10} y={cy - 10} width={20} height={20} fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="#EF4444" stroke="white" strokeWidth="2" />
                <path d="M12 8v4M12 16h.01" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
        )
    }
    return <circle cx={cx} cy={cy} r={4} stroke="white" strokeWidth={2} fill="#1E3A8A" />
};

interface CompactAlertCardProps {
    icon: React.ElementType
    title: string
    subtitle?: string
    value: string | React.ReactNode
    actionLabel: string
    onAction: () => void
    variant?: 'critical' | 'warning' | 'info'
}

const CompactAlertCard = ({ icon: Icon, title, subtitle, value, actionLabel, onAction, variant = 'critical' }: CompactAlertCardProps) => {
    const colors = {
        critical: {
            container: 'border-l-danger shadow-[0_0_15px_-5px_rgba(239,68,68,0.15)] hover:shadow-[0_0_20px_-5px_rgba(239,68,68,0.3)] bg-gradient-to-r from-danger/5 to-transparent',
            iconBg: 'bg-danger/10',
            icon: 'text-danger animate-pulse',
            text: 'text-danger'
        },
        warning: {
            container: 'border-l-risk shadow-[0_0_15px_-5px_rgba(245,158,11,0.15)] hover:shadow-[0_0_20px_-5px_rgba(245,158,11,0.3)] bg-gradient-to-r from-risk/5 to-transparent',
            iconBg: 'bg-risk/10',
            icon: 'text-risk',
            text: 'text-risk'
        },
        info: {
            container: 'border-l-primary shadow-[0_0_15px_-5px_rgba(59,130,246,0.15)] hover:shadow-[0_0_20px_-5px_rgba(59,130,246,0.3)] bg-gradient-to-r from-primary/5 to-transparent',
            iconBg: 'bg-primary/10',
            icon: 'text-primary',
            text: 'text-primary'
        }
    }
    const style = colors[variant]

    return (
        <div className={cn("flex items-center justify-between p-3 rounded-lg border border-border border-l-4 transition-all duration-300 bg-card", style.container)}>
            <div className="flex items-center gap-3">
                <div className={cn("p-1.5 rounded-full", style.iconBg)}>
                    <Icon className={cn("w-4 h-4", style.icon)} />
                </div>
                <div>
                    <h4 className={cn("font-bold text-xs leading-tight mb-0.5", style.text)}>{title}</h4>
                    {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
                </div>
            </div>
            <div className="text-right">
                <div className="font-mono font-bold text-foreground mb-1 text-xs">{value}</div>
                <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 hover:bg-background/50" onClick={onAction}>
                    {actionLabel}
                </Button>
            </div>
        </div>
    )
}

interface DashboardClientProps {
    userData: any
}

export function DashboardClient({ userData }: DashboardClientProps) {
    const [isMounted, setIsMounted] = useState(false)
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [showUpsell, setShowUpsell] = useState(false)
    const [period, setPeriod] = useState('3m')
    const [isChartExpanded, setIsChartExpanded] = useState(true)
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)

    const { can } = usePermission()
    const {
        liquidez,
        compromissos,
        patrimonio,
        receitaMensal,
        despesaMensal,
        history,
        topCategories,
        invoices,
        isLoading,
        refetch,
        payablesTotal,
        invoicesTotal,
        totalBalance: serverTotalBalance,
        availableForCalculations: serverAvailableForCalculations,
        healthStatus: serverHealthStatus,
        score: serverScore,
        runway: serverRunway
    } = useFinancialSummary()

    useEffect(() => {
        setIsMounted(true)
    }, [])

    // --- FINANCIAL INTELLIGENCE LOGIC ---

    // Mock Investment Data (Should come from backend)
    const investments = {
        total: patrimonio, // Using real data
        monthlyReturn: 0, // Not available yet
        returnRate: 0, // Not available yet
        allocation: [
            { name: 'Renda Fixa', value: 0, color: '#059669' },
            { name: 'Renda Variável', value: 0, color: '#1E3A8A' },
            { name: 'Cripto', value: 0, color: '#7C3AED' },
        ]
    }
    const hasInvestments = investments.total > 0

    // 1. Get Metrics from Backend (or fallback to basic calculation if loading/empty)
    const realBalance = serverTotalBalance !== undefined ? serverTotalBalance : liquidez
    const availableBalance = serverAvailableForCalculations !== undefined ? serverAvailableForCalculations : (liquidez - compromissos)
    const healthStatus = serverHealthStatus || 'Estável'
    const score = serverScore !== undefined ? serverScore : 500
    const runwayMonths = serverRunway !== undefined ? serverRunway : 0

    // 5. Generate Insights
    const getMainInsight = () => {
        if (healthStatus === 'Excelente') return {
            title: "Excelente. Seu coração financeiro bate forte.",
            subtitle: "Você tem fôlego de sobra para investir e crescer."
        }
        if (healthStatus === 'Estável') return {
            title: "Estável. Seu coração financeiro bate no ritmo certo.",
            subtitle: "Você tem fôlego real para manter seus planos e compromissos em dia."
        }
        if (healthStatus === 'Atenção') return {
            title: "Atenção ao ritmo do seu coração financeiro.",
            subtitle: "O saldo é positivo, mas a margem é curta. Cuidado com novos gastos."
        }
        return {
            title: "Atenção: Arritmia Financeira detectada.",
            subtitle: "A situação exige organização para recuperar o fôlego."
        }
    }

    const insight = getMainInsight()

    // --- ALERTS SYSTEM ---
    const alerts = []

    // 1. Overdue Invoices
    const overdueInvoices = invoices.filter(inv => inv.days_remaining < 0)
    overdueInvoices.forEach(inv => {
        alerts.push({
            id: `inv-overdue-${inv.id}`,
            variant: 'critical' as const,
            icon: CreditCard,
            title: 'Fatura Vencida',
            subtitle: `${inv.card_name} • ${Math.abs(inv.days_remaining)} dias de atraso`,
            value: formatCurrency(inv.amount),
            actionLabel: 'Pagar Agora',
            onAction: () => {
                setSelectedInvoiceId(inv.id)
                setIsInvoiceModalOpen(true)
            }
        })
    })

    // 2. Liquidity & Cash Alerts
    if (realBalance < 0) {
        alerts.push({
            id: 'alert-liquidity-negative',
            variant: 'critical' as const,
            icon: AlertCircle,
            title: 'Sinal de Arritmia',
            subtitle: 'Seu coração financeiro está sob pressão. Regularizar agora evita complicações maiores.',
            value: formatCurrency(realBalance),
            actionLabel: 'Regularizar',
            onAction: () => {
                const element = document.getElementById('cash-flow-card')
                if (element) element.scrollIntoView({ behavior: 'smooth' })
            }
        })
    } else if (compromissos > liquidez) {
        const deficit = compromissos - liquidez
        const canCoverWithInvestments = investments.total >= deficit

        if (canCoverWithInvestments) {
            alerts.push({
                id: 'alert-commitments-investments',
                variant: 'info' as const,
                icon: Info,
                title: 'Resgate Sugerido',
                subtitle: 'Compromissos pressionam o caixa. Use seus investimentos para manter o fluxo.',
                value: formatCurrency(deficit),
                actionLabel: 'Ver Investimentos',
                onAction: () => {
                    // Assuming investments card is visible
                }
            })
        } else {
            alerts.push({
                id: 'alert-commitments-high',
                variant: 'critical' as const,
                icon: TrendingDown,
                title: 'Pressão de Caixa',
                subtitle: 'Seus compromissos estão pressionando seu caixa atual. Ajuste o fluxo para evitar paradas.',
                value: formatCurrency(deficit),
                actionLabel: 'Analisar',
                onAction: () => {
                    const element = document.getElementById('cash-flow-card')
                    if (element) element.scrollIntoView({ behavior: 'smooth' })
                }
            })
        }
    }

    // 3. Upcoming Invoices (Next 3 days)
    const upcomingInvoices = invoices.filter(inv => inv.days_remaining >= 0 && inv.days_remaining <= 3)
    upcomingInvoices.forEach(inv => {
        alerts.push({
            id: `inv-upcoming-${inv.id}`,
            variant: 'warning' as const,
            icon: CalendarIcon,
            title: 'Vence em Breve',
            subtitle: `${inv.card_name} • ${inv.days_remaining === 0 ? 'Vence Hoje' : 'Vence em ' + inv.days_remaining + ' dias'}`,
            value: formatCurrency(inv.amount),
            actionLabel: 'Pagar',
            onAction: () => {
                setSelectedInvoiceId(inv.id)
                setIsInvoiceModalOpen(true)
            }
        })
    })

    // Use Real History Data
    const trendData = history && history.length > 0 ? history : []

    // Mock Goal Data (Pillar 5: Progresso)
    // If commitments are 0, use a default target of 1000 to avoid division by zero
    const targetAmount = Math.max(compromissos * 6, 1000)
    const mainGoal = {
        name: 'Reserva de Emergência',
        current: liquidez,
        target: targetAmount,
        deadline: 'Dez 2024'
    }

    const goalProgress = Math.min((mainGoal.current / mainGoal.target), 1)
    const safeGoalProgress = isNaN(goalProgress) ? 0 : goalProgress

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
                title={`${siteConfig.name} Dashboard`}
                description={siteConfig.slogan}
                icon={Activity}
                action={
                    !isMounted ? (
                        <Skeleton className="h-10 w-[220px]" />
                    ) : (
                        <>
                            <div className="flex items-center gap-2 bg-card p-1 rounded-lg border border-border shadow-sm">
                                {can('advanced_reports') ? (
                                    <div className="w-[220px]">
                                        {/* DatePicker removed as per user request */}
                                    </div>
                                ) : (
                                    null
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

                        {/* 1. HEALTH MONITOR (Diagnóstico Principal) - Full Width */}
                        <div className="mb-6">
                            <HeartbeatCore
                                state={{
                                    totalBalance: realBalance,
                                    commitments: invoicesTotal,
                                    available: availableBalance,
                                    status: healthStatus,
                                    score: score,
                                    runwayMonths: runwayMonths,
                                    overdueCount: overdueInvoices.length
                                }}
                                insight={insight}
                                isLoading={isLoading}
                            />
                        </div>

                        {/* 2. CRITICAL ALERTS AREA */}
                        {alerts.length > 0 && (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8 animate-in slide-in-from-top-4 duration-500">
                                {alerts.map(alert => (
                                    <CompactAlertCard
                                        key={alert.id}
                                        icon={alert.icon}
                                        title={alert.title}
                                        subtitle={alert.subtitle}
                                        value={alert.value}
                                        actionLabel={alert.actionLabel}
                                        onAction={alert.onAction}
                                        variant={alert.variant}
                                    />
                                ))}
                            </div>
                        )}

                        {/* 2. FLOW & SPENDING (Fluxo e Consciência) */}
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Card de Fluxo (Input vs Output) - FINCORE Colors */}
                            <Card className={cn(
                                "shadow-sm border-l-4 transition-all duration-300 hover:shadow-lg",
                                (receitaMensal - despesaMensal) > 0
                                    ? "border-l-emerald-500 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent"
                                    : (receitaMensal - despesaMensal) < 0
                                        ? "border-l-red-500 bg-gradient-to-br from-red-500/5 via-transparent to-transparent"
                                        : "border-l-border"
                            )} id="cash-flow-card">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                        <Activity className={cn(
                                            "w-4 h-4",
                                            (receitaMensal - despesaMensal) > 0 ? "text-emerald-500" :
                                                (receitaMensal - despesaMensal) < 0 ? "text-red-500" : "text-muted-foreground"
                                        )} />
                                        Fluxo de Caixa (Mês)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <span className={cn("text-3xl font-bold tracking-tight drop-shadow-sm",
                                                    (receitaMensal - despesaMensal) > 0 ? "text-wealth" :
                                                        (receitaMensal - despesaMensal) < 0 ? "text-danger" : "text-foreground"
                                                )}>
                                                    {formatCurrency(receitaMensal - despesaMensal)}
                                                </span>
                                                <span className="text-sm text-muted-foreground ml-2 font-medium">saldo realizado</span>
                                            </div>
                                            <div className="text-right">
                                                <div className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold",
                                                    receitaMensal > 0 && (despesaMensal / receitaMensal) <= 0.8 ? "bg-wealth/10 text-wealth" : "bg-risk/10 text-risk"
                                                )}>
                                                    {receitaMensal > 0 ? ((despesaMensal / receitaMensal) * 100).toFixed(0) : 0}% da receita
                                                </div>
                                            </div>
                                        </div>

                                        {/* Progress Bar Visualization */}
                                        <div className="relative pt-2">
                                            <div className="flex justify-between text-xs font-semibold mb-2 text-muted-foreground">
                                                <span className="flex items-center gap-1"><ArrowUpRight className="w-3 h-3 text-wealth" /> Entradas</span>
                                                <span className="flex items-center gap-1">Saídas <ArrowUpRight className="w-3 h-3 text-danger rotate-90" /></span>
                                            </div>
                                            <div className="h-4 w-full bg-muted rounded-full overflow-hidden relative">
                                                {/* Gradient Background for Bar */}
                                                <div className="absolute inset-0 bg-muted/50" />
                                                <div
                                                    className={cn("h-full transition-all duration-1000 ease-out relative",
                                                        receitaMensal > 0 && (despesaMensal / receitaMensal) > 1.0 ? "bg-gradient-to-r from-danger to-red-600" :
                                                            receitaMensal > 0 && (despesaMensal / receitaMensal) > 0.8 ? "bg-gradient-to-r from-risk to-amber-600" : "bg-gradient-to-r from-wealth to-emerald-600"
                                                    )}
                                                    style={{ width: `${Math.min((despesaMensal / (receitaMensal || 1)) * 100, 100)}%` }}
                                                >
                                                    {/* Shimmer Effect */}
                                                    <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] skew-x-12"></div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 pt-4 mt-2 border-t border-border/50">
                                            <div className="p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Receitas</p>
                                                <p className="font-bold text-wealth">{formatCurrency(receitaMensal)}</p>
                                            </div>
                                            <div className="p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Despesas</p>
                                                <p className="font-bold text-danger">{formatCurrency(despesaMensal)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Card de Consciência (Spending) - FINCORE Colors */}
                            <Card className="shadow-sm hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent border-l-4 border-l-purple-500">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                        <PieChart className="w-4 h-4 text-purple-500" /> Para onde vai o dinheiro?
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground font-normal mt-1">Categorias que mais pressionam seu caixa neste período</p>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {topCategories && topCategories.length > 0 ? topCategories.map((cat, i) => {
                                            const IconComponent = CATEGORY_ICONS[cat.icon as keyof typeof CATEGORY_ICONS]?.icon || Tag
                                            return (
                                                <div key={i} className="group relative">
                                                    <div className="flex justify-between items-center text-sm mb-2 relative z-10">
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
                                                                style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                                                            >
                                                                <IconComponent className="w-4 h-4" />
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-foreground leading-none mb-1 group-hover:text-primary transition-colors">{cat.name}</div>
                                                                <div className="text-xs text-muted-foreground">{cat.percent.toFixed(1)}% do total</div>
                                                            </div>
                                                        </div>
                                                        <span className="text-foreground font-bold font-mono">{formatCurrency(cat.value)}</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-1000 ease-out relative"
                                                            style={{ width: `${cat.percent}%`, backgroundColor: cat.color || '#3b82f6' }}
                                                        >
                                                            {/* Subtle shine on bar */}
                                                            <div className="absolute top-0 right-0 bottom-0 width-[1px] bg-white/30 shadow-[0_0_10px_white]"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        }) : (
                                            <div className="text-center py-8 text-muted-foreground text-sm">
                                                Nenhuma despesa registrada este mês.
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-border">
                                        <Link href="/caixa/transactions?type=despesa" passHref>
                                            <Button variant="link" className="p-0 h-auto text-xs text-muted-foreground hover:text-primary">
                                                Ver detalhamento completo <ArrowRight className="w-3 h-3 ml-1" />
                                            </Button>
                                        </Link>
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
                    <Card className="lg:col-span-2 shadow-sm border border-border/50 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent border-l-4 border-l-blue-500">
                        <CardHeader className="border-b border-border/50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                                        <div className="p-1.5 rounded-full bg-emerald-500/10">
                                            <HeartPulse className="w-5 h-5 text-emerald-500" />
                                        </div>
                                        Eletrocardiograma Financeiro
                                    </CardTitle>
                                    <CardDescription>
                                        Evolução do seu Pulso nos últimos 6 meses.
                                    </CardDescription>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-full hover:bg-muted"
                                    onClick={() => setIsChartExpanded(!isChartExpanded)}
                                >
                                    {isChartExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className={cn("transition-all duration-300 ease-in-out", isChartExpanded ? "pt-6 opacity-100" : "h-0 p-0 overflow-hidden opacity-0")}>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart
                                        data={trendData}
                                        margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.2} />
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
                                        <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#94a3b8', opacity: 0.1 }} />
                                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                        <ReferenceLine y={0} stroke="#94a3b8" />
                                        <Bar dataKey="receita" name="Receitas" fill="#059669" radius={[4, 4, 0, 0]} barSize={20} fillOpacity={0.9} />
                                        <Bar dataKey="despesa" name="Despesas" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={20} fillOpacity={0.9} />
                                        <Line
                                            type="monotone"
                                            dataKey="saldo"
                                            name="Pulso"
                                            stroke="#1E3A8A"
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
                        <Card className="shadow-sm border border-border flex flex-col">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" /> Investimentos
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="mb-6">
                                    <p className="text-2xl font-bold text-foreground tracking-tight">
                                        {formatCurrency(investments.total)}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className="bg-wealth/10 text-wealth border-wealth/20">
                                            <ArrowUpRight className="w-3 h-3 mr-1" />
                                            {investments.returnRate}% este mês
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">+{formatCurrency(investments.monthlyReturn)}</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {investments.allocation.map((item) => (
                                        <div key={item.name} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                                <span className="text-muted-foreground">{item.name}</span>
                                            </div>
                                            <span className="font-medium">{item.value}%</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 pt-4 border-t border-border">
                                    <Button variant="outline" className="w-full text-xs" size="sm">
                                        Ver Detalhes <ArrowRight className="w-3 h-3 ml-2" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="shadow-sm border border-border flex flex-col">
                            <CardHeader>
                                <CardTitle className="text-base font-semibold flex items-center gap-2">
                                    <Target className="w-5 h-5 text-primary" />
                                    Próxima Conquista
                                </CardTitle>
                                <CardDescription>Foco total nesta meta.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col justify-center">
                                <div className="text-center mb-6">
                                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/5 text-primary mb-3 relative group cursor-default">
                                        {/* Glow effect behind */}
                                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                                        <Target className="w-8 h-8 relative z-10" />
                                        <svg className="absolute w-full h-full transform -rotate-90 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]">
                                            <circle
                                                cx="48"
                                                cy="48"
                                                r="42"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                                fill="none"
                                                className="text-muted/30"
                                            />
                                            <circle
                                                cx="48"
                                                cy="48"
                                                r="42"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                                fill="none"
                                                strokeDasharray={264}
                                                strokeDashoffset={264 - (264 * safeGoalProgress)}
                                                className="text-primary transition-all duration-1000 ease-out"
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                    </div>
                                    <h3 className="font-bold text-lg text-foreground">{mainGoal.name}</h3>
                                    <p className="text-sm text-muted-foreground">Alvo: {formatCurrency(mainGoal.target)}</p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Progresso</span>
                                        <span className="font-bold text-primary">{Math.round(safeGoalProgress * 100)}%</span>
                                    </div>
                                    <Progress value={safeGoalProgress * 100} className="h-2 bg-muted" indicatorClassName="bg-primary" />
                                    <p className="text-xs text-center text-muted-foreground mt-4">
                                        Faltam {formatCurrency(Math.max(0, mainGoal.target - mainGoal.current))} para atingir.
                                    </p>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-2 border-t border-border">
                                <Button variant="ghost" size="sm" className="w-full text-primary hover:text-primary hover:bg-primary/10">
                                    Gerenciar Metas <ArrowRight className="w-4 h-4 ml-1" />
                                </Button>
                            </CardFooter>
                        </Card>
                    )}
                </div>

                {/* Invoice Modal */}
                <InvoiceDetailsModal
                    invoiceId={selectedInvoiceId}
                    open={isInvoiceModalOpen}
                    onOpenChange={(val) => {
                        setIsInvoiceModalOpen(val)
                        if (!val) {
                            refetch()
                        }
                    }}
                />
            </PageLayout>
        </>
    )
}
