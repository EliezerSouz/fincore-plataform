
import { useState } from "react"
import { Payable, deletePayable, revertPayment } from "./actions"
import { formatCurrency } from "@/lib/utils"
import * as Icons from "lucide-react"
import {
    CalendarIcon,
    CheckCircle2,
    MoreHorizontal,
    Trash2,
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
import { StatusBadge } from "@/components/ui/status-badge"
import { EditPayableDialog } from "./edit-payable-dialog"
import { PaymentDialog } from "./payment-dialog"
import { Card, CardContent } from "@/components/ui/card"
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

export function PayableCardMobile({ payable, accounts, paymentMethods }: { payable: Payable, accounts: any[], paymentMethods: any[] }) {
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
    const dueDate = new Date(payable.due_date)
    dueDate.setMinutes(dueDate.getMinutes() + dueDate.getTimezoneOffset())
    const isOverdue = !isPaid && dueDate < today
    const isToday = !isPaid && dueDate.getTime() === today.getTime()
    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    const IconComponent = (payable.category?.icon && (Icons as any)[payable.category.icon])
        ? (Icons as any)[payable.category.icon]
        : Icons.FileText;
    const categoryColor = payable.category?.color || "#64748b";

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

    async function handleConfirmRevert() {
        setLoading(true)
        try {
            await revertPayment(payable.id)
            router.refresh()
            toast.success("Pagamento estornado com sucesso!")
        } catch (e: any) {
            toast.error(e.message || "Erro ao estornar")
        } finally {
            setLoading(false)
            setRevertDialogOpen(false)
        }
    }

    return (
        <>
            <Card className="overflow-hidden border-slate-200 dark:border-slate-800">
                <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
                                style={{
                                    backgroundColor: isPaid ? '#dcfce7' : isOverdue ? '#fee2e2' : `${categoryColor}20`,
                                    color: isPaid ? '#16a34a' : isOverdue ? '#dc2626' : categoryColor
                                }}
                            >
                                {isPaid ? <CheckCircle2 className="w-5 h-5" /> : <IconComponent className="w-5 h-5" />}
                            </div>
                            <div>
                                <h3 className={cn("font-semibold text-sm sm:text-base line-clamp-1 min-w-0", isPaid && "line-through opacity-70")}>
                                    {payable.description}
                                </h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] sm:text-xs text-slate-500 truncate max-w-[100px]">{payable.category?.name || "Geral"}</span>
                                    {isOverdue && <StatusBadge variant="destructive" className="h-3.5 sm:h-4 px-1 text-[8px] sm:text-[9px]">Atrasado</StatusBadge>}
                                </div>
                            </div>
                        </div>
                        <span className={cn(
                            "font-bold text-sm sm:text-base whitespace-nowrap shrink-0",
                            isPaid ? "text-emerald-600/70" : isOverdue ? "text-red-600" : "text-slate-900 dark:text-slate-100"
                        )}>
                            {formatCurrency(payable.amount)}
                        </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-[10px] sm:text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-3">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 font-medium">
                                <CalendarIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                {dueDate.toLocaleDateString("pt-BR", { timeZone: 'UTC' })}
                            </div>
                            {!isPaid && (
                                <span className={cn(isOverdue ? "text-red-500" : isToday ? "text-amber-600" : "text-slate-400")}>
                                    {isOverdue ? `${Math.abs(diffDays)} dias atrás` : isToday ? "Vence hoje" : `Em ${diffDays} dias`}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {!isPaid && (
                                <Button
                                    className="bg-green-600 hover:bg-green-700 text-white shadow-sm h-9 sm:h-11 px-3 sm:px-4 text-[10px] sm:text-xs font-semibold"
                                    onClick={() => setPaymentOpen(true)}
                                >
                                    Pagar
                                </Button>
                            )}

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-9 w-9 sm:h-11 sm:w-11 -mr-2 text-slate-500">
                                        <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {!isPaid && (
                                        <>
                                            <DropdownMenuItem onClick={() => setEditOpen(true)}>
                                                <Pencil className="w-4 h-4 mr-2" /> Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                        </>
                                    )}
                                    {isPaid && (
                                        <>
                                            <DropdownMenuItem onClick={() => setRevertDialogOpen(true)}>
                                                <Undo2 className="w-4 h-4 mr-2" /> Estornar
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                        </>
                                    )}
                                    {!isPaid && (
                                        <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)} className="text-red-600">
                                            <Trash2 className="w-4 h-4 mr-2" /> Excluir
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </CardContent>
            </Card>

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
                        <AlertDialogTitle>Excluir Conta?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Deseja excluir <b>{payable.description}</b>?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={(e) => { e.preventDefault(); handleConfirmDelete() }} className="bg-red-600">
                            {loading ? "..." : "Excluir"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={revertDialogOpen} onOpenChange={setRevertDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Estornar Pagamento?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação reverterá o status para pendente e removerá o lançamento do caixa.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={(e) => { e.preventDefault(); handleConfirmRevert() }} className="bg-amber-600">
                            {loading ? "..." : "Confirmar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
