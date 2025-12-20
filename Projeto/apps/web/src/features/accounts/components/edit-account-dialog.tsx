"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Lock, LockOpen, Sidebar, Landmark, Plus, Check } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { updateAccount } from "@/app/(protected)/caixa/accounts/actions"
import { BaseModal } from "@/components/ui/base-modal"

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

export function EditAccountDialog({ account, open, onOpenChange }: { account: any, open: boolean, onOpenChange: (open: boolean) => void }) {
    const [loading, setLoading] = useState(false)
    const [balanceLocked, setBalanceLocked] = useState(true)
    const [selectedType, setSelectedType] = useState(account.type || "corrente")
    const [selectedColor, setSelectedColor] = useState(account.color || COLORS[0].value)
    const isSubmittingRef = useRef(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (isSubmittingRef.current) return

        isSubmittingRef.current = true
        setLoading(true)
        const formData = new FormData(e.currentTarget)

        try {
            await updateAccount(account.id, formData)
            onOpenChange(false)
            setTimeout(() => {
                window.location.reload()
            }, 300)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
            isSubmittingRef.current = false
        }
    }

    return (
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            title={
                <div className="flex items-center gap-2">
                    <Landmark className="w-5 h-5 text-blue-600" />
                    <span>Editar Conta</span>
                </div>
            }
            primaryButton={{
                label: "Salvar Alterações",
                isLoading: loading,
                form: "edit-account-form",
                type: "submit"
            }}
            secondaryButton={{
                label: "Cancelar",
                onClick: () => onOpenChange(false)
            }}
        >
            <form id="edit-account-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="edit-name">Nome da Conta</Label>
                    <Input id="edit-name" name="name" defaultValue={account.name} required />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="edit-balance">Saldo Atual</Label>
                        <button
                            type="button"
                            onClick={() => setBalanceLocked(!balanceLocked)}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                        >
                            {balanceLocked ? (
                                <>
                                    <Lock className="w-3 h-3" />
                                    <span>Alterar Saldo</span>
                                </>
                            ) : (
                                <>
                                    <LockOpen className="w-3 h-3" />
                                    <span>Bloquear Edição</span>
                                </>
                            )}
                        </button>
                    </div>
                    <Input
                        id="edit-balance"
                        name="balance"
                        defaultValue={account.balance?.toFixed(2).replace('.', ',')}
                        readOnly={balanceLocked}
                        tabIndex={balanceLocked ? -1 : 0}
                        className={`font-medium transition-colors ${balanceLocked
                            ? 'bg-slate-50 dark:bg-slate-900 text-slate-500 cursor-not-allowed opacity-80'
                            : 'bg-white dark:bg-slate-950 border-blue-500 ring-1 ring-blue-500'
                            }`}
                    />
                    {!balanceLocked && <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1">O saldo foi desbloqueado para edição manual.</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="edit-type">Tipo de Conta</Label>
                    <Select name="type" value={selectedType} onValueChange={setSelectedType}>
                        <SelectTrigger id="edit-type"><SelectValue /></SelectTrigger>
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
                            <Input
                                name="yield_rate"
                                defaultValue={account.yield_rate ? String(account.yield_rate).replace('.', ',') : ''}
                                placeholder="0,85"
                                className="bg-white dark:bg-slate-950"
                            />
                            <span className="text-sm text-slate-500 font-medium">% a.m.</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">
                            O sistema calculará o rendimento diário automaticamente sobre o saldo.
                        </p>
                    </div>
                )}

                <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <Switch id="is_active" name="is_active" defaultChecked={account.is_active !== false} />
                    <div className="flex flex-col">
                        <Label htmlFor="is_active" className="cursor-pointer font-medium text-sm">Conta Ativa</Label>
                        <span className="text-xs text-slate-500">Contas inativas não aparecem em novas transações.</span>
                    </div>
                </div>

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
    )
}
