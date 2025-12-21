"use client"

import { useState, useEffect, useRef } from "react"
import { Invoice, Transaction, getInvoiceDetails, payInvoice, deleteTransaction, revertInvoicePayment, deleteInstallmentSeries, InvoicePayment } from "../actions"
import { formatCurrency, cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
    CheckCircle2, 
    ShoppingBag, 
    Trash2, 
    Edit2, 
    RotateCcw, 
    CreditCard as CreditCardIcon, 
    Calendar, 
    ArrowDownCircle, 
    ArrowUpCircle, 
    AlertCircle,
    MoreVertical,
    Wallet
} from "lucide-react"
import { EditTransactionDialog } from "@/features/transactions/components/edit-transaction-dialog"
import { PayCardInvoiceDialog } from "@/features/cards/components/pay-invoice-dialog"
import { BrandIcon } from "@/features/transactions/components/brand-icon"
import { usePermission } from "@/hooks/use-permission"
import { usePrimaryCard } from "@/hooks/use-primary-card"
import { getTextColor, isLightColor, adjustBrightness } from "@/lib/utils/colors"
import { toast } from "sonner"

const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

const getStatusColor = (status: string) => {
    switch (status) {
        case 'paid': return 'bg-emerald-500'
        case 'partial': return 'bg-amber-500'
        case 'closed': return 'bg-blue-500'
        case 'overdue': return 'bg-red-500'
        default: return 'bg-slate-300'
    }
}

const translateStatus = (status: string) => {
    switch (status) {
        case 'open': return 'Em Aberto'
        case 'closed': return 'Fechada'
        case 'paid': return 'Paga'
        case 'overdue': return 'Vencida'
        case 'partial': return 'Parcial'
        default: return status
    }
}

interface InvoiceListProps {
    invoices: Invoice[]
    cardId: string
    accounts?: any[]
    cardName?: string
    cardColor?: string
    cardBrand?: string
    paymentMethods?: any[]
}

export function InvoiceList({ invoices, cardId, accounts = [], cardName = 'Cartão', cardColor = '#3b82f6', cardBrand = 'Card', paymentMethods = [] }: InvoiceListProps) {
    const { can } = usePermission()
    const { primaryCardId } = usePrimaryCard()

    const isPlanLocked = !can('unlimited_cards') && cardId !== primaryCardId

    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    // Ordenar faturas: Ano desc, Mês desc
    const rawSortedInvoices = [...invoices].sort((a, b) => {
        if (a.reference_year !== b.reference_year) return a.reference_year - b.reference_year
        return a.reference_month - b.reference_month
    })

    // Se não houver faturas, não mostra nada (ou poderia mostrar estado vazio)
    // Mas vamos assumir que sempre tem pelo menos a atual se o backend criar
    const sortedInvoices = rawSortedInvoices

    // Selecionar fatura padrão (atual ou última)
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)

    useEffect(() => {
        if (invoices.length > 0 && !selectedInvoiceId) {
            // Tenta achar a fatura do mês atual
            const currentInvoice = invoices.find(inv => 
                inv.reference_month === currentMonth && 
                inv.reference_year === currentYear
            )
            
            if (currentInvoice) {
                setSelectedInvoiceId(currentInvoice.id)
            } else {
                // Se não achar, pega a última disponível (mais recente)
                const lastInvoice = rawSortedInvoices[rawSortedInvoices.length - 1]
                setSelectedInvoiceId(lastInvoice.id)
            }
        }
    }, [invoices, currentMonth, currentYear, selectedInvoiceId, rawSortedInvoices])

    // Fetch details when selected invoice changes
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [payments, setPayments] = useState<InvoicePayment[]>([])
    const [rolloverAmount, setRolloverAmount] = useState(0)
    const [isLoadingDetails, setIsLoadingDetails] = useState(false)
    const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null)
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)

    useEffect(() => {
        if (selectedInvoiceId) {
            setIsLoadingDetails(true)
            getInvoiceDetails(selectedInvoiceId)
                .then(data => {
                    setTransactions(data.transactions || [])
                    setPayments(data.payments || [])
                    setRolloverAmount(data.rollover_amount || 0)
                })
                .catch(err => {
                    console.error("Failed to load invoice details", err)
                    toast.error("Erro ao carregar detalhes da fatura")
                })
                .finally(() => setIsLoadingDetails(false))
        }
    }, [selectedInvoiceId])

    const selectedInvoice = sortedInvoices.find(inv => inv.id === selectedInvoiceId)
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    // Scroll to selected invoice on mount/change
    useEffect(() => {
        if (selectedInvoiceId && scrollContainerRef.current) {
            const btn = document.getElementById(`invoice-btn-${selectedInvoiceId}`)
            if (btn) {
                btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
            }
        }
    }, [selectedInvoiceId])

    if (!selectedInvoice) return null

    // Cálculos
    // Soma de transações do mês
    const transactionsTotal = transactions.reduce((acc, t) => acc + t.amount, 0)
    
    // Total de pagamentos realizados
    const paymentTotal = payments.reduce((acc, p) => acc + p.amount, 0)

    // Fallback seguro para paid_amount e total_amount
    const safePaidAmount = selectedInvoice.paid_amount || 0
    const safeTotalAmount = selectedInvoice.total_amount || 0

    // Lógica para determinar o valor efetivamente pago visualmente
    // Se o backend diz que tem paid_amount, usamos ele.
    // Se for 0 mas tiver pagamentos na lista (legado ou delay), usamos a soma dos pagamentos.
    // Se status for 'paid' mas paid_amount for 0, assumimos total (legado).
    let effectivePaidAmount = safePaidAmount
    if (effectivePaidAmount === 0) {
        if (paymentTotal > 0) {
            effectivePaidAmount = paymentTotal
        } else if (selectedInvoice.status === 'paid') {
            effectivePaidAmount = safeTotalAmount
        }
    }

    const remainingAmount = safeTotalAmount - effectivePaidAmount
    
    // Handler para deletar transação
    const handleDeleteTransaction = async () => {
        if (!transactionToDelete) return
        try {
            await deleteTransaction(transactionToDelete)
            // Refresh
            const data = await getInvoiceDetails(selectedInvoice.id)
            setTransactions(data.transactions)
            setTransactionToDelete(null)
            toast.success("Transação excluída com sucesso!")
        } catch (e: any) { 
            toast.error("Erro ao excluir: " + e.message) 
        }
    }

    const handleUpdateSuccess = async () => {
        setEditingTransaction(null)
        const data = await getInvoiceDetails(selectedInvoice.id)
        setTransactions(data.transactions)
    }

    const handleRevertPayment = async () => {
        try {
            await revertInvoicePayment(selectedInvoice.id)
            toast.success("Pagamento estornado com sucesso")
            // Refresh
            const data = await getInvoiceDetails(selectedInvoice.id)
            setPayments(data.payments)
            setTransactions(data.transactions)
            // Force page refresh to update invoice status in list if needed
            window.location.reload()
        } catch (error) {
            toast.error("Erro ao estornar pagamento")
        }
    }

    // Agrupar transações por data
    const groupedTransactions = transactions.reduce((groups, transaction) => {
        const date = transaction.transaction_date.split('T')[0]
        if (!groups[date]) {
            groups[date] = []
        }
        groups[date].push(transaction)
        return groups
    }, {} as Record<string, Transaction[]>)

    const sortedDates = Object.keys(groupedTransactions).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

    const textColor = getTextColor(cardColor)
    const isLight = isLightColor(cardColor)

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* 1. TOP NAVIGATION: CAROUSEL */}
            <div className="relative">
                 <div 
                    ref={scrollContainerRef}
                    className="flex overflow-x-auto pb-4 gap-3 px-1 hide-scrollbar snap-x snap-mandatory scroll-smooth -mx-1"
                >
                    {sortedInvoices.map((inv) => {
                        const isSelected = inv.id === selectedInvoiceId
                        const monthName = monthNames[inv.reference_month - 1]
                        const statusColor = getStatusColor(inv.status)
                        
                        return (
                            <button
                                key={inv.id}
                                id={`invoice-btn-${inv.id}`}
                                onClick={() => setSelectedInvoiceId(inv.id)}
                                className={cn(
                                    "flex flex-col items-center justify-center min-w-[100px] h-[70px] rounded-xl border transition-all snap-center",
                                    isSelected 
                                        ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 shadow-md ring-2 ring-offset-2 ring-slate-900 dark:ring-white z-10" 
                                        : "bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100"
                                )}
                            >
                                <span className="text-xs uppercase font-bold tracking-wider mb-1 leading-none">
                                    {monthName}
                                </span>
                                <span className="text-[10px] opacity-70 mb-1.5 leading-none">{inv.reference_year}</span>
                                <div className={cn("w-1.5 h-1.5 rounded-full", statusColor)}></div>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* 2. MAIN SPLIT: SUMMARY LEFT, DETAILS RIGHT */}
            <div className="grid gap-8 lg:grid-cols-12">
                
                {/* LEFT COLUMN: INVOICE CARD & STATUS (4/12) */}
                <div className="lg:col-span-4 space-y-6">
                    <Card 
                        className="overflow-hidden border-0 shadow-xl relative transition-all group"
                        style={{
                            backgroundColor: cardColor,
                            background: `linear-gradient(135deg, ${cardColor} 0%, ${adjustBrightness(cardColor, -30)} 100%)`,
                            color: textColor
                        }}
                    >
                        {/* Texture & Watermark */}
                        <div className="absolute inset-0 opacity-10 pointer-events-none"
                            style={{
                                backgroundImage: 'radial-gradient(circle at 100% 100%, rgba(255,255,255,0.2) 0%, transparent 50%), radial-gradient(circle at 0% 0%, rgba(255,255,255,0.2) 0%, transparent 50%)',
                                backgroundSize: '100% 100%'
                            }}></div>
                        
                        <div 
                            className="absolute -right-16 bottom-24 transform rotate-[15deg] pointer-events-none transition-transform group-hover:scale-110 duration-700"
                            style={{
                                color: isLight ? 'black' : 'white',
                                opacity: 0.05
                            }}
                        >
                            <CreditCardIcon className="w-64 h-64" />
                        </div>

                        <div className="p-6 relative z-10">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-8">
                                <div>
                                    <h3 className="text-lg font-bold opacity-90">{cardName}</h3>
                                    <p className="text-xs opacity-70 uppercase tracking-widest font-medium mt-1">
                                        {monthNames[selectedInvoice.reference_month - 1]} / {selectedInvoice.reference_year}
                                    </p>
                                </div>
                                <div className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md", 
                                    isLight ? "bg-black/10 text-black" : "bg-white/20 text-white"
                                )}>
                                    {translateStatus(selectedInvoice.status)}
                                </div>
                            </div>

                            {/* Amount */}
                            <div className="mb-8">
                                <p className="text-sm opacity-80 font-medium mb-1">Valor da Fatura</p>
                                <div className="text-4xl font-mono font-bold tracking-tight">
                                    {formatCurrency(safeTotalAmount)}
                                </div>
                            </div>

                            {/* Mini Statement */}
                            <div className={cn("rounded-lg p-4 backdrop-blur-md", isLight ? "bg-black/5" : "bg-white/10")}>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between opacity-80">
                                        <span>Saldo Anterior</span>
                                        <span>{formatCurrency(rolloverAmount)}</span>
                                    </div>
                                    <div className="flex justify-between opacity-80">
                                        <span>Compras do Mês</span>
                                        <span>{formatCurrency(transactionsTotal)}</span>
                                    </div>
                                    <div className="h-px bg-current opacity-20 my-2"></div>
                                    <div className="flex justify-between font-bold">
                                        <span>Total Pago</span>
                                        <span className={effectivePaidAmount > 0 ? cn("px-2 py-0.5 rounded-md", isLight ? "text-emerald-800 bg-emerald-100/60" : "text-emerald-300 bg-emerald-900/40") : ""}>
                                            - {formatCurrency(effectivePaidAmount)}
                                        </span>
                                    </div>
                                    {selectedInvoice.status !== 'paid' && (
                                        <div className="flex justify-between font-bold pt-1">
                                            <span>Restante</span>
                                            <span>{formatCurrency(remainingAmount)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Actions Footer */}
                        <div className={cn("p-4 border-t backdrop-blur-sm bg-black/5 flex gap-2", isLight ? "border-black/10" : "border-white/10")}>
                            {selectedInvoice.status !== 'paid' && selectedInvoice.status !== 'closed' && (
                                <PayCardInvoiceDialog
                                    invoice={selectedInvoice}
                                    sourceAccounts={accounts}
                                    paymentMethods={paymentMethods}
                                    remainingAmount={remainingAmount}
                                    cardName={cardName}
                                >
                                    <Button className="w-full shadow-lg" variant={isLight ? "default" : "secondary"}>
                                        <Wallet className="w-4 h-4 mr-2" />
                                        Pagar Fatura
                                    </Button>
                                </PayCardInvoiceDialog>
                            )}
                            
                            {selectedInvoice.status === 'paid' && (
                                <Button 
                                    variant="outline" 
                                    className="w-full bg-transparent border-current opacity-80 hover:opacity-100 hover:bg-white/10"
                                    onClick={handleRevertPayment}
                                >
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Estornar Pagamento
                                </Button>
                            )}
                        </div>
                    </Card>

                    {/* Alerts / Info */}
                    {selectedInvoice.status === 'overdue' && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 p-4 rounded-lg flex gap-3 text-red-800 dark:text-red-200">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <div className="text-sm">
                                <p className="font-bold">Fatura Vencida</p>
                                <p className="opacity-90">Realize o pagamento o quanto antes para evitar juros.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN: TRANSACTIONS LIST (8/12) */}
                <div className="lg:col-span-8">
                    <div className="bg-white dark:bg-slate-950 rounded-xl border shadow-sm">
                        <div className="p-6 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                            <div>
                                <h3 className="font-bold text-lg">Extrato</h3>
                                <p className="text-sm text-muted-foreground">
                                    {transactions.length} lançamentos neste mês
                                </p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => window.print()}>
                                Exportar
                            </Button>
                        </div>

                        <div className="divide-y">
                            {isLoadingDetails ? (
                                <div className="p-12 text-center text-muted-foreground">
                                    Carregando transações...
                                </div>
                            ) : transactions.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <ShoppingBag className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <h3 className="font-medium text-lg">Nenhuma transação</h3>
                                    <p className="text-muted-foreground">Não há lançamentos nesta fatura.</p>
                                </div>
                            ) : (
                                sortedDates.map(date => (
                                    <div key={date} className="group/date">
                                        <div className="bg-slate-50/80 dark:bg-slate-900/80 px-6 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider sticky top-0 backdrop-blur-sm z-10 border-y border-transparent group-first/date:border-t-0">
                                            {new Date(date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                        </div>
                                        <div>
                                            {groupedTransactions[date].map((transaction) => (
                                                <div 
                                                    key={transaction.id} 
                                                    className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group/item"
                                                >
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                                        <BrandIcon brand={transaction.description} className="w-5 h-5 text-slate-500" />
                                                    </div>
                                                    
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-medium truncate">{transaction.description}</p>
                                                            {transaction.installments > 1 && (
                                                                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-muted-foreground font-medium">
                                                                    {transaction.current_installment}/{transaction.installments}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            <span>{transaction.category?.name || 'Sem categoria'}</span>
                                                            {transaction.subcategory && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span>{transaction.subcategory.name}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="text-right">
                                                        <p className="font-mono font-medium">
                                                            {formatCurrency(transaction.amount)}
                                                        </p>
                                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="h-6 w-6" 
                                                                onClick={() => setEditingTransaction(transaction)}
                                                            >
                                                                <Edit2 className="w-3 h-3" />
                                                            </Button>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-6 w-6">
                                                                        <Trash2 className="w-3 h-3 text-red-500" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem 
                                                                        className="text-red-600"
                                                                        onClick={() => setTransactionToDelete(transaction.id)}
                                                                    >
                                                                        Excluir esta transação
                                                                    </DropdownMenuItem>
                                                                    {transaction.installments > 1 && (
                                                                        <DropdownMenuItem 
                                                                            className="text-red-600"
                                                                            onClick={async () => {
                                                                                if(confirm("Excluir todas as parcelas?")) {
                                                                                    await deleteInstallmentSeries(transaction.id)
                                                                                    // refresh logic
                                                                                    const data = await getInvoiceDetails(selectedInvoice.id)
                                                                                    setTransactions(data.transactions)
                                                                                }
                                                                            }}
                                                                        >
                                                                            Excluir todas as parcelas
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Dialogs */}
            <AlertDialog open={!!transactionToDelete} onOpenChange={() => setTransactionToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Transação</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir esta transação? O valor será removido da fatura.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteTransaction} className="bg-red-600 hover:bg-red-700">
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {editingTransaction && (
                <EditTransactionDialog
                    transaction={editingTransaction}
                    open={!!editingTransaction}
                    onOpenChange={(open) => !open && setEditingTransaction(null)}
                    onSuccess={handleUpdateSuccess}
                />
            )}
        </div>
    )
}
