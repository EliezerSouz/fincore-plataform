"use client"

import { useState, useEffect, useRef } from "react"
import { Invoice, Transaction, getInvoiceDetails, payInvoice, deleteTransaction, revertInvoicePayment } from "../actions"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, ShoppingBag, Trash2, Edit2, RotateCcw, CreditCard } from "lucide-react"
import { EditTransactionDialog } from "./edit-transaction-dialog"
import { PayCardInvoiceDialog } from "./pay-invoice-dialog"
import { BrandIcon } from "@/components/transactions/brand-icon"
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
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
// REMOVED formatCurrency duplicate import and kept utils
import { usePermission } from "@/hooks/use-permission"
import { usePrimaryCard } from "@/hooks/use-primary-card"

// Helpers de Cor (Mesma lógica do modal para consistência)
function adjustBrightness(col: string, amt: number) {
    if (!col) return '#3b82f6';
    let usePound = false;
    if (col[0] == "#") {
        col = col.slice(1);
        usePound = true;
    }
    let num = parseInt(col, 16);
    let r = (num >> 16) + amt;
    if (r > 255) r = 255; else if (r < 0) r = 0;
    let b = ((num >> 8) & 0x00FF) + amt;
    if (b > 255) b = 255; else if (b < 0) b = 0;
    let g = (num & 0x0000FF) + amt;
    if (g > 255) g = 255; else if (g < 0) g = 0;
    return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16);
}

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
        return '#003087'; // Azul escuro para contraste em fundos claros
    }
    return '#ffffff';
}

// Helper para nome do mês
const MONTH_NAMES = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez"
]

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

    // Bloqueio por permissão (plano)
    const isPlanLocked = !can('unlimited_cards') && cardId !== primaryCardId

    // Ordenar faturas cronologicamente (Antiga -> Nova) para a timeline
    // A prop 'invoices' vem ordenada por data desc (Back-end)
    // Vamos inverter para asc e filtrar faturas zeradas (sem lançamentos) para limpar a view
    // POREM: Precisamos garantir que sempre tenhamos faturas para mostrar, ou o app quebra.
    // Regra: Mostrar se tiver valor > 0 OU se for a fatura do mês atual (para não sumir tudo se nada tiver gasto)
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    const rawSortedInvoices = [...invoices].sort((a, b) => {
        if (a.reference_year !== b.reference_year) return a.reference_year - b.reference_year
        return a.reference_month - b.reference_month
    })

    const filteredInvoices = rawSortedInvoices.filter(inv => {
        const isCurrent = inv.reference_month === currentMonth && inv.reference_year === currentYear
        return inv.total_amount > 0 || isCurrent
    })

    // Fallback de segurança: Se o filtro remover tudo (ex: mês atual não gerado ainda e histórico zerado), 
    // usa a lista completa ordenada para não quebrar a tela.
    const sortedInvoices = filteredInvoices.length > 0 ? filteredInvoices : rawSortedInvoices

    // Selecionar fatura inicial - priorizar fatura do mês atual
    const getCurrentMonthInvoice = () => {
        // Tentar encontrar fatura do mês atual na lista filtrada
        const currentMonthInvoice = sortedInvoices.find(i =>
            i.reference_month === currentMonth &&
            i.reference_year === currentYear
        )

        // Se achou do mês atual, retorna ela
        if (currentMonthInvoice) return currentMonthInvoice

        // Se não houver do mês atual, pegar a primeira em aberto (mais antiga devendo)
        const openInvoice = sortedInvoices.find(i => i.status === 'open' || i.status === 'partial')
        if (openInvoice) return openInvoice

        // Fallback: última da lista (mais futura) ou primeira? 
        return sortedInvoices[sortedInvoices.length - 1]
    }

    const initialInvoice = getCurrentMonthInvoice()
    // Safety check: Fallback para string vazia se undefined
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(initialInvoice?.id || '')

    // Safety check: Garantir que selectedInvoice nunca seja undefined se houver faturas
    const selectedInvoice = sortedInvoices.find(i => i.id === selectedInvoiceId) || sortedInvoices[sortedInvoices.length - 1]

    // Se ainda assim não tiver invoice (lista vazia), retorna null ou early return manipulado no useEffect
    if (!selectedInvoice && invoices.length > 0) {
        // Isso não deve acontecer devido ao fallback acima, mas por garantia
        return null
    }

    // Bloqueio por status
    const isInvoiceStatusLocked = selectedInvoice?.status === 'paid'
    const isLocked = isPlanLocked || isInvoiceStatusLocked

    // Ref para o container do carrossel
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    // Atualizar seleção quando invoices mudar
    useEffect(() => {
        if (invoices.length > 0 && !selectedInvoiceId) {
            const currentInvoice = getCurrentMonthInvoice()
            if (currentInvoice) setSelectedInvoiceId(currentInvoice.id)
        }
    }, [invoices])

    // Efeito para centralizar a fatura selecionada no carrossel
    useEffect(() => {
        if (scrollContainerRef.current && selectedInvoiceId) {
            const buttonFn = (id: string) => document.getElementById(`invoice-btn-${id}`)
            const selectedBtn = buttonFn(selectedInvoiceId)

            if (selectedBtn) {
                const container = scrollContainerRef.current
                const containerWidth = container.offsetWidth
                const btnLeft = selectedBtn.offsetLeft
                const btnWidth = selectedBtn.offsetWidth

                // Calcular posição para centralizar
                const scrollTo = btnLeft - (containerWidth / 2) + (btnWidth / 2)

                container.scrollTo({
                    left: scrollTo,
                    behavior: 'smooth'
                })
            }
        }
    }, [selectedInvoiceId])

    // Filtro de Visualização: Mês atual +/- range
    // O usuário pediu "mes atual + 4 anteriores + 4 posterior"
    // Mas também quer scroll. O scroll com snap já atende bem se estiver ordenado.
    // Vamos ater ao comportamento de scroll mas com a ordem correta.

    // Dados da fatura selecionada
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [payments, setPayments] = useState<any[]>([])
    const [rolloverAmountState, setRolloverAmountState] = useState(0) // Estado para o Rollover vindo do backend
    const [loadingDetails, setLoadingDetails] = useState(false)
    const [showPayDialog, setShowPayDialog] = useState(false)
    const [revertInvoiceId, setRevertInvoiceId] = useState<string | null>(null)
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
    const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null)

    // Carregar detalhes ao mudar seleção
    useEffect(() => {
        if (!selectedInvoiceId) return

        async function load() {
            setLoadingDetails(true)
            try {
                const data = await getInvoiceDetails(selectedInvoiceId)
                setTransactions(data.transactions)
                setPayments(data.payments || [])
                setRolloverAmountState(data.rollover_amount || 0)
            } catch (e) {
                console.error("Erro ao carregar transações", e)
            } finally {
                setLoadingDetails(false)
            }
        }
        load()
    }, [selectedInvoiceId])

    // Lógica de Composição do Pagamento
    const paymentTotal = payments.reduce((sum, p) => sum + Number(p.amount), 0)

    // Usar valor calculado pelo backend
    const rolloverAmount = rolloverAmountState

    const fundsAvailable = paymentTotal + rolloverAmount
    const usedOnCurrent = Math.min(fundsAvailable, selectedInvoice.total_amount)
    const surplusNext = Math.max(0, fundsAvailable - selectedInvoice.total_amount)

    // Regra de exibição: Somente se quitada E (tem diferença de valor OU tem rollover)
    const showComposition = (selectedInvoice.status === 'paid') &&
        ((Math.abs(paymentTotal - selectedInvoice.total_amount) > 0.01) || (rolloverAmount > 0.01))

    // Estado para controlar transações marcadas como conferidas
    const [checkedTransactions, setCheckedTransactions] = useState<Set<string>>(new Set())

    const toggleCheck = (transactionId: string) => {
        setCheckedTransactions(prev => {
            const newSet = new Set(prev)
            if (newSet.has(transactionId)) {
                newSet.delete(transactionId)
            } else {
                newSet.add(transactionId)
            }
            return newSet
        })
    }

    // Se não tiver faturas, mostrar estado vazio
    if (invoices.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-xl opacity-60">
                <ShoppingBag className="w-12 h-12 mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium">Nenhuma fatura encontrada</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Crie sua primeira despesa para gerar uma fatura automaticamente.
                </p>
            </div>
        )
    }

    const handlePay = () => { setShowPayDialog(true) }

    const handleEdit = (transaction: Transaction, e: React.MouseEvent) => {
        e.stopPropagation()
        if (isLocked) return
        setEditingTransaction(transaction)
    }

    const handleDeleteClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
        if (isLocked) return
        setTransactionToDelete(id)
    }

    const handleConfirmDelete = async () => {
        if (!transactionToDelete) return
        try {
            await deleteTransaction(transactionToDelete)
            const data = await getInvoiceDetails(selectedInvoiceId)
            setTransactions(data.transactions)
            setTransactionToDelete(null)
        } catch (e: any) { alert("Erro ao excluir: " + e.message) }
    }

    const handleUpdateSuccess = async () => {
        setEditingTransaction(null)
        const data = await getInvoiceDetails(selectedInvoiceId)
        setTransactions(data.transactions)
    }

    return (
        <div className="space-y-6">
            {/* Carrossel movido para cima e filtrado */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* Coluna Esquerda: Carrossel + Info da Fatura */}
                <div className="md:col-span-1 space-y-4">
                    {/* Carrossel Compacto */}
                    <div
                        ref={scrollContainerRef}
                        className="flex overflow-x-auto pb-2 gap-2 px-1 py-1 mt-2 hide-scrollbar snap-x snap-mandatory scroll-smooth -mx-1"
                    >
                        {sortedInvoices.map((inv) => {
                            const isSelected = inv.id === selectedInvoiceId
                            const monthName = MONTH_NAMES[inv.reference_month - 1]
                            const statusColor = getStatusColor(inv.status)

                            return (
                                <button
                                    key={inv.id}
                                    id={`invoice-btn-${inv.id}`}
                                    onClick={() => setSelectedInvoiceId(inv.id)}
                                    className={cn(
                                        "flex flex-col items-center justify-center min-w-[25%] md:min-w-[80px] h-[70px] rounded-xl border transition-all snap-center",
                                        isSelected
                                            ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 shadow-md ring-2 ring-offset-1 ring-slate-900 dark:ring-white z-10"
                                            : "bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-60 hover:opacity-100 scale-95"
                                    )}
                                >
                                    <span className="text-[10px] uppercase font-bold tracking-wider mb-0.5 leading-none">
                                        {monthName}
                                    </span>
                                    <span className="text-[9px] opacity-70 mb-1 leading-none">{inv.reference_year}</span>
                                    <div className={cn("w-1 h-1 rounded-full", statusColor)}></div>
                                </button>
                            )
                        })}
                    </div>

                    <Card
                        className="overflow-hidden border-0 shadow-lg relative transition-all"
                        style={{
                            backgroundColor: cardColor,
                            background: `linear-gradient(135deg, ${cardColor} 0%, ${adjustBrightness(cardColor, -30)} 100%)`,
                            color: getTextColor(cardColor)
                        }}
                    >
                        {/* Texture Overlay (Ondas sutis) - Aplicado ao card todo */}
                        <div className="absolute inset-0 opacity-10 pointer-events-none"
                            style={{
                                backgroundImage: 'radial-gradient(circle at 100% 100%, rgba(255,255,255,0.2) 0%, transparent 50%), radial-gradient(circle at 0% 0%, rgba(255,255,255,0.2) 0%, transparent 50%)',
                                backgroundSize: '100% 100%'
                            }}></div>

                        {/* Logo Watermark Grande */}
                        {/* Logo Watermark Grande (Sutil 10%) - Cor adaptativa */}
                        {/* Brand Watermark / Background Icon */}
                        <div
                            className="absolute -right-16 bottom-48 transform rotate-[195deg] pointer-events-none"
                            style={{
                                color: isLightColor(cardColor) ? 'black' : 'white',
                                opacity: 0.1
                            }}
                        >
                            <CreditCard className="w-72 h-72" />
                        </div>

                        {/* HEADER + RESUMO PRINCIPAL */}
                        <div className="p-6 pb-8 relative z-10">
                            {/* Linha 1: Título e Status */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2 opacity-90">
                                    <span className="text-xs font-bold uppercase tracking-widest opacity-70">Fatura {MONTH_NAMES[selectedInvoice.reference_month - 1]}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full shadow-sm border border-white/10 mb-1">
                                        <Badge variant="outline" className={cn("bg-transparent border-0 px-0 capitalize text-inherit font-bold shadow-none text-xs", getTextColor(cardColor) === '#003087' ? "text-blue-900" : "text-white")}>
                                            {translateStatus(selectedInvoice.status)}
                                        </Badge>
                                    </div>
                                    {selectedInvoice.status === 'partial' && (
                                        <span className="text-[9px] font-medium opacity-80 max-w-[120px] text-right leading-tight block">
                                            Evite juros pagando o restante até o vencimento.
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Linha 2: Valor Total (Hero) & Métricas Agrupadas */}
                            <div className="mb-8">
                                <div className="flex flex-col mb-4">
                                    <span className="text-sm font-medium opacity-80 uppercase tracking-wide mb-1">Valor Total</span>
                                    <span className="text-4xl font-bold tracking-tight drop-shadow-sm leading-none">
                                        {formatCurrency(selectedInvoice.total_amount)}
                                    </span>
                                </div>

                                {/* Bloco Decisório: Pago vs Aberto */}
                                <div className="grid grid-cols-2 gap-4 mt-4 p-3 rounded-lg bg-black/10 backdrop-blur-sm border border-white/10">
                                    <div>
                                        <span className="text-[10px] uppercase font-bold opacity-70 block mb-0.5 tracking-wider">Já pago</span>
                                        <span className="text-lg font-semibold block leading-tight">
                                            {formatCurrency(selectedInvoice.paid_amount)}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] uppercase font-bold opacity-70 block mb-0.5 tracking-wider">Em aberto</span>
                                        <span className="text-lg font-semibold block leading-tight">
                                            {formatCurrency(selectedInvoice.total_amount - selectedInvoice.paid_amount)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Linha 3: Barra de Progresso Reforçada */}
                            <div className="space-y-2">
                                <div className="h-3 w-full bg-black/20 rounded-full overflow-hidden backdrop-blur-md shadow-inner">
                                    <div
                                        className={cn("h-full transition-all duration-500 ease-out shadow-lg relative", getTextColor(cardColor) === '#003087' ? "bg-blue-900" : "bg-white")}
                                        style={{ width: `${(Math.min(selectedInvoice.paid_amount / selectedInvoice.total_amount, 1)) * 100}%` }}
                                    >
                                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                    </div>
                                </div>
                                <div className="flex justify-between text-[10px] font-bold opacity-80 uppercase tracking-wider px-1">
                                    <span>{Math.round((selectedInvoice.paid_amount / selectedInvoice.total_amount) * 100) || 0}% quitado</span>
                                    <span>{100 - (Math.round((selectedInvoice.paid_amount / selectedInvoice.total_amount) * 100) || 0)}% restante</span>
                                </div>

                                {/* Bloco de Composição do Pagamento (Novo) */}
                                {showComposition && (
                                    <div className="mt-6 pt-4 border-t border-white/20">
                                        <h4 className="text-[11px] uppercase font-bold tracking-wider opacity-80 mb-3">
                                            Composição do Pagamento
                                        </h4>
                                        <div className="space-y-2 text-xs font-medium">
                                            {rolloverAmount > 0.01 && (
                                                <div className="flex justify-between">
                                                    <span className="opacity-80">Crédito fatura anterior</span>
                                                    <span>{formatCurrency(rolloverAmount)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between">
                                                <span className="opacity-80">Valor da fatura atual</span>
                                                <span>{formatCurrency(selectedInvoice.total_amount)}</span>
                                            </div>
                                            {surplusNext > 0.01 && (
                                                <div className={cn(
                                                    "flex justify-between font-bold",
                                                    getTextColor(cardColor) === '#003087'
                                                        ? "text-blue-900 opacity-100" // Fundo claro (amarelo) -> Texto escuro
                                                        : "text-amber-300 dark:text-amber-400" // Fundo escuro -> Texto claro
                                                )}>
                                                    <span className="opacity-90">Crédito para próxima fatura</span>
                                                    <span>{formatCurrency(surplusNext)}</span>
                                                </div>
                                            )}

                                            <div className="h-px bg-white/20 my-2"></div>

                                            <div className="flex justify-between text-sm font-bold">
                                                <span>Total pago</span>
                                                <span>{formatCurrency(paymentTotal)}</span>
                                            </div>
                                        </div>
                                        {surplusNext > 0 && (
                                            <p className="text-[9px] opacity-70 mt-2 leading-tight">
                                                O valor excedente foi convertido em crédito para a próxima fatura,
                                                liberando limite imediatamente.
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Microcopy Educativa (Fallback) */}
                                {(!showComposition && selectedInvoice.status !== 'paid' && selectedInvoice.status !== 'closed') && (
                                    <p className="text-[10px] text-center opacity-70 mt-3 font-medium">
                                        💡 O pagamento integral garante isenção de juros e saúde financeira.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* DATAS (Peso visual reduzido - Rodapé do visual) */}
                        <div className="px-6 py-3 bg-black/5 backdrop-blur-sm border-t border-black/5 flex items-center justify-between text-xs font-medium relative z-10">
                            <div className="flex flex-col">
                                <span className="opacity-60 uppercase tracking-wider text-[10px]">Fechamento</span>
                                <span className="opacity-90">{new Date(selectedInvoice.closing_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                            </div>
                            <div className="w-px h-6 bg-current opacity-10"></div>
                            <div className="flex flex-col text-right">
                                <span className="opacity-60 uppercase tracking-wider text-[10px]">Vencimento</span>
                                <span className="opacity-90">{new Date(selectedInvoice.due_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                            </div>
                        </div>

                        {/* BOTÕES DE AÇÃO (No corpo do card, abaixo do visual colorido) */}
                        <div className="bg-white dark:bg-slate-950 p-6 space-y-4">
                            {/* Ação Primária */}
                            {selectedInvoice.status !== 'paid' && selectedInvoice.total_amount > 0 && selectedInvoice.paid_amount < selectedInvoice.total_amount && (
                                <Button
                                    className="w-full h-12 text-base font-semibold shadow-md active:scale-[0.99] transition-all"
                                    style={{
                                        backgroundColor: cardColor,
                                        color: getTextColor(cardColor)
                                    }}
                                    onClick={handlePay}
                                >
                                    <CheckCircle2 className="w-5 h-5 mr-2" />
                                    Pagar Fatura
                                </Button>
                            )}

                            {/* Ação Secundária/Terciária */}
                            {selectedInvoice.paid_amount > 0 && (
                                <Button
                                    variant="ghost"
                                    className="w-full text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs h-auto py-3"
                                    onClick={() => setRevertInvoiceId(selectedInvoice.id)}
                                >
                                    <RotateCcw className="w-3.5 h-3.5 mr-2" />
                                    Estornar pagamento de {formatCurrency(selectedInvoice.paid_amount)}
                                </Button>
                            )}

                            {/* Info educacional (Melhor dia de compra) */}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center pt-2 opacity-70">
                                <ShoppingBag className="w-3 h-3" />
                                <span>Melhor dia de compra: <strong>{new Date(selectedInvoice.closing_date).getUTCDate() + 1}</strong> (após fechamento)</span>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="md:col-span-2 space-y-4">

                    <Card className="h-full border-slate-200 dark:border-slate-800 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Histórico de Compras</span>
                                {checkedTransactions.size > 0 && (
                                    <span className="text-xs text-muted-foreground font-normal">
                                        {checkedTransactions.size} de {transactions.length} conferida(s)
                                    </span>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loadingDetails ? (
                                <div className="p-8 text-center text-muted-foreground">Carregando transações...</div>
                            ) : transactions.length === 0 ? (
                                <div className="p-12 text-center text-muted-foreground opacity-60">
                                    Nenhuma compra nesta fatura.
                                </div>
                            ) : (
                                <>
                                    {/* DESKTOP TABLE */}
                                    <div className="hidden md:block">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="hover:bg-transparent">
                                                    <TableHead>Data</TableHead>
                                                    <TableHead>Descrição</TableHead>
                                                    <TableHead className="text-right">Valor</TableHead>
                                                    <TableHead className="w-[100px]"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {transactions.map((t) => (
                                                    <TableRow key={t.id} className="group">
                                                        <TableCell className="py-2 text-muted-foreground text-xs whitespace-nowrap">
                                                            {new Date(t.transaction_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })}
                                                        </TableCell>
                                                        <TableCell className="py-2">
                                                            <div className="flex flex-col">
                                                                <span className={cn("font-medium text-xs text-slate-700 dark:text-slate-200", checkedTransactions.has(t.id) && "line-through opacity-60")}>{t.description}</span>
                                                                {t.is_installment && (
                                                                    <div className="flex items-center gap-1 mt-0.5">
                                                                        <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 rounded-full border border-blue-100 dark:border-blue-900/50">
                                                                            {t.installment_number}/{t.total_installments}
                                                                        </span>
                                                                        <span className="text-[9px] text-muted-foreground">Parcelado</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className={cn("text-right font-medium text-xs py-2", checkedTransactions.has(t.id) && "line-through opacity-60")}>
                                                            {formatCurrency(t.amount)}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    type="button"
                                                                    className="h-8 w-8 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                                                                    onClick={(e) => handleEdit(t, e)}
                                                                    disabled={isLocked}
                                                                >
                                                                    <Edit2 className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    type="button"
                                                                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                                                    onClick={(e) => handleDeleteClick(t.id, e)}
                                                                    disabled={isLocked}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* MOBILE LIST */}
                                    <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                                        {transactions.map((t) => (
                                            <div key={t.id} className="p-3 flex items-center gap-3 active:bg-slate-50 dark:active:bg-slate-900 transition-colors">
                                                <div className="flex-1 flex items-center justify-between" onClick={(e) => handleEdit(t, e)}>
                                                    <div className="flex flex-col gap-1">
                                                        <span className={cn("font-medium text-sm text-slate-900 dark:text-slate-100", checkedTransactions.has(t.id) && "line-through opacity-60")}>{t.description}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-slate-500">
                                                                {new Date(t.transaction_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })}
                                                            </span>
                                                            {t.is_installment && (
                                                                <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded-full border border-blue-100 dark:border-blue-900/50">
                                                                    {t.installment_number}/{t.total_installments}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className={cn("font-bold text-sm text-slate-900 dark:text-slate-100", checkedTransactions.has(t.id) && "line-through opacity-60")}>
                                                            {formatCurrency(t.amount)}
                                                        </span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            type="button"
                                                            className="h-8 w-8 -mr-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                                                            onClick={(e) => handleDeleteClick(t.id, e)}
                                                            disabled={isLocked}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {
                editingTransaction && (
                    <EditTransactionDialog
                        transaction={editingTransaction}
                        open={!!editingTransaction}
                        onOpenChange={(open) => !open && setEditingTransaction(null)}
                        onSuccess={handleUpdateSuccess}
                    />
                )
            }

            <AlertDialog open={!!transactionToDelete} onOpenChange={(open) => !open && setTransactionToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Transação?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Isso removerá a transação da fatura e recalculará o valor total. Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setTransactionToDelete(null)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
                            Confirmar Exclusão
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!revertInvoiceId} onOpenChange={(open) => !open && setRevertInvoiceId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Estornar Pagamento da Fatura?</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div>
                                Você está prestes a reverter o status de pagamento desta fatura.
                                <br /><br />
                                <strong className="text-amber-600">Atenção:</strong> Isso <strong>NÃO</strong> exclui automaticamente a transação de saída do caixa (se houver).
                                <br />
                                Você deve excluir manualmente a despesa no fluxo de caixa para corrigir o saldo.
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setRevertInvoiceId(null)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={async () => {
                                if (revertInvoiceId) {
                                    await revertInvoicePayment(revertInvoiceId)
                                    setRevertInvoiceId(null)
                                }
                            }}
                            className="bg-amber-600 hover:bg-amber-700"
                        >
                            Confirmar Estorno
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {
                showPayDialog && (
                    <PayCardInvoiceDialog
                        open={showPayDialog}
                        onOpenChange={setShowPayDialog}
                        invoice={selectedInvoice}
                        cardName={cardName}
                        sourceAccounts={accounts}
                        paymentMethods={paymentMethods}
                    />
                )
            }
        </div >
    )
}

function getStatusColor(status: string) {
    switch (status) {
        case 'paid': return 'bg-green-500'
        case 'closed': return 'bg-amber-500'
        case 'overdue': return 'bg-red-500'
        case 'open': return 'bg-blue-500'
        default: return 'bg-slate-300'
    }
}

function getStatusBadgeColor(status: string) {
    switch (status) {
        case 'paid': return 'text-green-600 border-green-200 bg-green-50 dark:bg-green-900/20'
        case 'closed': return 'text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-900/20'
        case 'overdue': return 'text-red-600 border-red-200 bg-red-50 dark:bg-red-900/20'
        case 'open': return 'text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-900/20'
        default: return ''
    }
}

function translateStatus(status: string) {
    const map: Record<string, string> = {
        'open': 'Fatura em aberto',
        'closed': 'Fechada',
        'paid': 'Fatura Paga',
        'overdue': 'Vencida',
        'partial': 'Pago Parcialmente'
    }
    return map[status] || status
}
