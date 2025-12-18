"use client"

import { TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"

const chartData = [
    { month: "January", income: 18600, expense: 12000 },
    { month: "February", income: 30500, expense: 20000 },
    { month: "March", income: 23700, expense: 15000 },
    { month: "April", income: 17300, expense: 14000 },
    { month: "May", income: 20900, expense: 18000 },
    { month: "June", income: 21400, expense: 14000 },
]

const chartConfig = {
    income: {
        label: "Receitas",
        color: "var(--chart-1)",
    },
    expense: {
        label: "Despesas",
        color: "var(--chart-2)",
    },
} satisfies ChartConfig

export function OverviewChart() {
    return (
        <Card className="col-span-4 lg:col-span-3 border-none shadow-md bg-card/50 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="text-xl font-bold tracking-tight">Fluxo de Caixa</CardTitle>
                <CardDescription>
                    Janeiro - Junho 2025
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="max-h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            accessibilityLayer
                            data={chartData}
                            margin={{
                                left: 0,
                                right: 0,
                                top: 10,
                                bottom: 0,
                            }}
                        >
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis
                                dataKey="month"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                tickFormatter={(value) => value.slice(0, 3)}
                                stroke="var(--muted-foreground)"
                            />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent indicator="dot" />}
                            />
                            <defs>
                                <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-income)" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="var(--color-income)" stopOpacity={0.1} />
                                </linearGradient>
                                <linearGradient id="fillExpense" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-expense)" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="var(--color-expense)" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <Area
                                dataKey="expense"
                                type="monotone" // changed from natural to monotone for better look
                                fill="var(--chart-2)" // Using fill directly for simplicity with shadcn chart config
                                fillOpacity={0.2}
                                stroke="var(--chart-2)"
                                stackId="a"
                            />
                            <Area
                                dataKey="income"
                                type="monotone"
                                fill="var(--chart-1)"
                                fillOpacity={0.2}
                                stroke="var(--chart-1)"
                                stackId="b"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
            <CardFooter>
                <div className="flex w-full items-start gap-2 text-sm">
                    <div className="grid gap-2">
                        <div className="flex items-center gap-2 font-medium leading-none">
                            Receita subiu 5.2% esse mês <TrendingUp className="h-4 w-4 text-green-500" />
                        </div>
                        <div className="flex items-center gap-2 leading-none text-muted-foreground">
                            Projeção positiva para o próximo trimestre
                        </div>
                    </div>
                </div>
            </CardFooter>
        </Card>
    )
}
