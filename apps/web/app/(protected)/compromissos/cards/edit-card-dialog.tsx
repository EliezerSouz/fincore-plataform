"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreditCard } from "./actions"
import { updateCreditCard } from "./actions"
import { usePermission } from "@/hooks/use-permission"
import { UpsellModal } from "@/components/ui/upsell-modal"

const BRAND_OPTIONS = [
    { value: 'master', label: 'Mastercard' },
    { value: 'visa', label: 'Visa' },
    { value: 'elo', label: 'Elo' },
    { value: 'amex', label: 'American Express' },
    { value: 'hipercard', label: 'Hipercard' },
    { value: 'other', label: 'Outro' },
]

const COLOR_PRESETS = [
    { name: 'Roxo (Nubank)', hex: '#820ad1' },
    { name: 'Laranja (Inter)', hex: '#ff7a00' },
    { name: 'Vermelho (Bradesco/Santander)', hex: '#cc092f' },
    { name: 'Preto (Black/C6/XP)', hex: '#1a1a1a' },
    { name: 'Azul (Itaú/Caixa)', hex: '#0054a6' },
    { name: 'Amarelo (Banco do Brasil)', hex: '#ffcc00' },
    { name: 'Verde (Stone/Outros)', hex: '#118C4F' },
    { name: 'Rosa', hex: '#ec4899' },
    { name: 'Gold', hex: '#ca8a04' },
]

interface EditCardDialogProps {
    card: CreditCard
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
                alert('Dias devem ser entre 1 e 31')
                setLoading(false)
                return
            }

            // Validar limite
            const limitStr = formData.get('limit_amount') as string
            if (!limitStr || limitStr.trim() === '') {
                alert('Informe o limite do cartão')
                setLoading(false)
                return
            }

            // Adicionar ID do cartão
            formData.append('id', card.id)

            await updateCreditCard(formData)

            // Sucesso - fechar dialog
            onOpenChange(false)

        } catch (e: any) {
            console.error('Erro ao editar cartão:', e)
            alert(e.message || 'Erro ao editar cartão. Verifique os dados e tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Editar Cartão</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Apelido do Cartão</Label>
                            <Input id="edit-name" name="name" defaultValue={card.name} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-brand">Bandeira</Label>
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
                            <Label htmlFor="edit-last_4_digits">Últimos 4 Dígitos</Label>
                            <Input
                                id="edit-last_4_digits"
                                name="last_4_digits"
                                placeholder="1234"
                                maxLength={4}
                                pattern="\d{4}"
                                className="font-mono"
                                defaultValue={card.last_4_digits}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-limit_amount">Limite Total (R$)</Label>
                            <Input
                                id="edit-limit_amount"
                                name="limit_amount"
                                placeholder="0,00"
                                required
                                defaultValue={card.limit_amount.toString()}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="space-y-2">
                            <Label htmlFor="edit-closing_day">Dia Fechamento</Label>
                            <Input
                                id="edit-closing_day"
                                name="closing_day"
                                type="number"
                                min={1}
                                max={31}
                                placeholder="Ex: 5"
                                required
                                defaultValue={card.closing_day}
                            />
                            <p className="text-slate-400">Melhor dia compra</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-due_day">Dia Vencimento</Label>
                            <Input
                                id="edit-due_day"
                                name="due_day"
                                type="number"
                                min={1}
                                max={31}
                                placeholder="Ex: 12"
                                required
                                defaultValue={card.due_day}
                            />
                            <p className="text-slate-400">Dia de pagamento</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Cor do Cartão</Label>
                        <input type="hidden" name="color" value={selectedColor} />
                        <div className="flex gap-2 flex-wrap">
                            {COLOR_PRESETS.map(color => (
                                <button
                                    key={color.hex}
                                    type="button"
                                    className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColor === color.hex ? 'border-blue-600 scale-110' : 'border-transparent hover:scale-110'}`}
                                    style={{ backgroundColor: color.hex }}
                                    onClick={() => setSelectedColor(color.hex)}
                                    title={color.name}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
