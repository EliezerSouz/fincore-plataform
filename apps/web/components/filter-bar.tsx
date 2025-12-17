"use client"

import * as React from "react"
import {
    Filter,
    ArrowUpRight,
    ArrowDownLeft
} from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DateRangeFilter } from "@/components/ui/date-range-filter"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
    SheetClose
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

// --- Interfaces ---

export interface FilterBarProps {
    /**
     * Componentes de Filtros Rápidos (ex: Selects) para a Zona 2.
     */
    children?: React.ReactNode

    className?: string

    /**
     * Se fornecido, substitui a manipulação automática de URL params.
     */
    onPeriodChange?: (range: DateRange | undefined) => void

    /**
     * Renderizador do conteúdo da Sheet de filtros avançados.
     */
    renderAdvancedFilters?: () => React.ReactNode

    /**
     * Contagem de filtros avançados ativos para exibição no badge.
     */
    advancedFilterCount?: number

    /**
     * Desabilita a atualização automática da URL (searchParams).
     */
    disableUrlParams?: boolean

    /**
     * Resumo (Zone 4) - Elemento visual discreto à direita (ex: Totais / Sparkline).
     */
    summary?: React.ReactNode
}

// --- Component ---

// --- Component ---

export function FilterBar({
    children,
    className,
    onPeriodChange,
    renderAdvancedFilters,
    advancedFilterCount = 0,
    disableUrlParams = false,
    summary
}: FilterBarProps) {
    return (
        <div className={cn(
            "w-full flex flex-col xl:flex-row items-start xl:items-center gap-4 py-2 mb-6 border-b border-border/40",
            className
        )}>
            {/* Zone 1: Period (Left, fixed) */}
            <div className="flex-none w-full md:w-auto">
                <DateRangeFilter
                    onUpdate={onPeriodChange}
                    disableUrlParams={disableUrlParams}
                />
            </div>

            {/* Zone 2: Quick Filters (Next to period) */}
            <div className="flex-1 w-full flex flex-row items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                {children}
            </div>

            {/* Zone 3: Advanced Filters (Optional, Collapsed) */}
            {renderAdvancedFilters && (
                <div className="flex-none">
                    <AdvancedFiltersTrigger count={advancedFilterCount}>
                        {renderAdvancedFilters()}
                    </AdvancedFiltersTrigger>
                </div>
            )}

            {/* Zone 4: Summary (Right, Discrete) */}
            {summary && (
                <div className="flex-none w-full xl:w-auto mt-2 xl:mt-0 flex justify-end">
                    {summary}
                </div>
            )}
        </div>
    )
}


/**
 * Trigger de Filtros Avançados
 */
function AdvancedFiltersTrigger({ children, count }: { children: React.ReactNode, count: number }) {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 border-dashed gap-2 text-muted-foreground hover:text-foreground">
                    <Filter className="h-4 w-4" />
                    Mais filtros
                    {count > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary">
                            {count}
                        </span>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px]">
                <SheetHeader>
                    <SheetTitle>Filtros Avançados</SheetTitle>
                    <SheetDescription>
                        Visualize apenas o que importa com refinos precisos.
                    </SheetDescription>
                </SheetHeader>
                <div className="py-6 space-y-6">
                    {children}
                </div>
                <SheetFooter>
                    <SheetClose asChild>
                        <Button className="w-full">Ver resultados</Button>
                    </SheetClose>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}

/**
 * Componente de Resumo de Filtro (Zone 4)
 * Exemplo de uso: <FilterSummary label="Total Entrada" value={1000} trend="up" />
 */
export function FilterSummary({
    label,
    value,
    trend
}: {
    label: string,
    value: string | number,
    trend?: 'up' | 'down' | 'neutral'
}) {
    return (
        <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <div className="flex items-center gap-1 font-medium text-foreground">
                {value}
                {trend === 'up' && <ArrowUpRight className="h-4 w-4 text-emerald-500" />}
                {trend === 'down' && <ArrowDownLeft className="h-4 w-4 text-red-500" />}
            </div>
        </div>
    )
}
