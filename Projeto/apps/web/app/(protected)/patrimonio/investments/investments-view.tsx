"use client"

import { PageLayout } from "@/components/layout/page-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
    TrendingUp, 
    PieChart, 
    Wallet, 
    ArrowUpRight, 
    ArrowDownRight, 
    DollarSign, 
    Target, 
    ShieldCheck, 
    AlertTriangle,
    Plus,
    MoreHorizontal
} from "lucide-react"
import { ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts"
import { formatCurrency } from "@/lib/utils"
import { NewAssetDialog } from "./new-asset-dialog"
import { NewContributionDialog } from "./new-contribution-dialog"

// Mock Data
const allocationData = [
    { name: 'Renda Fixa', value: 65000, color: '#10b981' },
    { name: 'Ações BR', value: 25000, color: '#3b82f6' },
    { name: 'FIIs', value: 15000, color: '#6366f1' },
    { name: 'Cripto', value: 5000, color: '#8b5cf6' },
    { name: 'Reserva', value: 15000, color: '#f59e0b' },
]

const performanceData = [
    { month: 'Jan', value: 110000 },
    { month: 'Fev', value: 112500 },
    { month: 'Mar', value: 111000 },
    { month: 'Abr', value: 115000 },
    { month: 'Mai', value: 118000 },
    { month: 'Jun', value: 125000 },
]

const assets = [
    { id: 1, name: 'Tesouro Selic 2027', type: 'Renda Fixa', value: 45000, return: 0.85, allocation: 36 },
    { id: 2, name: 'CDB Banco Inter', type: 'Renda Fixa', value: 20000, return: 0.92, allocation: 16 },
    { id: 3, name: 'HGLG11', type: 'FIIs', value: 8500, return: 0.75, allocation: 6.8 },
    { id: 4, name: 'MXRF11', type: 'FIIs', value: 6500, return: 0.88, allocation: 5.2 },
    { id: 5, name: 'IVVB11', type: 'Ações Int', value: 25000, return: 1.2, allocation: 20 },
    { id: 6, name: 'Bitcoin', type: 'Cripto', value: 5000, return: -2.5, allocation: 4 },
    { id: 7, name: 'Nubank (Caixinha)', type: 'Reserva', value: 15000, return: 0.82, allocation: 12 },
]

export function InvestmentsView() {
    const totalBalance = 125000
    const monthlyReturn = 1250
    const monthlyReturnPercent = 1.0

    return (
        <PageLayout
            title="Meus Investimentos"
            description="Gestão inteligente do seu patrimônio."
            icon={PieChart}
            action={
                <div className="flex gap-2">
                    <NewAssetDialog />
                    <NewContributionDialog />
                </div>
            }
        >
            {/* Header Stats */}
            <div className="grid gap-4 md:grid-cols-3 mb-6">
                 {/* Total Equity */}
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Patrimônio Total</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
                        <p className="text-xs text-muted-foreground flex items-center mt-1">
                            <span className="text-emerald-500 flex items-center font-medium">
                                <ArrowUpRight className="w-3 h-3 mr-1" /> +12%
                            </span>
                            <span className="ml-1">em 12 meses</span>
                        </p>
                    </CardContent>
                 </Card>

                 {/* Monthly Return */}
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rendimento no Mês</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(monthlyReturn)}</div>
                        <p className="text-xs text-muted-foreground flex items-center mt-1">
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-400 mr-2">
                                {monthlyReturnPercent}%
                            </Badge>
                            <span>vs 0.85% (CDI)</span>
                        </p>
                    </CardContent>
                 </Card>

                 {/* Risk/Health */}
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Saúde da Carteira</CardTitle>
                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">Excelente</div>
                        <div className="flex items-center gap-2 mt-2">
                            <Progress value={92} className="h-2 bg-emerald-100 dark:bg-emerald-950/30" indicatorClassName="bg-emerald-500" />
                            <span className="text-xs font-medium text-muted-foreground">92/100</span>
                        </div>
                    </CardContent>
                 </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-3 lg:h-[400px]">
                {/* Allocation Chart */}
                <Card className="md:col-span-1 h-full">
                    <CardHeader>
                        <CardTitle className="text-base">Alocação de Ativos</CardTitle>
                        <CardDescription>Diversificação da carteira</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex flex-col justify-center">
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RePieChart>
                                    <Pie
                                        data={allocationData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {allocationData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        formatter={(value) => formatCurrency(value as number)}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                </RePieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-1 mt-2 max-h-[100px] overflow-y-auto pr-2">
                            {allocationData.map((item) => (
                                <div key={item.name} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span>{item.name}</span>
                                    </div>
                                    <span className="font-medium">{Math.round((item.value / totalBalance) * 100)}%</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Evolution Chart & Tabs */}
                <Card className="md:col-span-2 flex flex-col h-full">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base">Evolução Patrimonial</CardTitle>
                                <CardDescription>Crescimento nos últimos 6 meses</CardDescription>
                            </div>
                            <Tabs defaultValue="6m" className="w-[150px]">
                                <TabsList className="grid w-full grid-cols-3 h-8">
                                    <TabsTrigger value="1m" className="text-xs">1M</TabsTrigger>
                                    <TabsTrigger value="6m" className="text-xs">6M</TabsTrigger>
                                    <TabsTrigger value="1y" className="text-xs">1A</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={performanceData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(val) => `R$${val/1000}k`} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: number) => [formatCurrency(value), 'Saldo']}
                                />
                                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Assets List */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="text-lg">Meus Ativos</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {['Renda Fixa', 'FIIs', 'Ações Int', 'Cripto', 'Reserva'].map(category => {
                            const categoryAssets = assets.filter(a => a.type === category)
                            if (!categoryAssets.length) return null
                            
                            return (
                                <div key={category}>
                                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        {category}
                                        <span className="text-xs font-normal text-slate-400">
                                            ({Math.round(categoryAssets.reduce((acc, curr) => acc + curr.allocation, 0))}%)
                                        </span>
                                    </h3>
                                    <div className="space-y-2">
                                        {categoryAssets.map(asset => (
                                            <div key={asset.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                        <DollarSign className="w-5 h-5 text-slate-500" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-900 dark:text-slate-100">{asset.name}</p>
                                                        <p className="text-xs text-slate-500">{asset.type}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="text-right hidden sm:block">
                                                        <p className="text-xs text-slate-500">Rentabilidade</p>
                                                        <p className={`font-medium text-sm ${asset.return >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                            {asset.return > 0 ? '+' : ''}{asset.return}%
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(asset.value)}</p>
                                                        <p className="text-xs text-slate-500">{asset.allocation}% da carteira</p>
                                                    </div>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>
        </PageLayout>
    )
}
