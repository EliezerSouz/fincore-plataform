"use client"

import { useState } from "react"
import { BaseModal } from "@/components/ui/base-modal"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreditCard, Check } from "lucide-react"
import { CreditCard as CreditCardType, updateCreditCard } from "./actions"
import { usePermission } from "@/hooks/use-permission"
import { UpsellModal } from "@/components/ui/upsell-modal"
import { COLOR_PRESETS } from "@/constants/ui-presets"

const BRAND_OPTIONS = [
    { value: 'master', label: 'Mastercard' },
    { value: 'visa', label: 'Visa' },
    { value: 'elo', label: 'Elo' },
    { value: 'amex', label: 'American Express' },
    { value: 'hipercard', label: 'Hipercard' },
    { value: 'other', label: 'Outro' },
]

interface EditCardDialogProps {
    card: CreditCardType
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditCardDialog({ card, open, onOpenChange }: EditCardDialogProps) {
    const [loading, setLoading] = useState(false)
    const [selectedColor, setSelectedColor] = useState(card.color)
    const { can } = usePermission()

    if (!can('edit_card')) {
        return (
            <UpsellModal
                open={open}
                onOpenChange={onOpenChange}
                title="Edição Bloqueada"
                description="No plano Gratuito, não é possível alterar limites ou datas de vencimento dos cartões. Garanta controle total com o Premium."
            />
        )
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)

        try {
            const formData = new FormData(event.currentTarget)

            // Validar dias
            const closing = parseInt(formData.get('closing_day') as string)
            const due = parseInt(formData.get('due_day') as string)

            if (closing < 1 || closing > 31 || due < 1 || due > 31) {
                toast.error('Dias devem ser entre 1 e 31')
                setLoading(false)
                return
            }

            // Validar limite
            const limitStr = formData.get('limit_amount') as string
            if (!limitStr || limitStr.trim() === '') {
                toast.error('Informe o limite do cartão')
                setLoading(false)
                return
            }

            // Adicionar ID do cartão
            formData.append('id', card.id)

            await updateCreditCard(formData)

            // Sucesso - fechar dialog
            onOpenChange(false)
            toast.success("Cartão atualizado com sucesso!")

        } catch (e: any) {
            console.error('Erro ao editar cartão:', e)
            toast.error(e.message || 'Erro ao editar cartão. Verifique os dados e tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            title={
                <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                    <span>Editar Cartão</span>
                </div>
            }
            description="Atualize os dados e limites do seu cartão."
            className="max-w-[500px]"
            primaryButton={{
                label: "Salvar Alterações",
                isLoading: loading,
                form: "edit-card-form",
                type: "submit",
                className: "bg-purple-600 hover:bg-purple-700 shadow-purple-500/20"
            }}
            secondaryButton={{
                label: "Cancelar",
                onClick: () => onOpenChange(false)
            }}
        >
            <form id="edit-card-form" onSubmit={handleSubmit} className="grid gap-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-name" className="text-xs font-semibold uppercase text-slate-500">Apelido do Cartão</Label>
                        <Input id="edit-name" name="name" defaultValue={card.name} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-brand" className="text-xs font-semibold uppercase text-slate-500">Bandeira</Label>
                        <Select name="brand" required defaultValue={card.brand}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                                {BRAND_OPTIONS.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-last_4_digits" className="text-xs font-semibold uppercase text-slate-500">Últimos 4 Dígitos</Label>
                        <Input
                            id="edit-last_4_digits"
                            name="last_4_digits"
                            defaultValue={card.last_4_digits}
                            required
                            maxLength={4}
                            className="font-mono text-center h-11"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-closing_day" className="text-xs font-semibold uppercase text-slate-500">Dia Fechamento</Label>
                        <Input
                            id="edit-closing_day"
                            name="closing_day"
                            type="number"
                            min={1}
                            max={31}
                            placeholder="Ex: 5"
                            required
                            defaultValue={card.closing_day}
                            className="h-11"
                        />
                        <p className="text-[10px] text-slate-400">Melhor dia compra</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-due_day" className="text-xs font-semibold uppercase text-slate-500">Dia Vencimento</Label>
                        <Input
                            id="edit-due_day"
                            name="due_day"
                            type="number"
                            min={1}
                            max={31}
                            placeholder="Ex: 12"
                            required
                            defaultValue={card.due_day}
                            className="h-11"
                        />
                        <p className="text-[10px] text-slate-400">Dia de pagamento</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-slate-500">Cor do Cartão</Label>
                    <input type="hidden" name="color" value={selectedColor} />
                    <div className="flex gap-3 flex-wrap bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                        {COLOR_PRESETS.map(color => (
                            <button
                                    key={color.hex}
                                    type="button"
                                    className={`w-11 h-11 rounded-full transition-all flex items-center justify-center shadow-sm hover:scale-110 ${selectedColor === color.hex ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-slate-600 scale-110' : ''}`}
                                    style={{ backgroundColor: color.hex }}
                                    onClick={() => setSelectedColor(color.hex)}
                                    title={color.name}
                                >
                                {selectedColor === color.hex && <Check className="w-4 h-4 text-white drop-shadow-md" />}
                            </button>
                        ))}
                    </div>
                </div>
            </form>
        </BaseModal>
    )
}
