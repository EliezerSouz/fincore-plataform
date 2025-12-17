"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
    addDays,
    endOfMonth,
    endOfYear,
    format,
    startOfMonth,
    startOfYear,
    subDays,
    subMonths,
    isValid
} from "date-fns"
import { ptBR } from "date-fns/locale"
import {
    Calendar as CalendarIcon,
    ChevronDown,
} from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface DateRangeFilterProps {
    className?: string
    onUpdate?: (range: DateRange | undefined) => void
    disableUrlParams?: boolean
}

export function DateRangeFilter({
    className,
    onUpdate,
    disableUrlParams = false
}: DateRangeFilterProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    // State for Custom Date Dialog
    const [isCustomDialogOpen, setIsCustomDialogOpen] = React.useState(false)
    const [tempDate, setTempDate] = React.useState<DateRange | undefined>()

    // Derived state from URL or props
    const date = React.useMemo(() => {
        if (disableUrlParams) return undefined

        const fromParam = searchParams.get('from')
        const toParam = searchParams.get('to')

        if (fromParam && toParam && isValid(new Date(fromParam)) && isValid(new Date(toParam))) {
            const [y1, m1, d1] = fromParam.split('-').map(Number)
            // Fix: Date constructor with year, monthIndex (0-11), day
            const fromDate = new Date(y1, m1 - 1, d1)

            const [y2, m2, d2] = toParam.split('-').map(Number)
            const toDate = new Date(y2, m2 - 1, d2)

            return { from: fromDate, to: toDate }
        }

        // Default: Current Month
        const now = new Date()
        return {
            from: startOfMonth(now),
            to: endOfMonth(now)
        }
    }, [searchParams, disableUrlParams])

    const handlePreset = (preset: string) => {
        const now = new Date()
        let newRange: DateRange | undefined

        switch (preset) {
            case 'this-month':
                newRange = { from: startOfMonth(now), to: endOfMonth(now) }
                break
            case 'last-month':
                const lastMonth = subMonths(now, 1)
                newRange = { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) }
                break
            case 'last-7':
                newRange = { from: subDays(now, 7), to: now }
                break
            case 'last-30':
                newRange = { from: subDays(now, 30), to: now }
                break
            case 'this-year':
                newRange = { from: startOfYear(now), to: endOfYear(now) }
                break
            case 'custom':
                setTempDate(date)
                setIsCustomDialogOpen(true)
                return
        }

        if (newRange) {
            applyRange(newRange)
        }
    }

    const applyRange = (range: DateRange | undefined) => {
        if (!range?.from || !range?.to) return

        if (onUpdate) {
            onUpdate(range)
        }

        if (!disableUrlParams) {
            const params = new URLSearchParams(searchParams.toString())
            params.set('from', format(range.from, 'yyyy-MM-dd'))
            params.set('to', format(range.to, 'yyyy-MM-dd'))
            // Clean legacy params if they exist
            params.delete('month')
            params.delete('year')
            router.push(`?${params.toString()}`)
        }
    }

    const label = React.useMemo(() => {
        if (!date?.from || !date?.to) return "Selecione o período"
        return `${format(date.from, "dd/MM/yyyy")} - ${format(date.to, "dd/MM/yyyy")}`
    }, [date])

    return (
        <div className={cn("grid gap-2", className)}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-[260px] justify-between font-normal bg-card h-9 px-3 border-border hover:bg-accent hover:text-accent-foreground text-left" suppressHydrationWarning>
                        <span className="flex items-center gap-2 truncate">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground flex-none" />
                            <span className="truncate">{label}</span>
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-50 flex-none ml-2" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[200px]">
                    <DropdownMenuItem onClick={() => handlePreset('this-month')}>Este mês</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePreset('last-month')}>Mês anterior</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePreset('last-7')}>Últimos 7 dias</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePreset('last-30')}>Últimos 30 dias</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePreset('this-year')}>Ano atual</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handlePreset('custom')}>
                        Personalizado...
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Custom Date Dialog */}
            <Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen}>
                <DialogContent className="w-auto p-0 overflow-hidden">
                    <DialogHeader className="px-4 py-3 border-b">
                        <DialogTitle className="text-sm font-medium">Selecione o período</DialogTitle>
                    </DialogHeader>
                    <div className="p-0">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={tempDate?.from}
                            selected={tempDate}
                            onSelect={(range) => setTempDate(range)}
                            numberOfMonths={2}
                            locale={ptBR}
                            className="p-3"
                        />
                    </div>
                    <DialogFooter className="px-4 py-3 border-t bg-muted/50">
                        <Button variant="ghost" size="sm" onClick={() => setIsCustomDialogOpen(false)}>Cancelar</Button>
                        <Button size="sm" onClick={() => {
                            applyRange(tempDate)
                            setIsCustomDialogOpen(false)
                        }}>Aplicar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
