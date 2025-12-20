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
import { Calendar, DollarSign, FileText, Tag, RotateCcw, AlertCircle } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { revertPayment } from "@/app/(protected)/compromissos/payables/actions"
import { useRouter } from "next/navigation"

interface PayableDetailsModalProps {
    payableId: string | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function PayableDetailsModal({ payableId, open, onOpenChange }: PayableDetailsModalProps) {
    const router = useRouter()
    const [payable, setPayable] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [isRevertDialogOpen, setIsRevertDialogOpen] = useState(false)

    useEffect(() => {
        if (open && payableId) {
            loadPayableDetails()
        }
    }, [open, payableId])

    async function loadPayableDetails() {
        if (!payableId) return

        setLoading(true)
        try {
            const { createClient } = await import("@/utils/supabase/client")
            const supabase = createClient()

            const { data, error } = await supabase
                .from('payables')
                .select(`
                    *,
                    category:categories(name, color, icon),
                    subcategory:subcategories(name)
                `)
                .eq('id', payableId)
                .single()

            if (error) throw error
            setPayable(data)
        } catch (error) {
            console.error("Error loading payable:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleRevert = () => {
        if (!payableId) return

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

    if (!payable && !loading) return null

    const dueDate = payable?.due_date ? new Date(payable.due_date) : null
    const paidAt = payable?.paid_at ? new Date(payable.paid_at) : null
    const isPaid = payable?.status === 'paid'

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return <Badge className="bg-emerald-500">Paga</Badge>
            case 'pending':
                return <Badge variant="secondary">Pendente</Badge>
            case 'cancelled':
                return <Badge variant="destructive">Cancelada</Badge>
            default:
                return <Badge variant="secondary">{status}</Badge>
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-amber-600" />
                        Detalhes da Conta a Pagar
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="py-8 text-center text-slate-500">
                        Carregando detalhes...
                    </div>
                ) : payable ? (
                    <div className="space-y-4">
                        {/* Descrição e Status */}
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-4 rounded-lg border border-amber-100 dark:border-amber-900/30">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white">
                                        {payable.description}
                                    </h3>
                                    {payable.category && (
                                        <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1 mt-1">
                                            <Tag className="w-3 h-3" />
                                            {payable.category.name}
                                            {payable.subcategory && ` • ${payable.subcategory.name}`}
                                        </p>
                                    )}
                                </div>
                                {getStatusBadge(payable.status)}
                            </div>
                        </div>

                        {/* Valor */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                                <DollarSign className="w-3.5 h-3.5" />
                                Valor
                            </div>
                            <p className="font-bold text-2xl text-slate-900 dark:text-white">
                                {formatCurrency(payable.amount || 0)}
                            </p>
                            {payable.installment_number && payable.total_installments && (
                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                    Parcela {payable.installment_number} de {payable.total_installments}
                                </p>
                            )}
                        </div>

                        {/* Datas */}
                        <div className="space-y-2 text-sm border-t border-b border-slate-200 dark:border-slate-800 py-3">
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                    <Calendar className="w-4 h-4" />
                                    Vencimento
                                </span>
                                <span className="font-medium text-slate-900 dark:text-white">
                                    {dueDate?.toLocaleDateString('pt-BR')}
                                </span>
                            </div>
                            {isPaid && paidAt && (
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                        <Calendar className="w-4 h-4" />
                                        Pago em
                                    </span>
                                    <span className="font-medium text-emerald-700 dark:text-emerald-400">
                                        {paidAt.toLocaleDateString('pt-BR')}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Recorrência */}
                        {payable.recurrence_strategy && payable.recurrence_strategy !== 'single' && (
                            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-900/30">
                                <p className="text-sm text-blue-700 dark:text-blue-400 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    {payable.recurrence_strategy === 'fixed' ? 'Conta Fixa (Recorrente)' : 'Parcelamento'}
                                </p>
                            </div>
                        )}
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
                        <AlertDialogTitle>Estornar Pagamento da Conta?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Este estorno irá desfazer o pagamento e reabrir a conta a pagar.
                            <br /><br />
                            <strong>Atenção:</strong> Esta ação não pode ser desfeita e a conta voltará ao status "Pendente".
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
