import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string
    description?: string
    action?: ReactNode
}

export function PageHeader({ title, description, action, className, ...props }: PageHeaderProps) {
    return (
        <div className={cn("flex flex-col gap-4 mb-6", className)} {...props}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
                    {description && (
                        <p className="text-sm text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>
                {action && <div className="flex items-center gap-2 self-start md:self-auto">{action}</div>}
            </div>
        </div>
    )
}
