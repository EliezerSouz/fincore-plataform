"use client"

import { useState } from "react"
import { BaseModal } from "@/components/ui/base-modal"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreditCard, Lock, Check } from "lucide-react"
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
                    <div className="relative inline-block cursor-not-allowed">
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
        <>
            <div onClick={() => setOpen(true)} className="inline-block">
                {trigger || <CreateButton label="Novo Cartão" onClick={() => setOpen(true)} />}
            </div>

            <BaseModal
                open={open}
                onOpenChange={setOpen}
                title={
                    <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-purple-600" />
                        <span>Adicionar Cartão de Crédito</span>
                    </div>
                }
                description="Cadastre seus cartões para controlar faturas e limites."
                className="max-w-[500px]"
                primaryButton={{
                    label: "Criar Cartão",
                    isLoading: loading,
                    form: "create-card-form",
                    type: "submit",
                    className: "bg-purple-600 hover:bg-purple-700 shadow-purple-500/20"
                }}
                secondaryButton={{
                    label: "Cancelar"
                }}
            >
                <form id="create-card-form" onSubmit={handleSubmit} className="grid gap-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-xs font-semibold uppercase text-slate-500">Apelido do Cartão</Label>
                            <Input id="name" name="name" placeholder="Ex: Nubank Principal" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="brand" className="text-xs font-semibold uppercase text-slate-500">Bandeira</Label>
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
                            <Label htmlFor="last_4_digits" className="text-xs font-semibold uppercase text-slate-500">Últimos 4 Dígitos</Label>
                            <Input id="last_4_digits" name="last_4_digits" placeholder="1234" maxLength={4} pattern="\d{4}" className="font-mono" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="limit_amount" className="text-xs font-semibold uppercase text-slate-500">Limite Total (R$)</Label>
                            <Input id="limit_amount" name="limit_amount" placeholder="0,00" required />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="closing_day" className="text-xs font-semibold uppercase text-slate-500">Dia Fechamento</Label>
                            <Input id="closing_day" name="closing_day" type="number" min={1} max={31} placeholder="Ex: 5" required />
                            <p className="text-[10px] text-slate-400">Melhor dia compra</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="due_day" className="text-xs font-semibold uppercase text-slate-500">Dia Vencimento</Label>
                            <Input id="due_day" name="due_day" type="number" min={1} max={31} placeholder="Ex: 12" required />
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
                                    className={`w-8 h-8 rounded-full transition-all flex items-center justify-center shadow-sm hover:scale-110 ${selectedColor === color.hex ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-slate-600 scale-110' : ''}`}
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
        </>
    )
}
