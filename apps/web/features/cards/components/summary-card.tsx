import { LucideIcon } from "lucide-react"
import { ReactNode } from "react"

interface SummaryCardProps {
    title: string
    subtitle?: string
    value: string | ReactNode
    footer?: string
    icon: LucideIcon
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}

const variantStyles = {
    default: {
        container: 'bg-card border-slate-200 dark:border-slate-800',
        title: 'text-muted-foreground',
        subtitle: 'text-slate-400',
        icon: 'text-slate-600'
    },
    success: {
        container: 'bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800',
        title: 'text-green-700 dark:text-green-400',
        subtitle: 'text-green-600/70 dark:text-green-400/70',
        icon: 'text-green-600'
    },
    warning: {
        container: 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800',
        title: 'text-amber-700 dark:text-amber-400',
        subtitle: 'text-amber-600/70 dark:text-amber-400/70',
        icon: 'text-amber-600'
    },
    danger: {
        container: 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
        title: 'text-red-700 dark:text-red-400',
        subtitle: 'text-red-600/70 dark:text-red-400/70',
        icon: 'text-red-600'
    },
    info: {
        container: 'bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-900 border-blue-200 dark:border-blue-800',
        title: 'text-blue-700 dark:text-blue-400',
        subtitle: 'text-blue-600/70 dark:text-blue-400/70',
        icon: 'text-blue-600'
    }
}

export function SummaryCard({
    title,
    subtitle,
    value,
    footer,
    icon: Icon,
    variant = 'default'
}: SummaryCardProps) {
    const styles = variantStyles[variant]

    return (
        <div className={`rounded-xl border p-6 flex flex-col justify-between space-y-2 hover:shadow-md transition-shadow ${styles.container}`}>
            <div className="flex items-center justify-between">
                <div>
                    <span className={`text-sm font-medium ${styles.title}`}>
                        {title}
                    </span>
                    {subtitle && (
                        <p className={`text-[10px] mt-0.5 ${styles.subtitle}`}>
                            {subtitle}
                        </p>
                    )}
                </div>
                <Icon className={`h-4 w-4 ${styles.icon}`} />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {value}
            </div>
            {footer && (
                <div className="text-xs text-muted-foreground">
                    {footer}
                </div>
            )}
        </div>
    )
}

interface SummaryCardsGridProps {
    children: ReactNode
    columns?: 2 | 3 | 4 | 5
}

export function SummaryCardsGrid({ children, columns = 4 }: SummaryCardsGridProps) {
    const gridCols = {
        2: 'md:grid-cols-2',
        3: 'md:grid-cols-2 lg:grid-cols-3',
        4: 'md:grid-cols-2 lg:grid-cols-4',
        5: 'md:grid-cols-2 lg:grid-cols-5'
    }

    return (
        <div className={`grid gap-4 ${gridCols[columns]}`}>
            {children}
        </div>
    )
}
