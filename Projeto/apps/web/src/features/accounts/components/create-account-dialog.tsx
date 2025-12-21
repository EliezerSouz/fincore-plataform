"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createAccount } from "@/app/(protected)/caixa/accounts/actions"
import { CreateButton } from "@/components/ui/create-button"
import { BaseModal } from "@/components/ui/base-modal"
import { Plus, Check, Landmark, CreditCard } from "lucide-react"
import { useRouter } from "next/navigation"
import { COLOR_PRESETS } from "@/constants/ui-presets"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"

export function CreateAccountDialog() {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [selectedType, setSelectedType] = useState("corrente")
    const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0].hex)
    const [hasCreditCard, setHasCreditCard] = useState(false)
    const isSubmittingRef = useRef(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (isSubmittingRef.current) return

        isSubmittingRef.current = true
        setLoading(true)
        const formData = new FormData(e.currentTarget)

        try {
            await createAccount(formData)
            toast.success("Conta criada com sucesso!")
            setOpen(false)
            setHasCreditCard(false)

            // Force page reload to update the list
            setTimeout(() => {
                window.location.reload()
            }, 500)
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "Erro ao criar conta")
            setLoading(false)
            isSubmittingRef.current = false
        }
    }

    return (
        <>
            <CreateButton label="Nova Conta" onClick={() => setOpen(true)} />

            <BaseModal
                open={open}
                onOpenChange={setOpen}
                title={
                    <div className="flex items-center gap-2">
                        <Landmark className="w-5 h-5 text-blue-600" />
                        <span>Adicionar Nova Conta</span>
                    </div>
                }
                primaryButton={{
                    label: "Criar Conta",
                    isLoading: loading,
                    form: "create-account-form",
                    type: "submit"
                }}
                secondaryButton={{
                    label: "Cancelar"
                }}
            >
                <form id="create-account-form" onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="account-name">Nome da Conta</Label>
                        <Input id="account-name" name="name" placeholder="Ex: Nubank, Carteira..." required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="account-balance">Saldo Atual</Label>
                        <Input id="account-balance" name="balance" placeholder="0,00" required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="account-type">Tipo de Conta</Label>
                        <Select name="type" defaultValue="corrente" onValueChange={setSelectedType} value={selectedType}>
                            <SelectTrigger id="account-type"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="corrente">Conta Corrente</SelectItem>
                                <SelectItem value="digital">Conta Digital</SelectItem>
                                <SelectItem value="poupanca">Poupança</SelectItem>
                                <SelectItem value="reserva_emergencia">Reserva de Emergência</SelectItem>
                                <SelectItem value="investimento">Investimento</SelectItem>
                                <SelectItem value="carteira">Carteira</SelectItem>
                                <SelectItem value="vale_alimentacao">Vale Alimentação / Refeição</SelectItem>
                                <SelectItem value="internacional">Conta Internacional</SelectItem>
                                <SelectItem value="outros">Outros</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedType === 'investimento' && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/20">
                            <Label className="text-blue-700 dark:text-blue-400">Rendimento Mensal (%)</Label>
                            <div className="flex gap-2 items-center">
                                <Input name="yield_rate" placeholder="0,85" className="bg-white dark:bg-slate-950" />
                                <span className="text-sm text-slate-500 font-medium">% a.m.</span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1">
                                O sistema calculará o rendimento diário automaticamente sobre o saldo.
                            </p>
                        </div>
                    )}

                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-slate-500" />
                                <Label htmlFor="has-credit-card" className="cursor-pointer">Conta possui Cartão de Crédito?</Label>
                            </div>
                            <Switch
                                id="has-credit-card"
                                name="has_credit_card"
                                checked={hasCreditCard}
                                onCheckedChange={setHasCreditCard}
                            />
                        </div>

                        {hasCreditCard && (
                            <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="card-limit">Limite do Cartão</Label>
                                        <Input id="card-limit" name="card_limit" placeholder="R$ 0,00" required={hasCreditCard} className="bg-white dark:bg-slate-950" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="card-brand">Bandeira</Label>
                                        <Select name="card_brand" defaultValue="master">
                                            <SelectTrigger id="card-brand" className="bg-white dark:bg-slate-950"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="master">Mastercard</SelectItem>
                                                <SelectItem value="visa">Visa</SelectItem>
                                                <SelectItem value="elo">Elo</SelectItem>
                                                <SelectItem value="amex">American Express</SelectItem>
                                                <SelectItem value="hipercard">Hipercard</SelectItem>
                                                <SelectItem value="other">Outra</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="card-closing">Dia Fechamento</Label>
                                        <Select name="card_closing_day" defaultValue="1">
                                            <SelectTrigger id="card-closing" className="bg-white dark:bg-slate-950"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                                    <SelectItem key={day} value={day.toString()}>{day}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="card-due">Dia Vencimento</Label>
                                        <Select name="card_due_day" defaultValue="10">
                                            <SelectTrigger id="card-due" className="bg-white dark:bg-slate-950"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                                    <SelectItem key={day} value={day.toString()}>{day}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-3">
                        <Label>Cor de Identificação</Label>
                        <input type="hidden" name="color" value={selectedColor} />
                        <div className="flex gap-3 flex-wrap bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                            {COLOR_PRESETS.map((c) => (
                                <button
                                    key={c.hex}
                                    type="button"
                                    className={`w-11 h-11 rounded-full transition-all flex items-center justify-center shadow-sm hover:scale-110 ${selectedColor === c.hex ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-slate-600 scale-110' : ''}`}
                                    style={{ backgroundColor: c.hex }}
                                    onClick={() => setSelectedColor(c.hex)}
                                    title={c.name}
                                >
                                    {selectedColor === c.hex && <Check className="w-4 h-4 text-white drop-shadow-md" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </form>
            </BaseModal>
        </>
    )
}
