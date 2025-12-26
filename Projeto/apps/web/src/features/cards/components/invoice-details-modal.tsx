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
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, CreditCard, DollarSign, ShoppingBag, RotateCcw, AlertCircle, Wallet } from "lucide-react"
import { formatCurrency, cn } from "@/lib/utils"
import { adjustBrightness, getTextColor, isLightColor } from "@/lib/utils/colors"
import { revertInvoicePayment } from "@/app/(protected)/compromissos/cards/actions"
import { useRouter } from "next/navigation"
import { PayCardInvoiceDialog } from "@/features/cards/components/pay-invoice-dialog"

// Helpers de Cor removidos em favor de @/lib/utils/colors

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
    const [isPayDialogOpen, setIsPayDialogOpen] = useState(false)
    const [accounts, setAccounts] = useState<any[]>([])
    const [paymentMethods, setPaymentMethods] = useState<any[]>([])

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

    const handlePayClick = async () => {
        if (accounts.length === 0) {
            try {
                const { getAccounts } = await import("@/app/(protected)/caixa/accounts/actions")
                const { getPaymentMethods } = await import("@/app/(protected)/caixa/transactions/actions")

                const [accs, methods] = await Promise.all([
                    getAccounts(true),
                    getPaymentMethods()
                ])
                setAccounts(accs)
                setPaymentMethods(methods)
            } catch (error) {
                console.error("Error loading payment options:", error)
                toast.error("Erro ao carregar opções de pagamento")
                return
            }
        }
        setIsPayDialogOpen(true)
    }

    const handleRevert = () => {
        if (!invoiceId) return

        startTransition(async () => {
            try {
                await revertInvoicePayment(invoiceId)
                setIsRevertDialogOpen(false)
                onOpenChange(false)
                router.refresh()
                toast.success("Pagamento estornado com sucesso!")
            } catch (error: any) {
                console.error("Revert error:", error)
                toast.error(`Erro ao estornar: ${error.message || error}`)
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

    // Calculate overdue status
    const isOverdue = invoice?.status === 'open' && dueDate && dueDate < new Date(new Date().setHours(0, 0, 0, 0))

    const getStatusBadge = (status: string) => {
        if (isOverdue) {
            return <Badge className="bg-red-500 hover:bg-red-600 border-none text-white shadow-sm">Vencida</Badge>
        }

        switch (status) {
            case 'paid':
            case 'paid':
                return <Badge className="bg-emerald-500 hover:bg-emerald-600 border-none shadow-none text-white text-sm font-semibold px-3 py-1.5">Fatura Paga</Badge>
            case 'closed':
                return <Badge variant="secondary" className="bg-slate-200 dark:bg-slate-800">Fechada</Badge>
            case 'open':
                return <Badge className="bg-white text-blue-600 hover:bg-blue-50 border-none shadow-sm">Aberta</Badge>
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

                        {/* Resumo Financeiro */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Resumo Financeiro</h4>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-600 dark:text-slate-300">Fatura Atual</span>
                                    <span className="font-medium">{formatCurrency(invoice.total_amount || 0)}</span>
                                </div>

                                {(invoiceData?.rollover_amount !== 0) && (
                                    <div className="flex justify-between items-center">
                                        <span className={cn("flex items-center gap-1",
                                            invoiceData?.rollover_amount < 0 ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-slate-600 dark:text-slate-300"
                                        )}>
                                            {invoiceData?.rollover_amount < 0 ? "Pagamento Antecipado" : "Saldo Anterior"}
                                        </span>
                                        <span className={cn("font-medium", invoiceData?.rollover_amount > 0 ? "text-red-600" : "text-emerald-600 dark:text-emerald-400")}>
                                            {formatCurrency(invoiceData?.rollover_amount || 0)}
                                        </span>
                                    </div>
                                )}

                                {(invoice.paid_amount || 0) > 0 && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600 dark:text-slate-300">Pagamentos</span>
                                        <span className="font-medium text-emerald-600">
                                            -{formatCurrency(invoice.paid_amount || 0)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-slate-900 dark:text-white">A Pagar</span>
                                    <span className="font-bold text-lg text-slate-900 dark:text-white">
                                        {formatCurrency(Math.max(0, (invoice.total_amount || 0) + (invoiceData?.rollover_amount || 0) - (invoice.paid_amount || 0)))}
                                    </span>
                                </div>
                                {(invoiceData?.rollover_amount < 0) && (
                                    <p className="text-[10px] text-slate-500 mt-1 text-right">
                                        * Crédito da fatura anterior aplicado
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Composição do Pagamento (Apenas informativo se já pago) */}
                        {(() => {
                            const payments = invoiceData.payments || []
                            const rolloverAmount = invoiceData.rollover_amount || 0
                            const paymentTotal = payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0)
                            // Net Owed = Total (Gross) + Rollover (Credit is negative, so it reduces debt)
                            const netOwed = (invoice.total_amount || 0) + rolloverAmount
                            const surplusNext = Math.max(0, paymentTotal - netOwed)

                            // Show ONLY if there is a surplus carried over to NEXT month
                            if (surplusNext <= 0.01) return null

                            return (
                                <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200 dark:border-amber-900/30">
                                    <div className="flex justify-between text-amber-800 dark:text-amber-500 font-bold text-sm">
                                        <span>Crédito para próxima fatura</span>
                                        <span>{formatCurrency(surplusNext)}</span>
                                    </div>
                                    <p className="text-[10px] text-amber-700/70 dark:text-amber-500/70 mt-1">
                                        Valor excedente disponível como crédito.
                                    </p>
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

                {/* Footer com botão de pagar (NOVO) */}
                {!isPaid && invoice && (
                    <DialogFooter className="border-t pt-4">
                        <Button
                            className="w-full sm:w-auto shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={handlePayClick}
                        >
                            <Wallet className="w-4 h-4 mr-2" />
                            Pagar {formatCurrency(Math.max(0, (invoice.total_amount || 0) + (invoiceData?.rollover_amount || 0) - (invoice.paid_amount || 0)))}
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>

            {/* Pay Dialog */}
            {invoice && (
                <PayCardInvoiceDialog
                    open={isPayDialogOpen}
                    onOpenChange={(val) => {
                        setIsPayDialogOpen(val)
                        if (!val) {
                            loadInvoiceDetails()
                            router.refresh()
                        }
                    }}
                    invoice={invoice}
                    sourceAccounts={accounts}
                    paymentMethods={paymentMethods}
                    cardName={invoice.credit_card?.name}
                    remainingAmount={Math.max(0, (invoice.total_amount || 0) + (invoiceData?.rollover_amount || 0) - (invoice.paid_amount || 0))}
                />
            )}

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
