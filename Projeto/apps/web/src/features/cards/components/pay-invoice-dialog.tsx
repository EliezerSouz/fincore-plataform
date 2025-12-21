"use client"

import { useState } from "react"
import { toast } from "sonner"
import { payInvoice } from "@/app/(protected)/compromissos/cards/actions"
import { UnifiedPaymentDialog, PaymentData } from "@/components/finance/unified-payment-dialog"
import { CreditCard } from "lucide-react"
import { getOrCreateInvoiceCategory } from "@/app/(protected)/caixa/categories/actions"

interface PayCardInvoiceDialogProps {
    children?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
    invoice: any
    cardName?: string
    sourceAccounts: any[]
    paymentMethods: any[]
    remainingAmount?: number
}

export function PayCardInvoiceDialog({ 
    children, 
    open: controlledOpen, 
    onOpenChange: controlledOnOpenChange, 
    invoice, 
    cardName = "Cartão", 
    sourceAccounts, 
    paymentMethods,
    remainingAmount: propRemainingAmount 
}: PayCardInvoiceDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    
    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : internalOpen
    const onOpenChange = isControlled ? controlledOnOpenChange : setInternalOpen

    const totalAmount = invoice.total_amount || 0
    const paidAmount = invoice.paid_amount || 0
    
    // Use prop if provided, otherwise calculate
    const effectiveRemaining = propRemainingAmount !== undefined 
        ? propRemainingAmount 
        : (totalAmount - paidAmount)

    const handleConfirm = async (data: PaymentData) => {
        if (!onOpenChange) return

        try {
            // Get default invoice category
            let categoryId = undefined
            try {
                categoryId = await getOrCreateInvoiceCategory()
            } catch (err) {
                console.warn("Could not fetch default invoice category", err)
            }

            await payInvoice(invoice.id, data.amount, data.accountId, data.date, categoryId)
            toast.success("Pagamento realizado com sucesso!")
            onOpenChange(false)
        } catch (error) {
            console.error(error)
            toast.error("Erro ao processar pagamento")
        }
    }

    const descriptionText = paidAmount > 0
        ? `Total: R$ ${totalAmount.toFixed(2)} | Pago: R$ ${paidAmount.toFixed(2)} | Restante: R$ ${effectiveRemaining.toFixed(2)}`
        : "Realize o pagamento da fatura. Valores excedentes entrarão como crédito na próxima fatura."

    return (
        <>
            {children && (
                <div onClick={() => onOpenChange && onOpenChange(true)} className="inline-block w-full cursor-pointer">
                    {children}
                </div>
            )}
            
            <UnifiedPaymentDialog
                open={!!open}
                onOpenChange={onOpenChange || (() => {})}
                title={`Pagar Fatura - ${cardName}`}
                description={descriptionText}
                defaultAmount={effectiveRemaining}
                maxAmount={effectiveRemaining * 10} 
                surplusThreshold={effectiveRemaining}
                sourceAccounts={sourceAccounts}
                paymentMethods={paymentMethods}
                onConfirm={handleConfirm}
                icon={CreditCard}
            />
        </>
    )
}
