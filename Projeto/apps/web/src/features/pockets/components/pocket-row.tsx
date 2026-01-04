"use client"

import { useState } from "react"
import { Pocket } from "@/types/pockets"
import { formatCurrency } from "@/lib/utils"
import { PocketTypeBadge } from "./pocket-type-badge"
import { MoreHorizontal, Edit2, Trash2, ArrowRightLeft, TrendingUp, ArrowLeftRight, Scale } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { recalculatePocketBalance, deletePocket } from "../actions"

import { MovePocketModal } from "./move-pocket-modal"
import { ManagePocketModal } from "./manage-pocket-modal"
import { TransferBetweenPocketsDialog } from "./transfer-between-pockets-dialog"
import { PocketBalanceAdjustmentDialog } from "./pocket-balance-adjustment-dialog"
import { useRouter } from "next/navigation"

interface PocketRowProps {
    pocket: Pocket
    allPockets?: Pocket[]
}

export function PocketRow({ pocket, allPockets = [] }: PocketRowProps) {
    const [isRecalculating, setIsRecalculating] = useState(false)
    const [showMoveModal, setShowMoveModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showTransferDialog, setShowTransferDialog] = useState(false)
    const [showAdjustmentDialog, setShowAdjustmentDialog] = useState(false)
    const router = useRouter()

    const handleRecalculate = async () => {
        setIsRecalculating(true)
        try {
            await recalculatePocketBalance(pocket.id)
            toast.success("Saldo recalculado com sucesso")
            router.refresh()
        } catch (error) {
            toast.error("Erro ao recalcular saldo")
        } finally {
            setIsRecalculating(false)
        }
    }

    const handleDelete = async () => {
        if (confirm(`Tem certeza que deseja excluir o pocket "${pocket.name}"?`)) {
            try {
                await deletePocket(pocket.id)
                toast.success("Pocket excluído")
                router.refresh()
            } catch (error) {
                toast.error("Erro ao excluir pocket")
            }
        }
    }

    return (
        <>
            <MovePocketModal
                pocket={pocket}
                open={showMoveModal}
                onOpenChange={setShowMoveModal}
            />

            <ManagePocketModal
                open={showEditModal}
                onOpenChange={setShowEditModal}
                pocket={pocket}
            />

            <PocketBalanceAdjustmentDialog
                open={showAdjustmentDialog}
                onOpenChange={setShowAdjustmentDialog}
                pocketId={pocket.id}
                pocketName={pocket.name}
            />

            {allPockets.length > 1 && (
                <TransferBetweenPocketsDialog
                    sourcePocket={pocket}
                    pockets={allPockets}
                    onSuccess={() => window.location.reload()}
                    trigger={
                        <div style={{ display: 'none' }} ref={(el) => {
                            if (el && showTransferDialog) {
                                el.querySelector('button')?.click()
                                setShowTransferDialog(false)
                            }
                        }}>
                            <Button>Hidden Trigger</Button>
                        </div>
                    }
                />
            )}

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

                        {/* Yield Info */}
                        {pocket.yield_enabled && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">
                                    {pocket.yield_cdi_rate}% CDI
                                </span>
                                {pocket.yield_month && pocket.yield_month > 0 && (
                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold ml-1">
                                        +{formatCurrency(pocket.yield_month)}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Descrição ou Aviso de Reserva */}
                        {pocket.pocket_type === 'RESERVA_CDI' ? (
                            <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[10px] text-amber-600 dark:text-amber-500 font-medium">
                                    Use apenas em emergências
                                </span>
                            </div>
                        ) : pocket.description && (
                            <span className="text-[10px] text-slate-400 truncate max-w-[200px] mt-0.5">
                                {pocket.description}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <div className="font-semibold text-slate-800 dark:text-slate-100">
                            {formatCurrency(pocket.balance)}
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {allPockets.length > 1 && (
                                <>
                                    <DropdownMenuItem onClick={() => setShowTransferDialog(true)}>
                                        <ArrowLeftRight className="w-4 h-4 mr-2" />
                                        Transferir entre Pockets
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                </>
                            )}
                            {pocket.yield_enabled && (
                                <DropdownMenuItem onClick={handleRecalculate} disabled={isRecalculating}>
                                    <TrendingUp className={`w-4 h-4 mr-2 ${isRecalculating ? 'animate-spin' : ''}`} />
                                    Atualizar Rendimento
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => setShowAdjustmentDialog(true)}>
                                <Scale className="w-4 h-4 mr-2" />
                                Ajustar Saldo
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setShowMoveModal(true)}>
                                <ArrowRightLeft className="w-4 h-4 mr-2" />
                                Mover para outra Inst.
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setShowEditModal(true)}>
                                <Edit2 className="w-4 h-4 mr-2" />
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </>
    )
}
