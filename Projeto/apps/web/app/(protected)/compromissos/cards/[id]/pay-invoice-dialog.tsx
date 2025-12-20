"use client"

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
        await payInvoice(invoice.id, data.amount, data.accountId, data.date)

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
