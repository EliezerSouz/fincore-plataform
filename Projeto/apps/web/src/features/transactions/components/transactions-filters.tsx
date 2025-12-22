'use client'

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useCallback } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { DateRangeFilter } from "@/components/ui/date-range-filter"
import { usePermission } from "@/hooks/use-permission"

interface TransactionsFiltersProps {
    accounts: any[]
    categories: any[]
}

export function TransactionsFilters({ accounts, categories }: TransactionsFiltersProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { can } = usePermission()

    const accountId = searchParams.get('accountId') || "all"
    const categoryId = searchParams.get('categoryId') || "all"
    const type = searchParams.get('type') || "all"

    const createQueryString = useCallback(
        (paramsObj: Record<string, string | null>) => {
            const params = new URLSearchParams(searchParams.toString())
            Object.entries(paramsObj).forEach(([name, value]) => {
                if (value && value !== 'all') {
                    params.set(name, value)
                } else {
                    params.delete(name)
                }
            })
            return params.toString()
        },
        [searchParams]
    )

    const updateFilter = (name: string, value: string) => {
        router.push(pathname + '?' + createQueryString({ [name]: value }))
    }

    const clearFilters = () => {
        // Keeps period, clears specifics
        const params = new URLSearchParams(searchParams.toString())
        params.delete('accountId')
        params.delete('categoryId')
        params.delete('type')
        router.push(pathname + '?' + params.toString())
    }

    const hasFilters = accountId !== 'all' || categoryId !== 'all' || type !== 'all'

    return (
        <div className="flex flex-row items-center gap-2 flex-wrap">
            {/* Período */}
            <DateRangeFilter />

            {/* Tipo */}
            <Select value={type} onValueChange={(v) => updateFilter('type', v)}>
                <SelectTrigger className="w-[110px] h-11 bg-card border-slate-200 dark:border-slate-800 shadow-sm" suppressHydrationWarning>
                    <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Tipo: Todos</SelectItem>
                    <SelectItem value="receita">Receitas</SelectItem>
                    <SelectItem value="despesa">Despesas</SelectItem>
                    <SelectItem value="transferencia">Transferências</SelectItem>
                </SelectContent>
            </Select>

            {/* Conta */}
            <Select value={accountId} onValueChange={(v) => updateFilter('accountId', v)}>
                <SelectTrigger className="w-[160px] h-11 bg-card border-slate-200 dark:border-slate-800 shadow-sm" suppressHydrationWarning>
                    <SelectValue placeholder="Conta" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Contas: Todas</SelectItem>
                    {accounts.map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Categoria */}
            <div className="hidden md:block">
                <Select value={categoryId} onValueChange={(v) => updateFilter('categoryId', v)}>
                    <SelectTrigger className="w-[160px] h-11 bg-card border-slate-200 dark:border-slate-800 shadow-sm" suppressHydrationWarning>
                        <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Categorias: Todas</SelectItem>
                        {categories
                            .filter(c => !c.is_premium || can('manage_categories'))
                            .map(c => (
                            <SelectItem key={c.id} value={c.id}>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                                    {c.name}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Botão Limpar */}
            {hasFilters && (
                <Button
                    variant="ghost"
                    onClick={clearFilters}
                    title="Limpar Filtros"
                    className="h-11 w-11 p-0 text-muted-foreground hover:text-destructive"
                >
                    <X className="w-4 h-4" />
                </Button>
            )}
        </div>
    )
}
