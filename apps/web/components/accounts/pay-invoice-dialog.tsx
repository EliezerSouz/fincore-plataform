"use client"

import { createTransaction } from "@/app/(protected)/caixa/transactions/actions"
import { UnifiedPaymentDialog, PaymentData } from "@/components/finance/unified-payment-dialog"
import { CreditCard } from "lucide-react"

interface PayInvoiceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    targetAccount: any
    sourceAccounts: any[]
    paymentMethods: any[]
}

export function PayInvoiceDialog({ open, onOpenChange, targetAccount, sourceAccounts, paymentMethods }: PayInvoiceDialogProps) {
    async function handleConfirm(data: PaymentData) {
        const description = `Pagamento Fatura - ${targetAccount.name}`

        // 1. Expense from Source Account
        const formDataOut = new FormData()
        formDataOut.append('description', description)
        formDataOut.append('amount', data.amount.toString())
        formDataOut.append('type', 'despesa') // Money leaving source
        formDataOut.append('date', data.date)
        formDataOut.append('accountId', data.accountId)
        formDataOut.append('paymentMethodId', data.paymentMethodId)

        await createTransaction(formDataOut)

        // 2. Income to Credit Card Account (Paying off debt)
        // Note: We don't link paymentMethod here usually, as it's an internal transfer-like operation from the perspective of clearing debt. 
        // But strictly it IS a payment. 
        // However, clearing the credit card balance is "Receita" into the CC account.
        const formDataIn = new FormData()
        formDataIn.append('description', description)
        formDataIn.append('amount', data.amount.toString())
        formDataIn.append('type', 'receita') // Money entering card (clearing debt)
        formDataIn.append('date', data.date)
        formDataIn.append('accountId', targetAccount.id)
        // We probably don't need paymentMethodId on the receiving end (the CC account), or maybe we do?
        // Usually, the "payment" is the expense. The "receipt" on the CC is just balance adjustment.
        // Let's leave paymentMethodId out for the receiver to avoid confusion, or set it if needed.
        // Given current DB schema, transactions table has payment_method_id.

        await createTransaction(formDataIn)
    }

    // Default amount: absolute value of negative balance, or 0
    const defaultAmount = targetAccount.balance < 0 ? Math.abs(targetAccount.balance) : 0

    return (
        <UnifiedPaymentDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Pagar Fatura do Cartão"
            description="Realize o pagamento da fatura debitando de outra conta."
            defaultAmount={defaultAmount}
            sourceAccounts={sourceAccounts}
            paymentMethods={paymentMethods}
            onConfirm={handleConfirm}
            icon={CreditCard}
        />
    )
}
