"use client"

import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { formatCurrency } from "@/lib/utils"
import { AlertCircle } from "lucide-react"

// Dados Mockados Simulando um Cenário Real de Receita x Despesa
const data = [
    { name: 'Jan', receita: 12500, despesa: 8400, saldo: 4100 },
    { name: 'Fev', receita: 11000, despesa: 9800, saldo: 1200 },
    { name: 'Mar', receita: 14000, despesa: 6000, saldo: 8000 },
    { name: 'Abr', receita: 10500, despesa: 12500, saldo: -2000 }, // Negativo
    { name: 'Mai', receita: 13500, despesa: 9000, saldo: 4500 },
    { name: 'Jun', receita: 16000, despesa: 8500, saldo: 7500 },
    { name: 'Jul', receita: 15500, despesa: 11000, saldo: 4500 },
    { name: 'Ago', receita: 14000, despesa: 15000, saldo: -1000 }, // Negativo
    { name: 'Set', receita: 18000, despesa: 10000, saldo: 8000 },
    { name: 'Out', receita: 19500, despesa: 12000, saldo: 7500 },
    { name: 'Nov', receita: 22000, despesa: 14000, saldo: 8000 },
    { name: 'Dez', receita: 35000, despesa: 18000, saldo: 17000 },
]

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

export function OverviewChart() {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
                data={data}
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

                {/* Tooltip com conteúdo Customizado */}
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
    )
}
