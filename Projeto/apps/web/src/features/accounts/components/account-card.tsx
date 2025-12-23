"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Trash2, Edit2, TrendingUp, Wallet, Landmark, PiggyBank, Smartphone, Globe, Utensils, CreditCard, RefreshCw, History } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { DeleteDialog } from "@/components/ui/delete-dialog"
import { formatCurrency } from "@/lib/utils"
import { deleteAccount } from "@/app/(protected)/caixa/accounts/actions"
import { EditAccountDialog } from "./edit-account-dialog"
import { PayInvoiceDialog } from "@/features/accounts/components/pay-invoice-dialog"
import { BalanceAdjustmentHistory } from "./balance-adjustment-history"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { useRouter } from "next/navigation"


const getAccountIcon = (type: string) => {
    switch (type?.toLowerCase()) {
        case 'carteira': return Wallet;
        case 'poupanca':
        case 'poupança': return PiggyBank;
        case 'reserva_emergencia': return PiggyBank;
        case 'investimento': return TrendingUp;
        case 'digital': return Smartphone;
        case 'corrente': return Landmark;
        case 'internacional': return Globe;
        case 'vale_alimentacao': return Utensils;
        default: return CreditCard;
    }
}

const getAccountLabel = (type: string) => {
    switch (type?.toLowerCase()) {
        case 'carteira': return 'Carteira';
        case 'poupanca':
        case 'poupança': return 'Poupança';
        case 'reserva_emergencia': return 'Reserva de Emergência';
        case 'digital': return 'Conta Digital';
        case 'corrente': return 'Conta Corrente';
        case 'internacional': return 'Conta Internacional';
        case 'vale_alimentacao': return 'Vale Alimentação';
        case 'outros': return 'Outros';
        case 'cartao_credito': return 'Cartão de Crédito';
        case 'investimento': return 'Investimento';
        default: return type || 'Conta';
    }
}

const getAccountColor = (type: string) => {
    switch (type?.toLowerCase()) {
        case 'corrente': return '#10b981' // emerald-500
        case 'digital': return '#3b82f6' // blue-500
        case 'poupanca':
        case 'poupança': return '#f59e0b' // amber-500
        case 'reserva_emergencia': return '#f59e0b' // amber-500 (mesma cor da poupança)
        case 'investimento': return '#8b5cf6' // violet-500
        case 'carteira': return '#64748b' // slate-500
        case 'cartao_credito': return '#f97316' // orange-500
        case 'internacional': return '#06b6d4' // cyan-500
        case 'vale_alimentacao': return '#ec4899' // pink-500
        default: return '#3b82f6'
    }
}

export function AccountCard({ account, allAccounts = [], paymentMethods = [], onUpdate }: { account: any, allAccounts?: any[], paymentMethods?: any[], onUpdate?: () => void }) {
    const router = useRouter()
    const [showEdit, setShowEdit] = useState(false)
    const [showPayInvoice, setShowPayInvoice] = useState(false)
    const [showDelete, setShowDelete] = useState(false)
    const [showHistory, setShowHistory] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const Icon = getAccountIcon(account.type)
    const color = account.color || getAccountColor(account.type)

    // Contas inativas ficam levemente apagadas
    const isActive = account.is_active !== false
    const isCreditCard = account.type?.toLowerCase() === 'cartao_credito'

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            await deleteAccount(account.id)
            router.refresh()
            if (onUpdate) onUpdate()
            toast.success("Conta excluída com sucesso!")
        } catch (error: any) {
            console.error("Erro ao excluir:", error)
            setIsDeleting(false)
            if (error.message?.includes("foreign key") || error.message?.includes("constraint")) {
                toast.error("Não é possível excluir esta conta pois existem transações ou registros vinculados a ela. Exclua as transações primeiro.")
            } else {
                toast.error("Erro ao excluir conta: " + (error.message || "Erro desconhecido"))
            }
        }
    }

    // HEX to RGB para usar com opacidade no background
    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : '255 255 255';
    }
    const rgbColor = hexToRgb(color)

    return (
        <>
            <Card className={`group relative overflow-hidden transition-all duration-300 hover:shadow-xl ${account.balance < 0
                ? 'border-red-300 dark:border-red-800 bg-red-50/30 dark:bg-red-950/10'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                } ${!isActive ? 'opacity-60 grayscale-[0.8] hover:opacity-100 hover:grayscale-0' : ''}`}
                style={{
                    // Background sutil com gradiente radial na cor da conta (ou vermelho se negativo)
                    backgroundImage: account.balance < 0
                        ? `radial-gradient(circle at 100% 100%, rgb(239 68 68 / 0.08) 0%, transparent 50%)`
                        : `radial-gradient(circle at 100% 100%, rgb(${rgbColor} / 0.08) 0%, transparent 50%)`
                }}
            >
                {/* Border Top Color */}
                <div className="absolute top-0 left-0 w-full h-[3px]" style={{ backgroundColor: account.balance < 0 ? '#ef4444' : color }} />

                {/* Watermark Gigante (Background Estilizado) */}
                <div className="absolute -bottom-6 -right-6 text-slate-900/5 dark:text-white/5 pointer-events-none transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[-5deg]" style={{ color: color, opacity: 0.1 }}>
                    <Icon strokeWidth={1} className="w-32 h-32 sm:w-48 sm:h-48" />
                </div>

                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 sm:pt-5 relative z-10">
                    <CardTitle className="text-sm font-medium flex-1 min-w-0">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-center transition-colors shrink-0">
                                <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: color }} />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="truncate text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100">{account.name}</span>
                                {!isActive && <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400">Inativa</span>}
                            </div>
                        </div>
                    </CardTitle>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full shrink-0">
                                <span className="sr-only">Abrir menu</span>
                                <MoreHorizontal className="h-4 w-4 sm:h-5 sm:w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {isCreditCard && (
                                <>
                                    <DropdownMenuItem
                                        onSelect={(e) => {
                                            e.preventDefault()
                                            setShowPayInvoice(true)
                                        }}
                                        className="cursor-pointer text-emerald-600 focus:text-emerald-600 font-medium"
                                    >
                                        <Wallet className="mr-2 h-4 w-4" />
                                        Pagar Fatura
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                </>
                            )}
                            <DropdownMenuItem
                                onSelect={(e) => {
                                    e.preventDefault()
                                    setShowEdit(true)
                                }}
                                className="cursor-pointer"
                            >
                                <Edit2 className="mr-2 h-4 w-4" />
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onSelect={(e) => {
                                    e.preventDefault()
                                    setShowHistory(true)
                                }}
                                className="cursor-pointer"
                            >
                                <History className="mr-2 h-4 w-4" />
                                Histórico e Ajustes
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-red-600 focus:text-red-600 cursor-pointer"
                                onSelect={(e) => {
                                    e.preventDefault()
                                    setShowDelete(true)
                                }}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardHeader>
                <CardContent className="relative z-10">
                    <div className={`text-xl sm:text-2xl font-bold mt-3 sm:mt-4 tracking-tight ${account.balance < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                        {formatCurrency(account.balance)}
                    </div>

                    {/* Badge para saldo negativo */}
                    {account.balance < 0 && (
                        <div className="mt-2 inline-flex items-center gap-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-2 py-1 rounded-md text-[10px] sm:text-xs font-semibold border border-red-200 dark:border-red-800 max-w-full">
                            <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span className="truncate">
                                {account.type?.toLowerCase() === 'digital' || account.type?.toLowerCase() === 'corrente'
                                    ? 'Limite usado'
                                    : 'Saldo negativo'}
                            </span>
                        </div>
                    )}

                    {/* Detalhes de Rendimento (Estilo Fintech) */}
                    {!isCreditCard && account.yield_rate > 0 && account.balance > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/50 flex flex-col gap-2">
                            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                                <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Rentabilidade</span>
                                <span className="text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-1.5 py-0.5 rounded border border-purple-100 dark:border-purple-800">
                                    {account.yield_rate}% a.m.
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-md border border-slate-100 dark:border-slate-800 flex flex-col transition-colors hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10">
                                    <span className="text-[10px] text-slate-500 font-medium">Render hoje</span>
                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                        +{formatCurrency(account.yield_today || 0)}
                                    </span>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-md border border-slate-100 dark:border-slate-800 flex flex-col transition-colors hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10">
                                    <span className="text-[10px] text-slate-500 font-medium">Acumulado Mês</span>
                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                        +{formatCurrency(account.yield_month || 0)}
                                    </span>
                                </div>
                            </div>

                            {/* Data de Atualização */}
                            <div className="flex justify-end">
                                <span className="text-[9px] text-slate-400 flex items-center gap-1 opacity-70">
                                    <RefreshCw className="w-2.5 h-2.5" />
                                    Até {account.last_yield_date ? new Date(account.last_yield_date).toLocaleDateString('pt-BR') : 'hoje'}
                                </span>
                            </div>
                        </div>
                    )}



                    <div className="flex items-center justify-between mt-3">
                        <p className="text-xs font-medium text-slate-500 capitalize flex items-center gap-1.5 bg-slate-50/80 dark:bg-slate-800/80 px-2 py-1 rounded-md backdrop-blur-sm">
                            {getAccountLabel(account.type)}
                        </p>
                        {/* Dot Indicador */}
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: color }} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <EditAccountDialog account={account} open={showEdit} onOpenChange={setShowEdit} />

            {showPayInvoice && (
                <PayInvoiceDialog
                    open={showPayInvoice}
                    onOpenChange={setShowPayInvoice}
                    targetAccount={account}
                    sourceAccounts={allAccounts}
                    paymentMethods={paymentMethods}
                />
            )}

            <Dialog open={showHistory} onOpenChange={setShowHistory}>
                <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Histórico e Ajustes</DialogTitle>
                    </DialogHeader>
                    <BalanceAdjustmentHistory
                        accountId={account.id}
                        accountName={account.name}
                        onUpdate={onUpdate}
                    />
                </DialogContent>
            </Dialog>

            <DeleteDialog
                open={showDelete}
                onOpenChange={setShowDelete}
                onConfirm={handleDelete}
                title="Excluir Conta"
                description={`Tem certeza que deseja excluir a conta "${account.name}"? Esta ação não pode ser desfeita.`}
                isDeleting={isDeleting}
            />
        </>
    )
}
