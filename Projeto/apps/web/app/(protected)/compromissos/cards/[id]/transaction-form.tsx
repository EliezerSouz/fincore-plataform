"use client"

import { usePermission } from "@/hooks/use-permission"
import { usePrimaryCard } from "@/hooks/use-primary-card"
import { CreateTransactionDialog } from "@/features/transactions/components/create-transaction-dialog"

export function TransactionForm({ cardId, cardName }: { cardId: string, cardName: string }) {
    const { can } = usePermission()
    const { primaryCardId } = usePrimaryCard()

    const isLocked = !can('unlimited_cards') && cardId !== primaryCardId
    if (isLocked) return null

    return (
        <CreateTransactionDialog
            buttonLabel="Nova Despesa"
            title={`Nova Despesa - ${cardName}`}
            showTypeSelector={false}
            initialData={{
                type: 'compra',
                selectedCardId: cardId
            }}
        />
    )
}
