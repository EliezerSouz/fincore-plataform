import { FinancialTransactionFormData } from "../components/financial-transaction-form";

/**
 * Converts form data to FormData object for API submission
 * Handles logic for different transaction types (income, expense, transfer, card purchase)
 */
export function toTransactionFormData(data: FinancialTransactionFormData, existingId?: string): FormData {
    const formData = new FormData()

    // Common fields
    formData.append('description', data.description || (data.type === 'transferencia' ? 'Transferência' : ''))
    formData.append('amount', data.amount.toString())
    formData.append('type', data.type)
    formData.append('date', data.date)
    // Fallback for endpoints expecting transaction_date (e.g. credit card invoices)
    formData.append('transaction_date', data.date)

    if (existingId) {
        formData.append('id', existingId)
    }

    if (data.notes) {
        formData.append('notes', data.notes)
    }

    if (data.type === 'transferencia') {
        if (data.pocketId) formData.append('sourcePocketId', data.pocketId)
        if (data.targetPocketId) formData.append('targetPocketId', data.targetPocketId)

        // Legacy/Fallback
        if (data.accountId) formData.append('sourceAccountId', data.accountId)
        if (data.targetAccountId) {
            formData.append('targetAccountId', data.targetAccountId)
        }
        // Transfer methods (optional)
        if (data.paymentMethodId) {
            formData.append('paymentMethodId', data.paymentMethodId)
        }
    } else if (data.type === 'compra') {
        // Credit Card Transaction
        if (data.selectedCardId) {
            formData.append('card_id', data.selectedCardId)
        }

        if (data.installments) {
            formData.append('installments', data.installments)
        }

        if (data.categoryId) formData.append('category_id', data.categoryId)
        if (data.subcategoryId) formData.append('subcategory_id', data.subcategoryId)

        // Retroactive fields
        if (data.isRetroactive) {
            formData.append('is_retroactive', 'true')
            if (data.startInstallment) formData.append('startingInstallment', data.startInstallment.toString())
            if (data.endInstallment) formData.append('end_installment', data.endInstallment.toString())

            // Calculate installment value
            const start = Number(data.startInstallment)
            const end = Number(data.endInstallment)
            if (!isNaN(start) && !isNaN(end) && end >= start) {
                const count = end - start + 1
                formData.append('installmentValue', String(data.amount / count))
            }
        }
    } else {
        // Standard transaction (Income/Expense)
        if (data.pocketId) formData.append('pocketId', data.pocketId)
        if (data.accountId) formData.append('accountId', data.accountId)

        if (data.categoryId) formData.append('category_id', data.categoryId)
        if (data.subcategoryId) formData.append('subcategory_id', data.subcategoryId)

        if (data.paymentMethodId) {
            formData.append('paymentMethodId', data.paymentMethodId)
        }

        if (data.selectedCardId) {
            // Some standard transactions might be related to a card (e.g. paying a bill?) 
            // but usually 'compra' handles the credit card logic.
            // Keeping this for compatibility if needed, but 'compra' block handles the main card logic.
            formData.append('cardId', data.selectedCardId)
        }

        if (data.installments) {
            formData.append('installments', data.installments)
        }
    }

    return formData
}
