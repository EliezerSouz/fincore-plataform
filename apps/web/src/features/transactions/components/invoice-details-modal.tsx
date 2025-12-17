"use client"

import { useState, useEffect, useTransition } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, CreditCard, DollarSign, ShoppingBag, RotateCcw, AlertCircle } from "lucide-react"
import { formatCurrency, cn } from "@/lib/utils"
import { revertInvoicePayment } from "@/app/(protected)/compromissos/cards/actions"
import { useRouter } from "next/navigation"

// Função para ajustar brilho (copiada de credit-card-item) - Idealmente deveria estar em utils
function adjustBrightness(col: string, amt: number) {
    if (!col) return '#3b82f6'; // Fallback
    var usePound = false;
    if (col[0] == "#") {
        col = col.slice(1);
        usePound = true;
    }
    var num = parseInt(col, 16);
    var r = (num >> 16) + amt;
    if (r > 255) r = 255;
    else if (r < 0) r = 0;
    var b = ((num >> 8) & 0x00FF) + amt;
    if (b > 255) b = 255;
    else if (b < 0) b = 0;
    var g = (num & 0x0000FF) + amt;
    if (g > 255) g = 255;
    else if (g < 0) g = 0;
    return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16);
}

// Retorna se a cor é clara
function isLightColor(hex: string): boolean {
    if (!hex) return false;
    const color = hex.replace('#', '');
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq >= 128;
}

function getTextColor(bgColor: string): string {
    if (!bgColor) return '#ffffff';
    if (bgColor.toLowerCase() === '#ffcc00' || isLightColor(bgColor)) {
        return '#003087';
    }
    return '#ffffff';
}

interface InvoiceDetailsModalProps {
    invoiceId: string | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function InvoiceDetailsModal({ invoiceId, open, onOpenChange }: InvoiceDetailsModalProps) {
    const router = useRouter()
    const [invoiceData, setInvoiceData] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [isRevertDialogOpen, setIsRevertDialogOpen] = useState(false)

    useEffect(() => {
        if (open && invoiceId) {
            loadInvoiceDetails()
        }
    }, [open, invoiceId])

    async function loadInvoiceDetails() {
        if (!invoiceId) return

        setLoading(true)
        try {
            const { getInvoiceDetails } = await import("@/app/(protected)/compromissos/cards/actions")
            const data = await getInvoiceDetails(invoiceId)
            setInvoiceData(data)
        } catch (error) {
            console.error("Error loading invoice:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleRevert = () => {
        if (!invoiceId) return

        startTransition(async () => {
            try {
                await revertInvoicePayment(invoiceId)
                setIsRevertDialogOpen(false)
                onOpenChange(false)
                router.refresh()
                alert("Pagamento estornado com sucesso!")
            } catch (error: any) {
                console.error("Revert error:", error)
                alert(`Erro ao estornar: ${error.message || error}`)
            }
        })
    }

    if (!invoiceData && !loading) return null

    const invoice = invoiceData?.invoice
    const transactions = invoiceData?.transactions || []

    const closingDate = invoice?.closing_date ? new Date(invoice.closing_date) : null
    const dueDate = invoice?.due_date ? new Date(invoice.due_date) : null
    const monthYear = closingDate ? closingDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : ''
    const isPaid = invoice?.status === 'paid'

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid':
            case 'paid':
                return <Badge className="bg-emerald-500 hover:bg-emerald-600 border-none text-white">Fatura Paga</Badge>
            case 'closed':
                return <Badge variant="secondary" className="bg-slate-200 dark:bg-slate-800">Fechada</Badge>
            case 'open':
                return <Badge variant="outline" className="border-blue-500 text-blue-500">Aberta</Badge>
            case 'partial':
                return (
                    <Badge className="bg-amber-500 hover:bg-amber-600 border-none text-white flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Pago Parcialmente
                    </Badge>
                )
            default:
                return <Badge variant="secondary">{status}</Badge>
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                        Detalhes da Fatura
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="py-8 text-center text-slate-500">
                        Carregando detalhes...
                    </div>
                ) : invoice ? (
                    <div className="space-y-4">
                        {/* Cartão e Período (Novo Header Visual) */}
                        <div
                            className="p-5 rounded-xl shadow-sm border border-black/5 relative overflow-hidden"
                            style={{
                                backgroundColor: invoice.credit_card?.color || '#3b82f6',
                                background: `linear-gradient(135deg, ${invoice.credit_card?.color || '#3b82f6'} 0%, ${adjustBrightness(invoice.credit_card?.color || '#3b82f6', -30)} 100%)`,
                                color: getTextColor(invoice.credit_card?.color || '#3b82f6')
                            }}
                        >
                            {/* Texture Overlay */}
                            <div className="absolute inset-0 opacity-20"
                                style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>

                            <div className="flex items-center justify-between mb-2 relative z-10">
                                <div>
                                    <h3 className="font-bold text-xl tracking-tight shadow-sm drop-shadow-md">
                                        {invoice.credit_card?.name || 'Cartão'}
                                    </h3>
                                    <p className="text-sm opacity-90 capitalize font-medium">
                                        Fatura de {monthYear}
                                    </p>
                                </div>
                                <div className="bg-white/20 backdrop-blur-md p-1 rounded-lg">
                                    {getStatusBadge(invoice.status)}
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-4 text-xs opacity-90 font-medium relative z-10 mt-2 border-t border-white/20 pt-2">
                                <div className="flex gap-6">
                                    <div className="flex flex-col">
                                        <span className="opacity-70 text-[10px] uppercase tracking-wider">Fechamento</span>
                                        <span>{closingDate?.toLocaleDateString('pt-BR')}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="opacity-70 text-[10px] uppercase tracking-wider">Vencimento</span>
                                        <span>{dueDate?.toLocaleDateString('pt-BR')}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 font-mono opacity-75">
                                    <span className="capitalize">{invoice.credit_card?.brand}</span>
                                    <span>•</span>
                                    <span>Final {invoice.credit_card?.last_4_digits || '****'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Valores */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                                    <DollarSign className="w-3.5 h-3.5" />
                                    Valor Total
                                </div>
                                <p className="font-bold text-lg text-slate-900 dark:text-white">
                                    {formatCurrency(invoice.total_amount || 0)}
                                </p>
                            </div>
                            <div className="bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-lg border border-emerald-200 dark:border-emerald-900/30">
                                <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 mb-1">
                                    <DollarSign className="w-3.5 h-3.5" />
                                    Valor Pago
                                </div>
                                <p className="font-bold text-lg text-emerald-700 dark:text-emerald-400">
                                    {formatCurrency(invoice.paid_amount || 0)}
                                </p>
                            </div>
                        </div>

                        {/* COMPOSIÇÃO DO PAGAMENTO (NOVO) */}
                        {(() => {
                            const payments = invoiceData.payments || []
                            const rolloverAmount = invoiceData.rollover_amount || 0
                            const paymentTotal = payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0)
                            const fundsAvailable = paymentTotal + rolloverAmount
                            const surplusNext = Math.max(0, fundsAvailable - (invoice.total_amount || 0))

                            const showComposition = (invoice.status === 'paid') &&
                                ((Math.abs(paymentTotal - (invoice.total_amount || 0)) > 0.01) || (rolloverAmount > 0.01))

                            if (!showComposition) return null

                            // Determine styles based on card color
                            const isDarkBg = isLightColor(invoice.credit_card?.color || '#000000') // Light color means needs dark text
                            // But here we are in the modal body, which is white/dark-slate. 
                            // The card header is above. This block is in the white area.
                            // So standard text colors apply: slate-900 / white.
                            // However, the user liked the amber highlight for surplus.

                            return (
                                <div className="mt-4 pt-2 pb-2">
                                    <h4 className="text-[11px] uppercase font-bold tracking-wider text-slate-500 mb-3">
                                        Composição do Pagamento
                                    </h4>
                                    <div className="space-y-2 text-xs font-medium">
                                        {rolloverAmount > 0.01 && (
                                            <div className="flex justify-between text-slate-600 dark:text-slate-300">
                                                <span>Crédito fatura anterior</span>
                                                <span>{formatCurrency(rolloverAmount)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-slate-600 dark:text-slate-300">
                                            <span>Valor da fatura atual</span>
                                            <span>{formatCurrency(invoice.total_amount || 0)}</span>
                                        </div>
                                        {surplusNext > 0.01 && (
                                            <div className="flex justify-between text-amber-600 dark:text-amber-500 font-bold">
                                                <span>Crédito para próxima fatura</span>
                                                <span>{formatCurrency(surplusNext)}</span>
                                            </div>
                                        )}

                                        <div className="h-px bg-slate-200 dark:bg-slate-800 my-2"></div>

                                        <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white">
                                            <span>Total pago</span>
                                            <span>{formatCurrency(paymentTotal)}</span>
                                        </div>
                                    </div>
                                    {surplusNext > 0 && (
                                        <p className="text-[10px] text-slate-500 mt-2 leading-tight">
                                            O valor excedente foi convertido em crédito para a próxima fatura,
                                            liberando limite imediatamente.
                                        </p>
                                    )}
                                </div>
                            )
                        })()}

                        {/* Transações */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                                    <ShoppingBag className="w-4 h-4" />
                                    Transações ({transactions.length})
                                </h4>
                            </div>

                            {transactions.length > 0 ? (
                                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                    {transactions.map((tx: any) => (
                                        <div
                                            key={tx.id}
                                            className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800"
                                        >
                                            <div className="flex-1">
                                                <p className="font-medium text-sm text-slate-900 dark:text-white">
                                                    {tx.description}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {new Date(tx.transaction_date).toLocaleDateString('pt-BR')}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-sm text-slate-900 dark:text-white">
                                                    {formatCurrency(tx.amount)}
                                                </p>
                                                {tx.installment_number && (
                                                    <p className="text-xs text-blue-600 dark:text-blue-400">
                                                        {tx.installment_number}/{tx.total_installments}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500 text-center py-4">
                                    Nenhuma transação nesta fatura
                                </p>
                            )}
                        </div>
                    </div>
                ) : null}

                {/* Footer com botão de estornar */}
                {isPaid && (
                    <DialogFooter className="border-t pt-4">
                        <Button
                            onClick={() => setIsRevertDialogOpen(true)}
                            disabled={isPending}
                            variant="outline"
                            className="text-amber-600 border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Estornar Pagamento
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>

            {/* Confirmation Dialog */}
            <AlertDialog open={isRevertDialogOpen} onOpenChange={setIsRevertDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Estornar Pagamento de Fatura?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Este estorno irá desfazer o pagamento e reabrir a fatura.
                            <br /><br />
                            <strong>Atenção:</strong> Esta ação não pode ser desfeita e a fatura voltará ao status "Fechada" aguardando pagamento.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault()
                                handleRevert()
                            }}
                            disabled={isPending}
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                        >
                            {isPending ? 'Estornando...' : 'Sim, estornar pagamento'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Dialog>
    )
}
