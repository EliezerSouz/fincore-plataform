'use client'

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { DeleteDialog } from "@/components/ui/delete-dialog"
import { MoreHorizontal, Pencil, Trash2, Copy, Eye, RotateCcw, ArrowRightLeft } from "lucide-react"
import { deleteTransaction, duplicateTransaction } from "@/app/(protected)/caixa/transactions/actions"
import { revertInvoicePayment } from "@/app/(protected)/compromissos/cards/actions"
import { useTransition, useState } from "react"
import { EditTransactionDialog } from "./edit-transaction-dialog"
import { useRouter } from "next/navigation"
import { InvoiceDetailsModal } from "@/features/cards/components/invoice-details-modal"
import { PayableDetailsModal } from "@/features/payables/components/payable-details-modal"
import { toast } from "sonner"

interface TransactionActionsProps {
    transaction: any
}

export function TransactionActions({ transaction }: TransactionActionsProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [isRevertOpen, setIsRevertOpen] = useState(false)
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)
    const [isPayableModalOpen, setIsPayableModalOpen] = useState(false)

    // Verificar se é pagamento de fatura de cartão
    const invoiceId = transaction.invoice_id || transaction.credit_card_invoice_id
    const isInvoicePayment = invoiceId != null
    const categoryName = transaction.category?.name?.toLowerCase() || ''
    const isInvoicePaymentByCategory = categoryName.includes('pagamento') && categoryName.includes('fatura')
    const showInvoiceActions = isInvoicePayment || isInvoicePaymentByCategory

    // Verificar se é pagamento de conta a pagar (payable)
    const isPayablePayment = transaction.payable_id != null
    const isPayablePaymentByCategory = categoryName.includes('pagamento') && categoryName.includes('conta')
    const showPayableActions = isPayablePayment || isPayablePaymentByCategory

    // Verificar se é transferência
    // Checa pelo related_id ou pelo nome da categoria se o ID não vier populado ainda
    const isTransfer = !!transaction.related_transaction_id || transaction.category?.name === 'Transferência'
    const transferLabel = transaction.type === 'despesa' ? 'Estornar Transferência' : 'Devolver Transferência'

    // Se for pagamento de fatura, conta a pagar ou transferência, restringe ações
    // Se for apenas detecção por nome de categoria mas sem ID vinculado, permite ações padrão (para corrigir zumbis)
    const isRestrictedTransaction = (showInvoiceActions && invoiceId) || (showPayableActions && transaction.payable_id) || isTransfer

    const handleDelete = () => {
        startTransition(async () => {
            try {
                console.log("Deleting transaction:", transaction.id)
                await deleteTransaction(transaction.id)
                setIsDeleteOpen(false)
                router.refresh()
            } catch (error: any) {
                console.error("Delete error:", error)
                toast.error(`Erro ao excluir: ${error.message || error}`)
            }
        })
    }

    const handleDuplicate = () => {
        startTransition(async () => {
            try {
                await duplicateTransaction(transaction.id)
                router.refresh()
                toast.success("Transação duplicada")
            } catch (error) {
                console.error(error)
                toast.error("Erro ao duplicar")
            }
        })
    }

    const handleViewInvoice = () => {
        setIsInvoiceModalOpen(true)
    }

    const handleViewPayable = () => {
        setIsPayableModalOpen(true)
    }

    const handleRevertPayment = () => {
        startTransition(async () => {
            try {
                if (invoiceId) {
                    await revertInvoicePayment(invoiceId)
                    setIsRevertOpen(false)
                    toast.success("Pagamento estornado com sucesso!")
                    router.refresh()
                } else if (transaction.payable_id) {
                    // Importar revertPayment de payables
                    const { revertPayment } = await import("@/app/(protected)/compromissos/payables/actions")
                    await revertPayment(transaction.payable_id)
                    setIsRevertOpen(false)
                    toast.success("Pagamento estornado com sucesso!")
                    router.refresh()
                }
            } catch (error: any) {
                console.error("Revert error:", error)
                toast.error(`Erro ao estornar: ${error.message || error}`)
            }
        })
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-5 w-5 md:h-4 md:w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>

                    {/* Ações de Transferência */}
                    {isTransfer && (
                        <>
                            <DropdownMenuItem onClick={() => setIsEditOpen(true)} className="cursor-pointer">
                                <Pencil className="mr-2 h-4 w-4 text-blue-500" />
                                Editar Transferência
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => setIsDeleteOpen(true)}
                                className="cursor-pointer text-amber-600 focus:text-amber-700 focus:bg-amber-50"
                            >
                                <ArrowRightLeft className="mr-2 h-4 w-4" />
                                {transferLabel}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                        </>
                    )}

                    {/* Ações específicas para Pagamento de Fatura */}
                    {showInvoiceActions && invoiceId && (
                        <>
                            <DropdownMenuItem onClick={handleViewInvoice} className="cursor-pointer">
                                <Eye className="mr-2 h-4 w-4 text-blue-500" />
                                Ver Fatura
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setIsRevertOpen(true)}
                                className="cursor-pointer text-amber-600 focus:text-amber-700 focus:bg-amber-50"
                            >
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Estornar Pagamento
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                        </>
                    )}

                    {/* Ações específicas para Pagamento de Conta a Pagar */}
                    {showPayableActions && transaction.payable_id && (
                        <>
                            <DropdownMenuItem onClick={handleViewPayable} className="cursor-pointer">
                                <Eye className="mr-2 h-4 w-4 text-blue-500" />
                                Ver Conta
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setIsRevertOpen(true)}
                                className="cursor-pointer text-amber-600 focus:text-amber-700 focus:bg-amber-50"
                            >
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Estornar Pagamento
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                        </>
                    )}

                    {/* Ações padrão - apenas para transações normais */}
                    {!isRestrictedTransaction && (
                        <>
                            <DropdownMenuItem onClick={handleDuplicate} disabled={isPending} className="cursor-pointer">
                                <Copy className="mr-2 h-4 w-4 text-amber-500" />
                                Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setIsEditOpen(true)} className="cursor-pointer">
                                <Pencil className="mr-2 h-4 w-4 text-blue-500" />
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => setIsDeleteOpen(true)}
                                className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Edit Dialog */}
            <EditTransactionDialog
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                transaction={transaction}
            />

            {/* Delete Dialog Padronizado */}
            <DeleteDialog
                open={isDeleteOpen}
                onOpenChange={setIsDeleteOpen}
                onConfirm={handleDelete}
                title={isTransfer ? (transaction.type === 'despesa' ? "Estornar Transferência" : "Devolver Transferência") : "Excluir Transação"}
                description={
                    isTransfer
                        ? "Confirma o estorno desta transferência? A transação vinculada na outra conta também será removida automaticamente."
                        : `Tem certeza que deseja excluir esta transação${transaction.description ? ` "${transaction.description}"` : ''}? Esta ação não pode ser desfeita.`
                }
                isDeleting={isPending}
            />

            {/* Revert Payment Alert Dialog */}
            <AlertDialog open={isRevertOpen} onOpenChange={setIsRevertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Estornar Pagamento?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Este estorno irá desfazer o pagamento.
                            <br /><br />
                            <strong>Atenção:</strong> Esta ação não pode ser desfeita e o compromisso voltará a ficar pendente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault()
                                handleRevertPayment()
                            }}
                            disabled={isPending}
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                        >
                            {isPending ? 'Estornando...' : 'Sim, estornar'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Invoice Details Modal */}
            <InvoiceDetailsModal
                invoiceId={invoiceId}
                open={isInvoiceModalOpen}
                onOpenChange={setIsInvoiceModalOpen}
            />

            {/* Payable Details Modal */}
            <PayableDetailsModal
                payableId={transaction.payable_id}
                open={isPayableModalOpen}
                onOpenChange={setIsPayableModalOpen}
            />
        </>
    )
}
