import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationControlsProps {
    currentPage: number
    totalPages?: number
    hasMore?: boolean
    onPageChange: (page: number) => void
    
    limit?: number
    onLimitChange?: (limit: number) => void
    limitOptions?: number[]
    
    label?: string
    isLoading?: boolean
}

/**
 * PaginationControls
 * 
 * Componente padronizado para controles de paginação e limite por página.
 * 
 * @example
 * <PaginationControls
 *   currentPage={page}
 *   hasMore={hasMore}
 *   onPageChange={setPage}
 *   limit={limit}
 *   onLimitChange={setLimit}
 * />
 */
export function PaginationControls({
    currentPage,
    totalPages,
    hasMore,
    onPageChange,
    limit,
    onLimitChange,
    limitOptions = [10, 25, 50, 100],
    label = "Linhas por página:",
    isLoading = false
}: PaginationControlsProps) {
    // Determina se pode avançar
    const canNext = totalPages ? currentPage < totalPages : hasMore

    return (
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-sm text-slate-500 bg-slate-50/30 dark:bg-slate-900/10 transition-all">
            {limit && onLimitChange && (
                <div className="flex items-center gap-2">
                    <span className="hidden sm:inline">{label}</span>
                    <Select 
                        value={limit.toString()} 
                        onValueChange={(val) => onLimitChange(parseInt(val))}
                        disabled={isLoading}
                    >
                        <SelectTrigger className="w-[70px] h-11 bg-white dark:bg-slate-900 text-xs shadow-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {limitOptions.map(opt => (
                                <SelectItem key={opt} value={opt.toString()}>
                                    {opt}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div className="flex items-center gap-2 ml-auto">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1 || isLoading}
                    className="h-11 w-11"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs min-w-[60px] text-center font-medium">
                    Página {currentPage}
                </span>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={!canNext || isLoading}
                    className="h-11 w-11"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
