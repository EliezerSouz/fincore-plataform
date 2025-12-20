import { ReactNode } from "react"
import { CircleDashed } from "lucide-react"
import { cn } from "@/lib/utils"

interface DataTableWrapperProps {
    isLoading: boolean
    isEmpty: boolean
    emptyMessage?: string
    children: ReactNode
    className?: string
}

/**
 * DataTableWrapper
 * 
 * Container padronizado para tabelas e listas de dados.
 * Gerencia estados de carregamento e vazio visualmente.
 */
export function DataTableWrapper({
    isLoading,
    isEmpty,
    emptyMessage = "Nenhum registro encontrado.",
    children,
    className
}: DataTableWrapperProps) {
    return (
        <div className={cn(
            "rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/50 shadow-sm overflow-hidden relative z-10",
            className
        )}>
            {isLoading && isEmpty ? (
                <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-500 min-h-[300px]">
                    <CircleDashed className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm font-medium animate-pulse">Carregando dados...</p>
                </div>
            ) : isEmpty ? (
                <div className="p-12 text-center min-h-[300px] flex flex-col items-center justify-center">
                    <div className="flex flex-col items-center gap-3 text-slate-500">
                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                            <CircleDashed className="w-8 h-8 opacity-20" />
                        </div>
                        <p className="text-sm">{emptyMessage}</p>
                    </div>
                </div>
            ) : (
                <div className="relative">
                    {isLoading && (
                        <div className="absolute inset-0 bg-white/50 dark:bg-slate-950/50 backdrop-blur-[1px] z-20 flex items-center justify-center">
                             <CircleDashed className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    )}
                    {children}
                </div>
            )}
        </div>
    )
}
