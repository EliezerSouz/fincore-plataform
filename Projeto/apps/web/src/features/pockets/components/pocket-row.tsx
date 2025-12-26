"use client"

import { Pocket } from "@/types/pockets"
import { formatCurrency } from "@/lib/utils"
import { PocketTypeBadge } from "./pocket-type-badge"
import { MoreHorizontal, Edit2, Trash2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState } from "react"
import { toast } from "sonner"
import { recalculatePocketBalance } from "../actions"

export function PocketRow({ pocket }: { pocket: Pocket }) {
    const [isRecalculating, setIsRecalculating] = useState(false)

    const handleRecalculate = async () => {
        setIsRecalculating(true)
        try {
            await recalculatePocketBalance(pocket.id)
            toast.success("Saldo recalculado com sucesso")
        } catch (error) {
            toast.error("Erro ao recalcular saldo")
        } finally {
            setIsRecalculating(false)
        }
    }

    return (
        <div className="flex items-center justify-between p-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${pocket.pocket_type === 'CAIXA' ? 'bg-emerald-100 text-emerald-700' :
                        pocket.pocket_type === 'RESERVA_CDI' ? 'bg-blue-100 text-blue-700' :
                            'bg-purple-100 text-purple-700'
                    }`}>
                    {pocket.name.substring(0, 1)}
                </div>

                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-slate-700 dark:text-slate-200">{pocket.name}</span>
                        <PocketTypeBadge type={pocket.pocket_type} />
                    </div>

                    {pocket.yield_enabled && (
                        <span className="text-[10px] text-emerald-600 font-medium">
                            render {pocket.yield_cdi_rate}% CDI
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="text-right">
                    <div className="font-semibold text-slate-800 dark:text-slate-100">
                        {formatCurrency(pocket.balance)}
                    </div>
                    {pocket.yield_today ? (
                        <div className="text-[10px] text-emerald-600 font-medium">
                            +{formatCurrency(pocket.yield_today)} hoje
                        </div>
                    ) : null}
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                            <MoreHorizontal className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleRecalculate} disabled={isRecalculating}>
                            <RefreshCw className={`w-4 h-4 mr-2 ${isRecalculating ? 'animate-spin' : ''}`} />
                            Recalcular Saldo
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}
