import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"
import { ReactNode } from "react"

interface MetricCardProps {
    title: string
    value: ReactNode
    description?: string
    icon?: LucideIcon
    variant?: "default" | "destructive" | "success" | "warning" | "info"
    className?: string
}

const variants = {
    default: {
        card: "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800",
        icon: "text-slate-500",
        title: "text-slate-500",
        value: "text-slate-900 dark:text-slate-50",
        gradient: "from-slate-50 to-white dark:from-slate-900 dark:to-slate-950"
    },
    destructive: {
        card: "bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/50",
        icon: "text-red-600 dark:text-red-400",
        title: "text-red-600 dark:text-red-400",
        value: "text-red-700 dark:text-red-300",
        gradient: "from-red-50 to-white dark:from-red-950/30 dark:to-red-950/10"
    },
    success: {
        card: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50",
        icon: "text-emerald-600 dark:text-emerald-400",
        title: "text-emerald-600 dark:text-emerald-400",
        value: "text-emerald-700 dark:text-emerald-300",
        gradient: "from-emerald-50 to-white dark:from-emerald-950/30 dark:to-emerald-950/10"
    },
    warning: {
        card: "bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/50",
        icon: "text-amber-600 dark:text-amber-400",
        title: "text-amber-600 dark:text-amber-400",
        value: "text-amber-700 dark:text-amber-300",
        gradient: "from-amber-50 to-white dark:from-amber-950/30 dark:to-amber-950/10"
    },
    info: {
        card: "bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/50",
        icon: "text-blue-600 dark:text-blue-400",
        title: "text-blue-600 dark:text-blue-400",
        value: "text-blue-700 dark:text-blue-300",
        gradient: "from-blue-50 to-white dark:from-blue-950/30 dark:to-blue-950/10"
    }
}

/**
 * MetricCard
 * 
 * Componente reutilizável para exibir métricas resumidas (KPIs).
 * Utilizado em dashboards e headers de listagens.
 */
export function MetricCard({ 
    title, 
    value, 
    description, 
    icon: Icon, 
    variant = "default",
    className 
}: MetricCardProps) {
    const styles = variants[variant]

    return (
        <Card className={cn("relative overflow-hidden shadow-sm transition-all hover:shadow-md", styles.card, className)}>
            {/* Gradient Background */}
            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50", styles.gradient)} />
            
            {/* Watermark Icon */}
            {Icon && (
                <div className="absolute -right-6 -bottom-6 opacity-[0.07] pointer-events-none transform rotate-12 scale-150">
                    <Icon className="w-32 h-32" />
                </div>
            )}

            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2 z-10">
                <CardTitle className={cn("text-sm font-medium opacity-90", styles.title)}>
                    {title}
                </CardTitle>
                {Icon && <Icon className={cn("h-4 w-4 opacity-80", styles.icon)} />}
            </CardHeader>
            <CardContent className="relative z-10">
                <div className={cn("text-2xl font-bold tracking-tight", styles.value)}>
                    {value}
                </div>
                {description && (
                    <p className="text-xs text-muted-foreground mt-1 font-medium opacity-80">
                        {description}
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
