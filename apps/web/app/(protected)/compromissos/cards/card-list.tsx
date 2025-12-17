"use client"

import { CreditCardIcon, Plus } from "lucide-react"
import { CreditCard } from "./actions"
import { Button } from "@/components/ui/button"
import { CreateCardDialog } from "./create-card-dialog"
import { CreditCardItem } from "./credit-card-item"
import { usePermission } from "@/hooks/use-permission"
import { usePrimaryCard } from "@/hooks/use-primary-card"

export function CreditCardList({ cards }: { cards: CreditCard[] }) {
    const { can } = usePermission()
    const { primaryCardId } = usePrimaryCard()

    if (cards.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <CreditCardIcon className="w-12 h-12 mb-4 opacity-50" />
                <p>Nenhum cartão cadastrado.</p>
                <p className="text-sm mb-4">Adicione seu primeiro cartão para gerenciar faturas.</p>
                <CreateCardDialog
                    trigger={
                        <Button variant="outline" className="gap-2">
                            <Plus className="w-4 h-4" /> Criar Primeiro Cartão
                        </Button>
                    }
                />
            </div>
        )
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {cards.map((card) => {
                // Apenas o cartão selecionado como Principal é ativo no plano Free
                const isLocked = !can('unlimited_cards') && card.id !== primaryCardId

                return <CreditCardItem key={card.id} card={card} isLocked={isLocked} />
            })}
        </div>
    )
}
