import { AIInsight } from "@/lib/ai/insights-rules" // Use correct path
import { cn } from "@/lib/utils"
import { AlertCircle, CheckCircle, Lightbulb } from "lucide-react"

interface InlineInsightProps {
    insight: AIInsight
    size?: "sm" | "md"
    className?: string
}

export function InlineInsight({ insight, size = "md", className }: InlineInsightProps) {
    const isSm = size === "sm"

    return (
        <div className={cn(
            "flex items-start gap-2 rounded-lg p-2 text-xs",
            insight.type === 'warning' && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
            insight.type === 'success' && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
            insight.type === 'tip' && "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
            className
        )}>
            {insight.type === 'warning' && <AlertCircle className={cn("mt-0.5", isSm ? "w-3 h-3" : "w-4 h-4")} />}
            {insight.type === 'success' && <CheckCircle className={cn("mt-0.5", isSm ? "w-3 h-3" : "w-4 h-4")} />}
            {insight.type === 'tip' && <Lightbulb className={cn("mt-0.5", isSm ? "w-3 h-3" : "w-4 h-4")} />}

            <p className="flex-1 leading-tight">{insight.text}</p>
        </div>
    )
}
