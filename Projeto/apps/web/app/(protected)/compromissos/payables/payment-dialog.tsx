"use client"

import { markAsPaid, Payable } from "./actions"
import { useRouter } from "next/navigation"
import { UnifiedPaymentDialog, PaymentData } from "@/components/finance/unified-payment-dialog"
import { CalendarIcon } from "lucide-react"

interface PaymentDialogProps {
    payable: Payable
    open: boolean
    onOpenChange: (open: boolean) => void
    sourceAccounts: any[]
    paymentMethods: any[]
}

export function PaymentDialog({ payable, open, onOpenChange, sourceAccounts, paymentMethods }: PaymentDialogProps) {
    const router = useRouter()

    async function handleConfirm(data: PaymentData) {
        await markAsPaid(
            payable.id,
            data.accountId,
            data.date,
            data.amount,
            data.paymentMethodId
        )
        router.refresh()
    }

    return (
        <UnifiedPaymentDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Confirmar Pagamento"
            description="Informe os dados do pagamento realizado."
            defaultAmount={payable.amount}
            defaultDate={new Date().toISOString().split('T')[0]} // Or use today
            sourceAccounts={sourceAccounts}
            paymentMethods={paymentMethods}
            onConfirm={handleConfirm}
            icon={CalendarIcon}
        />
    )
}
