"use client"

import { Insight } from "@/lib/insights-engine"
import { AlertCircle, CheckCircle, Info, AlertTriangle, X, TrendingUp } from "lucide-react"
import { useState } from "react"
import { Button } from "./ui/button"

interface InsightsPanelProps {
    insights: Insight[]
}

export function InsightsPanel({ insights }: InsightsPanelProps) {
    const [dismissed, setDismissed] = useState<string[]>([])

    const visibleInsights = insights.filter(i => !dismissed.includes(i.id))

    if (visibleInsights.length === 0) {
        return null
    }

    const getIcon = (type: Insight['type']) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-5 h-5" />
            case 'warning': return <AlertTriangle className="w-5 h-5" />
            case 'danger': return <AlertCircle className="w-5 h-5" />
            case 'info': return <Info className="w-5 h-5" />
        }
    }

    const getStyles = (type: Insight['type']) => {
        switch (type) {
            case 'success':
                return {
                    container: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800',
                    icon: 'text-emerald-600 dark:text-emerald-400',
                    title: 'text-emerald-900 dark:text-emerald-100',
                    message: 'text-emerald-700 dark:text-emerald-300'
                }
            case 'warning':
                return {
                    container: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800',
                    icon: 'text-amber-600 dark:text-amber-400',
                    title: 'text-amber-900 dark:text-amber-100',
                    message: 'text-amber-700 dark:text-amber-300'
                }
            case 'danger':
                return {
                    container: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
                    icon: 'text-red-600 dark:text-red-400',
                    title: 'text-red-900 dark:text-red-100',
                    message: 'text-red-700 dark:text-red-300'
                }
            case 'info':
                return {
                    container: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
                    icon: 'text-blue-600 dark:text-blue-400',
                    title: 'text-blue-900 dark:text-blue-100',
                    message: 'text-blue-700 dark:text-blue-300'
                }
        }
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Insights Inteligentes
                </h3>
                <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    {visibleInsights.length}
                </span>
            </div>

            {visibleInsights.map((insight) => {
                const styles = getStyles(insight.type)

                return (
                    <div
                        key={insight.id}
                        className={`rounded-lg border p-4 ${styles.container} animate-in slide-in-from-top-2 duration-300`}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`mt-0.5 ${styles.icon}`}>
                                {getIcon(insight.type)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h4 className={`text-sm font-semibold ${styles.title} mb-1`}>
                                    {insight.title}
                                </h4>
                                <p className={`text-sm ${styles.message}`}>
                                    {insight.message}
                                </p>

                                {insight.action && (
                                    <Button
                                        variant="link"
                                        size="sm"
                                        className={`h-auto p-0 mt-2 text-xs font-semibold ${styles.icon}`}
                                        onClick={insight.action.onClick}
                                    >
                                        {insight.action.label} →
                                    </Button>
                                )}
                            </div>

                            <button
                                onClick={() => setDismissed([...dismissed, insight.id])}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                title="Dispensar"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
