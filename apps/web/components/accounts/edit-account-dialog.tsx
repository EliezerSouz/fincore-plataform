"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Lock, LockOpen } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { updateAccount } from "@/app/(protected)/caixa/accounts/actions"

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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Conta</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Nome da Conta</Label>
                        <Input name="name" defaultValue={account.name} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Saldo Atual</Label>
                                <button
                                    type="button"
                                    onClick={() => setBalanceLocked(!balanceLocked)}
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                >
                                    {balanceLocked ? (
                                        <>
                                            <Lock className="w-3 h-3" />
                                            <span>Alterar</span>
                                        </>
                                    ) : (
                                        <>
                                            <LockOpen className="w-3 h-3" />
                                            <span>Bloquear</span>
                                        </>
                                    )}
                                </button>
                            </div>
                            <Input
                                name="balance"
                                defaultValue={account.balance?.toFixed(2).replace('.', ',')}
                                readOnly={balanceLocked}
                                tabIndex={balanceLocked ? -1 : 0}
                                className={`font-medium ${balanceLocked
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed focus-visible:ring-0 opacity-80'
                                    : 'bg-white dark:bg-slate-950 border-blue-500 ring-1 ring-blue-500'
                                    }`}
                            />
                            {balanceLocked && <p className="text-[10px] text-slate-400 mt-1">Desbloqueie para ajustar manualmente.</p>}
                        </div>


                        <div className="space-y-2">
                            <Label>Tipo</Label>
                            <Select name="type" value={selectedType} onValueChange={setSelectedType}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
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
                    </div>

                    {selectedType === 'investimento' && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 bg-purple-50 dark:bg-purple-900/10 p-3 rounded-lg border border-purple-100 dark:border-purple-900/20">
                            <Label className="text-purple-700 dark:text-purple-400">Rendimento Mensal (%)</Label>
                            <div className="flex gap-2 items-center">
                                <Input
                                    name="yield_rate"
                                    defaultValue={account.yield_rate ? String(account.yield_rate).replace('.', ',') : ''}
                                    placeholder="0,85"
                                    className="border-purple-200 focus-visible:ring-purple-500"
                                />
                                <span className="text-sm text-muted-foreground font-medium">% a.m.</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                                O sistema calculará o rendimento diario (dias úteis) automaticamente sobre o saldo.
                            </p>
                        </div>
                    )}

                    <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                        <Switch id="is_active" name="is_active" defaultChecked={account.is_active !== false} />
                        <div className="flex flex-col">
                            <Label htmlFor="is_active" className="cursor-pointer font-medium">Conta Ativa</Label>
                            <span className="text-xs text-slate-500">Contas inativas não aparecem em novas transações.</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Cor de Identificação</Label>
                        <div className="flex gap-2 flex-wrap">
                            {COLORS.map((c) => (
                                <label key={c.value} className="cursor-pointer relative group">
                                    <input type="radio" name="color" value={c.value} className="sr-only peer" defaultChecked={account.color === c.value} />
                                    <div className="w-8 h-8 rounded-full bg-current peer-checked:ring-2 peer-checked:ring-offset-2 ring-slate-900 dark:ring-white transition-all hover:scale-110 shadow-sm" style={{ color: c.value }} title={c.name} />
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar Alterações
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog >
    )
}
