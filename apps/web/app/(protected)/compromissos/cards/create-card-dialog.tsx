"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, CreditCard, Lock } from "lucide-react"
import { createCreditCard } from "./actions"
import { CreateButton } from "@/components/ui/create-button"
import { usePermission } from "@/hooks/use-permission"
import { UpsellModal } from "@/components/ui/upsell-modal"

const BRAND_OPTIONS = [
    { value: 'amex', label: 'American Express' },
    { value: 'elo', label: 'Elo' },
    { value: 'hipercard', label: 'Hipercard' },
    { value: 'master', label: 'Mastercard' },
    { value: 'visa', label: 'Visa' },
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

export function CreateCardDialog({ trigger, cardsCount = 0 }: { trigger?: React.ReactNode, cardsCount?: number }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[3].hex)
    const { can } = usePermission()

    // Regra: Pode criar se tiver permissão ilimitada OU se ainda não tiver nenhum cartão
    const canCreate = can('unlimited_cards') || cardsCount < 1

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

            await createCreditCard(formData)

            // Sucesso - fechar dialog e resetar form
            setOpen(false)

            // Reset do form acontece automaticamente quando o dialog fecha
            // mas vamos resetar a cor selecionada manualmente
            setTimeout(() => {
                setSelectedColor(COLOR_PRESETS[3].hex)
            }, 300)

        } catch (e: any) {
            console.error('Erro ao criar cartão:', e)
            alert(e.message || 'Erro ao criar cartão. Verifique os dados e tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    if (!canCreate) {
        return (
            <UpsellModal
                trigger={
                    <div className="relative inline-block">
                        {trigger || <CreateButton label="Novo Cartão" />}
                        <div className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full p-0.5 shadow-sm">
                            <Lock className="w-3 h-3" />
                        </div>
                    </div>
                }
                title="Limite de Cartões"
                description="No plano Gratuito, você pode gerenciar apenas 1 cartão de crédito. Faça upgrade para cadastrar cartões ilimitados e controlar todas as suas faturas."
            />
        )
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <CreateButton label="Novo Cartão" />
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Adicionar Cartão de Crédito</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Apelido do Cartão</Label>
                            <Input id="name" name="name" placeholder="Ex: Nubank Principal" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="brand">Bandeira</Label>
                            <Select name="brand" required defaultValue="master">
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
                            <Label htmlFor="last_4_digits">Últimos 4 Dígitos</Label>
                            <Input id="last_4_digits" name="last_4_digits" placeholder="1234" maxLength={4} pattern="\d{4}" className="font-mono" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="limit_amount">Limite Total (R$)</Label>
                            <Input id="limit_amount" name="limit_amount" placeholder="0,00" required />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="space-y-2">
                            <Label htmlFor="closing_day">Dia Fechamento</Label>
                            <Input id="closing_day" name="closing_day" type="number" min={1} max={31} placeholder="Ex: 5" required />
                            <p className="text-slate-400">Melhor dia compra</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="due_day">Dia Vencimento</Label>
                            <Input id="due_day" name="due_day" type="number" min={1} max={31} placeholder="Ex: 12" required />
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

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={loading} className="w-full" variant="success">
                            {loading ? 'Criando...' : 'Criar Cartão'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
