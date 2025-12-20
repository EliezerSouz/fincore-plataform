"use client"

import { useEffect, useState } from "react"
import { usePermission } from "@/hooks/use-permission"
import { usePrimaryCard } from "@/hooks/use-primary-card"
import { CreditCard } from "./actions"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle2, Lock } from "lucide-react"

export function PrimaryCardManager({ cards }: { cards: CreditCard[] }) {
    const { can, isLoading } = usePermission()
    const { primaryCardId, setPrimary, isLocked, isLoaded } = usePrimaryCard()
    const [open, setOpen] = useState(false)
    const [selected, setSelected] = useState("")

    useEffect(() => {
        if (isLoading || !isLoaded) return

        // Regra: Free User + Mais de 1 cartão + Nenhum Primary Definido + Não está locked
        const isFree = !can('unlimited_cards')
        if (isFree && cards.length > 1 && !isLocked) {
            // Verificar se o primary atual é válido (está na lista)
            const isValid = primaryCardId && cards.some(c => c.id === primaryCardId)

            if (!isValid) {
                setOpen(true)
            } else {
                setOpen(false)
            }
        } else {
            // Se virou Premium ou deletou cartões, fecha o modal
            setOpen(false)
        }
    }, [isLoading, isLoaded, can, cards, primaryCardId, isLocked])

    const handleConfirm = () => {
        if (selected) {
            // Bloqueia permanentemente após a primeira escolha
            setPrimary(selected, true)
            setOpen(false)
        }
    }

    return (
        <Dialog open={open}>
            <DialogContent className="sm:max-w-md" onPointerDownOutside={e => e.preventDefault()} onEscapeKeyDown={e => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-amber-600">
                        <AlertCircle className="h-5 w-5" />
                        Seleção de Cartão Ativo (Única Vez)
                    </DialogTitle>
                    <DialogDescription className="space-y-2 pt-2 text-slate-700 dark:text-slate-300">
                        <div className="text-sm space-y-3">
                            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <Lock className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                    <div className="text-xs text-amber-800 dark:text-amber-200">
                                        <strong>Atenção:</strong> Esta escolha é <strong>permanente</strong>. Você só pode fazer esta seleção uma única vez no plano Gratuito.
                                    </div>
                                </div>
                            </div>
                            <p>
                                Seu plano permite apenas <strong>1 cartão ativo</strong> para novos lançamentos.
                            </p>
                            <p>
                                Selecione qual cartão você deseja manter habilitado.
                                Os demais ficarão disponíveis apenas para visualização e pagamento de faturas.
                            </p>
                        </div>
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 max-h-[60vh] overflow-y-auto px-1">
                    <RadioGroup value={selected} onValueChange={setSelected} className="gap-3">
                        {cards.map(card => (
                            <div key={card.id} onClick={() => setSelected(card.id)} className={`
                                flex items-center space-x-3 space-y-0 rounded-md border p-4 cursor-pointer transition-all
                                ${selected === card.id
                                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                    : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900'}
                            `}>
                                <RadioGroupItem value={card.id} id={card.id} />
                                <Label htmlFor={card.id} className="flex-1 cursor-pointer font-medium flex justify-between">
                                    <span>{card.name}</span>
                                    <span className="text-muted-foreground text-xs font-normal">Final {card.last_4_digits}</span>
                                </Label>
                                {selected === card.id && <CheckCircle2 className="h-4 w-4 text-primary" />}
                            </div>
                        ))}
                    </RadioGroup>
                </div>

                <div className="flex justify-end">
                    <Button onClick={handleConfirm} disabled={!selected} className="w-full">
                        Confirmar Cartão Ativo (Permanente)
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
