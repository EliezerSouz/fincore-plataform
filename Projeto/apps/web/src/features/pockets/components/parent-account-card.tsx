"use client"

import { useState } from "react"
import { ParentAccount } from "@/types/pockets"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PocketRow } from "./pocket-row"
import { TransferBetweenPocketsDialog } from "./transfer-between-pockets-dialog"
import { Filter, ArrowLeftRight } from "lucide-react"

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

    const totalYieldMonth = account.pockets?.reduce((acc, p) => acc + (p.yield_month || 0), 0) || 0

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
            // defaultType={activeTab === 'investimentos' ? 'INVESTIMENTO' : 'RESERVA_CDI'} // Poderia passar o tipo padrao baseado na aba
            />

            <Card className="group relative overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18181b] hover:shadow-lg transition-all duration-300">
                {/* 1. Barra de Cor no Topo */}
                <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: color }} />

                <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-2 pt-6">
                    <div className="flex items-center gap-3">
                        <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm shrink-0">
                            <InstitutionIcon className="w-5 h-5" style={{ color }} />
                        </div>
                        <div className="flex flex-col">
                            <CardTitle className="text-sm font-bold text-slate-700 dark:text-slate-100 uppercase tracking-wider">
                                {account.institution_name}
                            </CardTitle>
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setShowEditModal(true)}>
                                <Edit2 className="w-4 h-4 mr-2" />
                                Editar Instituição
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setShowNewPocketModal(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Novo Pocket
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir Instituição
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardHeader>

                <CardContent className="p-0">
                    <Tabs defaultValue="saldo" className="w-full">
                        <div className="px-6 border-b border-slate-100 dark:border-slate-800">
                            <TabsList className="bg-transparent h-auto p-0 gap-6 w-full justify-start rounded-none">
                                <TabsTrigger
                                    value="saldo"
                                    className="data-[state=active]:bg-transparent data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-slate-900 dark:data-[state=active]:border-white data-[state=active]:shadow-none rounded-none px-0 py-3 border-b-2 border-transparent font-semibold"
                                >
                                    Saldo
                                </TabsTrigger>
                                <TabsTrigger
                                    value="cofrinhos"
                                    className="data-[state=active]:bg-transparent data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-slate-900 dark:data-[state=active]:border-white data-[state=active]:shadow-none rounded-none px-0 py-3 border-b-2 border-transparent font-semibold"
                                >
                                    Cofrinhos
                                </TabsTrigger>
                                <TabsTrigger
                                    value="investimentos"
                                    className="data-[state=active]:bg-transparent data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-slate-900 dark:data-[state=active]:border-white data-[state=active]:shadow-none rounded-none px-0 py-3 border-b-2 border-transparent font-semibold"
                                >
                                    Investimentos
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Conteúdo: Saldo (Conta Corrente) */}
                        <TabsContent value="saldo" className="p-6 pt-4 animate-in slide-in-from-left-2 fade-in duration-300">
                            {(() => {
                                const caixaPocket = account.pockets?.find(p => p.pocket_type === 'CAIXA')
                                const balance = caixaPocket?.balance || 0
                                return (
                                    <div className="space-y-4">
                                        <div>
                                            <div className="text-xs text-slate-500 mb-1">Disponível</div>
                                            <div className="text-3xl font-bold text-slate-900 dark:text-white">
                                                {formatCurrency(balance)}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full text-xs"
                                                onClick={() => router.push(`/caixa/transactions?accountId=${account.id}`)}
                                            >
                                                <Filter className="w-3 h-3 mr-2" />
                                                Ver Extrato
                                            </Button>

                                            {caixaPocket && account.pockets && account.pockets.length > 1 ? (
                                                <TransferBetweenPocketsDialog
                                                    sourcePocket={caixaPocket}
                                                    pockets={account.pockets}
                                                    onSuccess={() => router.refresh()}
                                                    trigger={
                                                        <Button variant="outline" size="sm" className="w-full text-xs">
                                                            <ArrowLeftRight className="w-3 h-3 mr-2" />
                                                            Transferir
                                                        </Button>
                                                    }
                                                />
                                            ) : (
                                                <Button variant="outline" size="sm" className="w-full text-xs" disabled>
                                                    <ArrowLeftRight className="w-3 h-3 mr-2" />
                                                    Transferir
                                                </Button>
                                            )}
                                        </div>
                                        {/* Lista simplificada de Pockets CAIXA caso exista mais de um (aberração, mas previne erro) */}
                                        {account.pockets?.filter(p => p.pocket_type === 'CAIXA').length ? null : (
                                            <div className="text-xs text-amber-500 mt-2">Nenhuma conta corrente encontrada.</div>
                                        )}
                                    </div>
                                )
                            })()}
                        </TabsContent>

                        {/* Conteúdo: Cofrinhos (Reservas) */}
                        <TabsContent value="cofrinhos" className="animate-in slide-in-from-right-2 fade-in duration-300">
                            {(() => {
                                const reservaPockets = account.pockets?.filter(p => p.pocket_type === 'RESERVA_CDI') || []
                                const totalReserva = reservaPockets.reduce((acc, p) => acc + p.balance, 0)

                                return (
                                    <div className="p-6 pt-4 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                {reservaPockets.length > 0 && (
                                                    <div className="flex items-center gap-1 mb-1">
                                                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                                                        <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-500 uppercase tracking-wide">CDI Ativo</span>
                                                    </div>
                                                )}
                                                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                                    {formatCurrency(totalReserva)}
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 h-8"
                                                onClick={() => setShowNewPocketModal(true)}
                                            >
                                                Criar
                                            </Button>
                                        </div>

                                        <div className="bg-white dark:bg-zinc-900/50 rounded-lg border border-slate-100 dark:border-white/5 overflow-hidden">
                                            {reservaPockets.length > 0 ? (
                                                reservaPockets.map(pocket => (
                                                    <PocketRow
                                                        key={pocket.id}
                                                        pocket={pocket}
                                                        allPockets={account.pockets}
                                                    />
                                                ))
                                            ) : (
                                                <div className="text-center py-6 text-slate-400 text-xs">
                                                    Você não tem cofrinhos aqui.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })()}
                        </TabsContent>

                        {/* Conteúdo: Investimentos */}
                        <TabsContent value="investimentos" className="animate-in slide-in-from-right-2 fade-in duration-300">
                            {(() => {
                                const investPockets = account.pockets?.filter(p => p.pocket_type === 'INVESTIMENTO') || []
                                const totalInvest = investPockets.reduce((acc, p) => acc + p.balance, 0)

                                return (
                                    <div className="p-6 pt-4 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                                {formatCurrency(totalInvest)}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20 h-8"
                                                onClick={() => setShowNewPocketModal(true)}
                                            >
                                                Investir
                                            </Button>
                                        </div>

                                        <div className="bg-white dark:bg-zinc-900/50 rounded-lg border border-slate-100 dark:border-white/5 overflow-hidden">
                                            {investPockets.length > 0 ? (
                                                investPockets.map(pocket => (
                                                    <PocketRow
                                                        key={pocket.id}
                                                        pocket={pocket}
                                                        allPockets={account.pockets}
                                                    />
                                                ))
                                            ) : (
                                                <div className="text-center py-6 text-slate-400 text-xs">
                                                    Nenhum investimento.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })()}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </>
    )
}
