import { cn } from "@/lib/utils"
import { ReactNode } from "react"

export type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"

interface StatusBadgeProps {
    children: ReactNode
    variant?: BadgeVariant
    className?: string
}

const variants: Record<BadgeVariant, string> = {
    default: "bg-slate-900 text-slate-50 hover:bg-slate-900/80 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-50/80",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-100/80 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-800/80",
    destructive: "bg-red-500 text-slate-50 hover:bg-red-500/80 dark:bg-red-900 dark:text-slate-50 dark:hover:bg-red-900/80",
    outline: "text-slate-950 dark:text-slate-50 border border-slate-200 dark:border-slate-800",
    success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-transparent dark:border-emerald-500/20",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-transparent dark:border-amber-500/20",
    info: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-transparent dark:border-blue-500/20"
}

/**
 * StatusBadge
 * 
 * Badge padronizado para exibir status (pago, pendente, ativo, etc).
 * Estende o Badge original mas com variantes semânticas mais claras.
 */
export function StatusBadge({ children, variant = "default", className }: StatusBadgeProps) {
    return (
        <div className={cn(
            "inline-flex items-center rounded-md px-2 py-1 text-xs font-bold uppercase tracking-wide ring-1 ring-inset transition-colors",
            variants[variant],
            variant === 'outline' ? 'ring-slate-200 dark:ring-slate-800' : 'ring-transparent',
            className
        )}>
            {children}
        </div>
    )
}
