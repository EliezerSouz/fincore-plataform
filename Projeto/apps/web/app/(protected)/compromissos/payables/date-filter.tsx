"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

export function DateFilter() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const currentMonth = Number(searchParams.get('month')) || new Date().getMonth() + 1
    const currentYear = Number(searchParams.get('year')) || new Date().getFullYear()

    const months = [
        { value: 1, label: "Janeiro" },
        { value: 2, label: "Fevereiro" },
        { value: 3, label: "Março" },
        { value: 4, label: "Abril" },
        { value: 5, label: "Maio" },
        { value: 6, label: "Junho" },
        { value: 7, label: "Julho" },
        { value: 8, label: "Agosto" },
        { value: 9, label: "Setembro" },
        { value: 10, label: "Outubro" },
        { value: 11, label: "Novembro" },
        { value: 12, label: "Dezembro" }
    ]

    function handleMonthChange(value: string) {
        const params = new URLSearchParams(searchParams.toString())
        params.set('month', value)
        router.push(`?${params.toString()}`)
    }

    function handleYearChange(value: string) {
        const params = new URLSearchParams(searchParams.toString())
        params.set('year', value)
        router.push(`?${params.toString()}`)
    }

    function navigateMonth(direction: 'prev' | 'next') {
        let newMonth = currentMonth + (direction === 'next' ? 1 : -1)
        let newYear = currentYear

        if (newMonth > 12) {
            newMonth = 1
            newYear++
        } else if (newMonth < 1) {
            newMonth = 12
            newYear--
        }

        const params = new URLSearchParams(searchParams.toString())
        params.set('month', newMonth.toString())
        params.set('year', newYear.toString())
        router.push(`?${params.toString()}`)
    }

    // Gera lista de anos (ano atual +/- 2 anos)
    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

    return (
        <div className="flex items-center gap-2 bg-white dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
            <Button variant="ghost" size="icon" onClick={() => navigateMonth('prev')} className="text-slate-500 hover:text-slate-700">
                <ChevronLeft className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-1">
                <Select value={currentMonth.toString()} onValueChange={handleMonthChange}>
                    <SelectTrigger className="h-11 w-[140px] border-none shadow-none focus:ring-0 bg-transparent font-medium">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {months.map((m) => (
                            <SelectItem key={m.value} value={m.value.toString()}>
                                {m.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={currentYear.toString()} onValueChange={handleYearChange}>
                    <SelectTrigger className="h-11 w-[90px] border-none shadow-none focus:ring-0 bg-transparent font-medium">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {years.map((y) => (
                            <SelectItem key={y} value={y.toString()}>
                                {y}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Button variant="ghost" size="icon" onClick={() => navigateMonth('next')} className="text-slate-500 hover:text-slate-700">
                <ChevronRight className="h-5 w-5" />
            </Button>
        </div>
    )
}
