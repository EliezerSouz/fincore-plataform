"use client"

import { useState } from "react"
import { Payable, deletePayable, markAsPaid, revertPayment } from "./actions"
import { formatCurrency } from "@/lib/utils"
import * as Icons from "lucide-react"
import {
    CalendarIcon,
    CheckCircle2,
    MoreHorizontal,
    Trash2,
    AlertCircle,
    ArrowRight,
    SearchX,
    Pencil,
    Undo2
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { DataTableWrapper } from "@/components/ui/data-table-wrapper"
import { StatusBadge } from "@/components/ui/status-badge"
import { EditPayableDialog } from "./edit-payable-dialog"
import { PayableCardMobile } from "./payable-card-mobile"

interface PayableListProps {
    payables: Payable[]
    accounts?: any[]
    paymentMethods?: any[]
}

export function PayableList({ payables, accounts = [], paymentMethods = [] }: PayableListProps) {
    return (
        <DataTableWrapper
            isEmpty={payables.length === 0}
            isLoading={false}
            emptyMessage="Tudo em dia! Não há contas pendentes para este período."
            className="mt-6"
        >
            {/* MOBILE VIEW cards */}
            <div className="md:hidden space-y-4 p-4">
                {payables.map((payable) => (
                    <PayableCardMobile
                        key={payable.id}
                        payable={payable}
                        accounts={accounts}
                        paymentMethods={paymentMethods}
                    />
                ))}
            </div>

            {/* DESKTOP VIEW table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-500 font-medium">
                        <tr>
                            <th className="px-6 py-4 w-[35%]">Descrição</th>
                            <th className="px-6 py-4 w-[20%]">Categoria</th>
                            <th className="px-6 py-4 w-[20%]">Vencimento</th>
                            <th className="px-6 py-4 w-[10%]">Recorrência</th>
                            <th className="px-6 py-4 text-right w-[15%]">Valor</th>
                            <th className="px-6 py-4 w-[10%] text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {payables.map((payable) => (
                            <PayableRow
                                key={payable.id}
                                payable={payable}
                                accounts={accounts}
                                paymentMethods={paymentMethods}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </DataTableWrapper>
    )
}

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
import { PaymentDialog } from "./payment-dialog"
import { TableCell, TableRow } from "@/components/ui/table"

function PayableRow({ payable, accounts, paymentMethods }: { payable: Payable, accounts: any[], paymentMethods: any[] }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [editOpen, setEditOpen] = useState(false)
    const [paymentOpen, setPaymentOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [revertDialogOpen, setRevertDialogOpen] = useState(false)

    // Detecção de status
    const isPaid = payable.status === 'paid'
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // ... datas ...
    const dueDate = new Date(payable.due_date)
    dueDate.setMinutes(dueDate.getMinutes() + dueDate.getTimezoneOffset())

    const isOverdue = !isPaid && dueDate < today
    const isToday = !isPaid && dueDate.getTime() === today.getTime()

    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    // ... icon logic ...
    const IconComponent = (payable.category?.icon && (Icons as any)[payable.category.icon])
        ? (Icons as any)[payable.category.icon]
        : Icons.FileText;
    const categoryColor = payable.category?.color || "#64748b";

    function handleRevertClick() {
        setRevertDialogOpen(true)
    }

    async function handleConfirmRevert() {
        setLoading(true)
        try {
            await revertPayment(payable.id)
            router.refresh()
            toast.success("Pagamento estornado com sucesso!")
        } catch (e: any) {
            console.error(e)
            toast.error(e.message || "Erro ao estornar")
        } finally {
            setLoading(false)
            setRevertDialogOpen(false)
        }
    }

    // ... delete logic ...
    async function handleConfirmDelete() {
        setLoading(true)
        try {
            await deletePayable(payable.id)
            router.refresh()
            toast.success("Conta excluída com sucesso!")
        } catch (e) {
            console.error(e)
            toast.error("Erro ao excluir conta.")
        } finally {
            setLoading(false)
            setDeleteDialogOpen(false)
        }
    }

    const rowClass = isPaid
        ? "bg-emerald-50/40 hover:bg-emerald-50/60 dark:bg-emerald-900/5 opacity-75"
        : isOverdue
            ? "bg-red-50/30 hover:bg-red-50/50 dark:bg-red-900/10"
            : "hover:bg-slate-50/50 dark:hover:bg-slate-900/50";

    return (
        <>
            <TableRow className={`group transition-colors ${rowClass}`}>
                {/* DESCRIÇÃO */}
                <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-4">
                        <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-sm md:hidden"
                            style={{
                                backgroundColor: isPaid ? '#dcfce7' : isOverdue ? '#fee2e2' : `${categoryColor}20`,
                                color: isPaid ? '#16a34a' : isOverdue ? '#dc2626' : categoryColor
                            }}
                        >
                            {isPaid ? <CheckCircle2 className="w-5 h-5" /> : <IconComponent className="w-5 h-5" />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className={cn("font-semibold", isPaid ? "text-emerald-700 dark:text-emerald-400 line-through decoration-emerald-500/30" : "text-slate-900 dark:text-slate-100")}>
                                    {payable.description}
                                </span>
                                {isOverdue && <StatusBadge variant="destructive">Atrasado</StatusBadge>}
                                {isPaid && <StatusBadge variant="success">Pago</StatusBadge>}
                            </div>
                            {/* Categoria Mobile */}
                            <div className="md:hidden flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                <span className="font-medium">{payable.category?.name || "Geral"}</span>
                            </div>
                        </div>
                    </div>
                </TableCell>

                {/* CATEGORIA (Desktop) */}
                <TableCell className="px-6 py-4 hidden md:table-cell">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
                            style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
                        >
                            <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {payable.category?.name || "Geral"}
                            </span>
                            {payable.subcategory && (
                                <span className="text-xs text-slate-400">
                                    {payable.subcategory.name}
                                </span>
                            )}
                        </div>
                    </div>
                </TableCell>

                <TableCell className="px-6 py-4">
                    {/* Vencimento */}
                    <div className="flex flex-col">
                        <span className={cn(
                            "font-medium flex items-center gap-1.5",
                            isPaid ? "text-emerald-600/70" : isOverdue ? "text-red-600" : isToday ? "text-amber-600" : "text-slate-700 dark:text-slate-300"
                        )}>
                            <CalendarIcon className="w-3.5 h-3.5" />
                            {dueDate.toLocaleDateString("pt-BR", { timeZone: 'UTC' })}
                        </span>
                        {!isPaid && (
                            <span className="text-xs text-slate-500 font-medium pl-5">
                                {isOverdue ? `${Math.abs(diffDays)} dias atrás` : isToday ? "Vence hoje" : `Faltam ${diffDays} dias`}
                            </span>
                        )}
                        {isPaid && payable.paid_at && (
                            <span className="text-xs text-emerald-700 font-bold pl-5 mt-0.5 block">
                                Pago em: {new Date(payable.paid_at).toLocaleDateString('pt-BR')}
                            </span>
                        )}
                    </div>
                </TableCell>

                {/* Recorrencia ... same ... */}
                <TableCell className="px-6 py-4 hidden sm:table-cell">
                    {payable.recurrence_strategy !== 'single' ? (
                        <Badge variant="secondary" className="font-normal text-xs bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            {payable.recurrence_strategy === 'fixed' ? 'Fixo Mensal' : `${payable.installment_number}/${payable.total_installments}`}
                        </Badge>
                    ) : (
                        <span className="text-slate-400 text-xs">—</span>
                    )}
                </TableCell>

                {/* Valor */}
                <TableCell className="px-6 py-4 text-right">
                    <span className={cn(
                        "font-bold text-base",
                        isPaid ? "text-emerald-600/70" : isOverdue ? "text-red-600" : "text-slate-900 dark:text-slate-100"
                    )}>
                        {formatCurrency(payable.amount)}
                    </span>
                </TableCell>

                {/* AÇÕES */}
                <TableCell className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                        {!isPaid && (
                            <Button
                                className="bg-green-600 hover:bg-green-700 text-white shadow-sm h-11 px-4"
                                onClick={() => setPaymentOpen(true)}
                                disabled={loading}
                            >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Pagar
                            </Button>
                        )}

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="text-slate-400 hover:text-slate-600 h-11 w-11 p-0 flex items-center justify-center" disabled={loading}>
                                    <MoreHorizontal className="w-5 h-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                <DropdownMenuSeparator />

                                {!isPaid && (
                                    <>
                                        <DropdownMenuItem onClick={() => setEditOpen(true)} className="cursor-pointer">
                                            <Pencil className="w-4 h-4 mr-2 text-blue-500" />
                                            Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                    </>
                                )}

                                {isPaid && (
                                    <>
                                        <DropdownMenuItem onClick={handleRevertClick} className="cursor-pointer text-amber-600 focus:text-amber-700 focus:bg-amber-50">
                                            <Undo2 className="w-4 h-4 mr-2" />
                                            Estornar Pagamento
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                    </>
                                )}

                                {!isPaid && (
                                    <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)} className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50">
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Excluir
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </TableCell>
            </TableRow>
            <EditPayableDialog payable={payable} open={editOpen} onOpenChange={setEditOpen} />
            <PaymentDialog
                payable={payable}
                open={paymentOpen}
                onOpenChange={setPaymentOpen}
                sourceAccounts={accounts}
                paymentMethods={paymentMethods}
            />

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Conta a Pagar</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir esta conta ({payable.description})? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={(e) => { e.preventDefault(); handleConfirmDelete() }} disabled={loading} className="bg-red-600 hover:bg-red-700">
                            {loading ? "Excluindo..." : "Excluir"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={revertDialogOpen} onOpenChange={setRevertDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Estorno</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div>
                                Você está prestes a estornar o pagamento de <strong>{payable.description}</strong>.
                                <br /><br />
                                Isso irá:
                                <ul className="list-disc pl-4 mt-2 mb-2">
                                    <li>Remover a transação do lance financeiro/extrato.</li>
                                    <li>Marcar esta conta como <strong>Pendente</strong> novamente.</li>
                                </ul>
                                Deseja continuar?
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={(e) => { e.preventDefault(); handleConfirmRevert() }} disabled={loading} className="bg-amber-600 hover:bg-amber-700">
                            {loading ? "Estornando..." : "Confirmar Estorno"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
