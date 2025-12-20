"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createAccount } from "@/app/(protected)/caixa/accounts/actions"
import { CreateButton } from "@/components/ui/create-button"
import { BaseModal } from "@/components/ui/base-modal"
import { Plus, Check, Landmark } from "lucide-react"
import { useRouter } from "next/navigation"

const COLORS = [
    { name: 'Azul', value: '#3b82f6' },
    { name: 'Roxo (Nubank)', value: '#8b5cf6' },
    { name: 'Laranja (Inter)', value: '#f97316' },
    { name: 'Vermelho', value: '#ef4444' },
    { name: 'Verde', value: '#10b981' },
    { name: 'Preto (Black)', value: '#0f172a' },
    { name: 'Rosa', value: '#ec4899' },
    { name: 'Ciano', value: '#06b6d4' },
    { name: 'Amarelo', value: '#eab308' },
    { name: 'Cinza', value: '#64748b' },
]

export function CreateAccountDialog() {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [selectedType, setSelectedType] = useState("corrente")
    const [selectedColor, setSelectedColor] = useState(COLORS[0].value)
    const isSubmittingRef = useRef(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (isSubmittingRef.current) return

        isSubmittingRef.current = true
        setLoading(true)
        const formData = new FormData(e.currentTarget)

        try {
            await createAccount(formData)
            setOpen(false)
            router.refresh()
        } catch (error) {
            console.error(error)
        } finally {
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

                    <div className="space-y-3">
                        <Label>Cor de Identificação</Label>
                        <input type="hidden" name="color" value={selectedColor} />
                        <div className="flex gap-3 flex-wrap bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                            {COLORS.map((c) => (
                                <button
                                    key={c.value}
                                    type="button"
                                    className={`w-8 h-8 rounded-full transition-all flex items-center justify-center shadow-sm hover:scale-110 ${selectedColor === c.value ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-slate-600 scale-110' : ''}`}
                                    style={{ backgroundColor: c.value }}
                                    onClick={() => setSelectedColor(c.value)}
                                    title={c.name}
                                >
                                    {selectedColor === c.value && <Check className="w-4 h-4 text-white drop-shadow-md" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </form>
            </BaseModal>
        </>
    )
}
