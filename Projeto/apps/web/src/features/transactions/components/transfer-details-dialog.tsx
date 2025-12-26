'use client'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Info, ArrowRightLeft, Calendar, FileText, Building2, Banknote } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface TransferDetailsDialogProps {
    transaction: any
    trigger?: React.ReactNode
}

export function TransferDetailsDialog({ transaction, trigger }: TransferDetailsDialogProps) {
    if (transaction.type !== 'transferencia') {
        return null
    }

    const descLower = transaction.description?.toLowerCase() || ''
    const isIncoming = descLower.includes('de ') || descLower.includes('recebida')
    const isOutgoing = descLower.includes('para ') || descLower.includes('enviada')

    // Extrair nome da conta da descrição
    let otherAccount = ''
    if (isIncoming) {
        const match = transaction.description?.match(/de\s+(.+)/i)
        otherAccount = match ? match[1] : 'Conta desconhecida'
    } else if (isOutgoing) {
        const match = transaction.description?.match(/para\s+(.+)/i)
        otherAccount = match ? match[1] : 'Conta desconhecida'
    }

    const dateObj = new Date(transaction.date)
    const utcDate = new Date(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate())

    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger || (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                    >
                        <Info className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isIncoming
                            ? 'bg-emerald-100 dark:bg-emerald-950/30'
                            : 'bg-rose-100 dark:bg-rose-950/30'
                            }`}>
                            <ArrowRightLeft className={`w-4 h-4 ${isIncoming
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                                }`} />
                        </div>
                        Detalhes da Transferência
                    </DialogTitle>
                    <DialogDescription>
                        {isIncoming ? 'Transferência recebida' : 'Transferência enviada'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Valor */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <div className="flex items-center gap-2">
                            <Banknote className="w-5 h-5 text-slate-400" />
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                Valor
                            </span>
                        </div>
                        <span className={`text-2xl font-bold ${isIncoming
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                            }`}>
                            {isOutgoing && '- '}{formatCurrency(transaction.amount)}
                        </span>
                    </div>

                    {/* Data */}
                    <div className="flex items-start gap-3 p-3 border border-slate-200 dark:border-slate-800 rounded-lg">
                        <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                Data
                            </p>
                            <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                {format(utcDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </p>
                            <p className="text-xs text-slate-500">
                                {format(utcDate, 'EEEE', { locale: ptBR })}
                            </p>
                        </div>
                    </div>

                    {/* Contas */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Conta Origem */}
                        <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Building2 className="w-4 h-4 text-slate-400" />
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                    {isIncoming ? 'De' : 'Origem'}
                                </p>
                            </div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                {isIncoming ? otherAccount : transaction.account?.name || 'Conta'}
                            </p>
                        </div>

                        {/* Conta Destino */}
                        <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Building2 className="w-4 h-4 text-slate-400" />
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                    {isOutgoing ? 'Para' : 'Destino'}
                                </p>
                            </div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                {isOutgoing ? otherAccount : transaction.account?.name || 'Conta'}
                            </p>
                        </div>
                    </div>

                    {/* Descrição */}
                    <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-slate-400" />
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                Descrição
                            </p>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                            {transaction.description}
                        </p>
                    </div>

                    {/* Observações (se houver) */}
                    {transaction.notes && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
                                    Observações
                                </p>
                            </div>
                            <p className="text-sm text-blue-900 dark:text-blue-300 whitespace-pre-wrap">
                                {transaction.notes}
                            </p>
                        </div>
                    )}

                    {/* ID da Transação */}
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                        <p className="text-xs text-slate-400 font-mono">
                            ID: {transaction.id}
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
