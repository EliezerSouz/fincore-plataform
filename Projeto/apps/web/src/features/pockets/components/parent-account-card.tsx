"use client"

import { useState } from "react"
import { ParentAccount } from "@/types/pockets"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { PocketRow } from "./pocket-row"
import { Building2, Plus, MoreHorizontal, Edit2, Trash2, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { ManageParentAccountModal } from "./manage-parent-account-modal"
import { ManagePocketModal } from "./manage-pocket-modal"
import { deleteParentAccount } from "../actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function ParentAccountCard({ account }: { account: ParentAccount }) {
    const [showEditModal, setShowEditModal] = useState(false)
    const [showNewPocketModal, setShowNewPocketModal] = useState(false)
    const router = useRouter()

    // Cores baseadas na instituição (placeholder)
    const getInstitutionColor = (name: string) => {
        const n = name.toLowerCase()
        if (n.includes('nubank')) return '#820ad1'
        if (n.includes('inter')) return '#ff7a00'
        if (n.includes('mercado')) return '#009ee3'
        if (n.includes('itau')) return '#ec7000'
        if (n.includes('bradesco')) return '#cc092f'
        return '#64748b'
    }

    const color = account.color || getInstitutionColor(account.institution_name)

    // Mapeamento de ícones baseados no nome da instituição (Visual Premium)
    const getInstitutionIcon = (name: string) => {
        const n = name.toLowerCase()
        // Retornar ícones específicos se tivermos, ou genéricos por tipo
        // Para simplificar e bater com a imagem, usaremos lucide-products que parecem logos
        if (n.includes('invest')) return TrendingUp
        if (n.includes('pago') || n.includes('bank') || n.includes('nubank')) return Building2
        return Building2 // Default icon (Colunas gregas/Prédio)
    }

    const InstitutionIcon = getInstitutionIcon(account.institution_name)

    const handleDelete = async () => {
        if (account.pockets && account.pockets.length > 0) {
            toast.error("Não é possível excluir instituição com pockets. Mova ou exclua os pockets primeiro.")
            return
        }

        if (confirm("Tem certeza que deseja excluir esta instituição?")) {
            try {
                await deleteParentAccount(account.id)
                toast.success("Instituição removida")
                router.refresh() // Atualiza a lista
            } catch (error) {
                toast.error("Erro ao remover instituição")
            }
        }
    }

    return (
        <>
            <ManageParentAccountModal
                open={showEditModal}
                onOpenChange={setShowEditModal}
                account={account}
            />

            <ManagePocketModal
                open={showNewPocketModal}
                onOpenChange={setShowNewPocketModal}
                parentAccount={account}
            />

            <Card className="group relative overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18181b] hover:shadow-lg transition-all duration-300">
                {/* 1. Barra de Cor no Topo */}
                <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: color }} />

                {/* 2. Marca D'água no Fundo */}
                <div className="absolute -bottom-6 -right-6 pointer-events-none opacity-[0.03] dark:opacity-[0.08] transition-opacity group-hover:opacity-[0.06] dark:group-hover:opacity-[0.12]">
                    <InstitutionIcon strokeWidth={1} className="w-48 h-48" style={{ color: color }} />
                </div>

                <CardHeader className="relative z-10 flex flex-row items-start justify-between pb-2 pt-6">
                    <div className="flex items-center gap-3">
                        {/* Logo/Icone Pequeno */}
                        <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm shrink-0">
                            <InstitutionIcon className="w-5 h-5" style={{ color }} />
                        </div>

                        <div className="flex flex-col">
                            <CardTitle className="text-sm font-bold text-slate-700 dark:text-slate-100 uppercase tracking-wider">
                                {account.institution_name}
                            </CardTitle>
                            <span className="text-[10px] text-slate-400 font-medium">
                                {account.pockets?.length || 0} pockets
                            </span>
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 -mr-2 -mt-1">
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setShowEditModal(true)}>
                                <Edit2 className="w-4 h-4 mr-2" />
                                Editar Instituição
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir Instituição
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardHeader>

                <CardContent className="relative z-10 p-0">
                    {/* Saldo em Destaque (Estilo Cartão) */}
                    <div className="px-6 pb-6 pt-2">
                        <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Saldo Consolidado</div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                            {formatCurrency(account.total_balance)}
                        </div>
                    </div>

                    {/* Lista de Pockets */}
                    <div className="bg-slate-50/50 dark:bg-black/20 border-t border-slate-100 dark:border-white/5 backdrop-blur-sm">
                        {account.pockets && account.pockets.length > 0 ? (
                            <div className="divide-y divide-slate-100/50 dark:divide-white/5">
                                {account.pockets.map(pocket => (
                                    <PocketRow key={pocket.id} pocket={pocket} />
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 text-center text-xs text-slate-500">
                                Sem pockets ativos
                            </div>
                        )}

                        <div className="p-2 flex justify-center border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02]">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 h-7"
                                onClick={() => setShowNewPocketModal(true)}
                            >
                                <Plus className="w-3 h-3 mr-1" />
                                Adicionar Pocket
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </>
    )
}
