"use client"

import { createTransaction } from "@/app/(protected)/caixa/transactions/actions"
import { payInvoice } from "@/app/(protected)/compromissos/cards/actions"
import { UnifiedPaymentDialog, PaymentData } from "@/components/finance/unified-payment-dialog"
import { CreditCard } from "lucide-react"
import { getOrCreateInvoiceCategory } from "@/app/(protected)/caixa/categories/actions"

interface PayCardInvoiceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    invoice: any
    cardName: string
    sourceAccounts: any[]
    paymentMethods: any[]
}

export function PayCardInvoiceDialog({ open, onOpenChange, invoice, cardName, sourceAccounts, paymentMethods }: PayCardInvoiceDialogProps) {
    const totalAmount = invoice.total_amount
    const paidAmount = invoice.paid_amount
    const remainingAmount = totalAmount - paidAmount

    const handleConfirm = async (data: PaymentData) => {
        // Descrição padronizada: "Pagamento Fatura - [Nome da Instituição]"
        const description = `Pagamento Fatura - ${cardName}`
        const categoryId = await getOrCreateInvoiceCategory()

        // 1. Expense from Source Account (Caixa) - Single Transaction per user request for reconciliation
        const formDataOut = new FormData()
        formDataOut.append('description', description)
        formDataOut.append('amount', data.amount.toString())
        formDataOut.append('type', 'despesa')
        formDataOut.append('date', data.date)
        formDataOut.append('accountId', data.accountId)
        formDataOut.append('paymentMethodId', data.paymentMethodId)
        formDataOut.append('categoryId', categoryId)
        // Vínculo técnico com a fatura atual
        formDataOut.append('credit_card_invoice_id', invoice.id)

        await createTransaction(formDataOut)

        // 2. Mark Invoice as Paid in Cards Module
        // A função SQL pay_invoice vai distribuir o excedente automaticamente nas próximas faturas
        await payInvoice(invoice.id, data.amount)

        alert("Pagamento realizado com sucesso!")
        onOpenChange(false)
    }


    const descriptionText = paidAmount > 0
        ? `Total: R$ ${totalAmount.toFixed(2)} | Pago: R$ ${paidAmount.toFixed(2)} | Restante: R$ ${remainingAmount.toFixed(2)}`
        : "Realize o pagamento da fatura. Valores excedentes entrarão como crédito na próxima fatura."

    return (
        <UnifiedPaymentDialog
            open={open}
            onOpenChange={onOpenChange}
            title={`Pagar Fatura ${cardName}`}
            description={descriptionText}
            defaultAmount={remainingAmount}
            maxAmount={remainingAmount * 10} // Permite excedente (limite arbitrário alto)
            surplusThreshold={remainingAmount}
            sourceAccounts={sourceAccounts}
            paymentMethods={paymentMethods}
            onConfirm={handleConfirm}
            icon={CreditCard}
        />
    )
}
