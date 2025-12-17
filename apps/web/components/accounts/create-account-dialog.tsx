"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Loader2 } from "lucide-react"
import { createAccount } from "@/app/(protected)/caixa/accounts/actions"
import { CreateButton } from "@/components/ui/create-button"

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
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [selectedType, setSelectedType] = useState("corrente")
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
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <CreateButton label="Nova Conta" />
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Adicionar Nova Conta</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Nome da Conta</Label>
                        <Input name="name" placeholder="Ex: Nubank, Carteira..." required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Saldo Atual</Label>
                            <Input name="balance" placeholder="0,00" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Tipo</Label>
                            <Select name="type" defaultValue="corrente" onValueChange={setSelectedType} value={selectedType}>
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
                                <Input name="yield_rate" placeholder="0,85" className="border-purple-200 focus-visible:ring-purple-500" />
                                <span className="text-sm text-muted-foreground font-medium">% a.m.</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                                O sistema calculará o rendimento diario (dias úteis) automaticamente sobre o saldo.
                            </p>
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label>Cor de Identificação</Label>
                        <div className="flex gap-2 flex-wrap">
                            {COLORS.map((c) => (
                                <label key={c.value} className="cursor-pointer relative group">
                                    <input type="radio" name="color" value={c.value} className="sr-only peer" defaultChecked={c.name === 'Azul'} />
                                    <div className="w-8 h-8 rounded-full bg-current peer-checked:ring-2 peer-checked:ring-offset-2 ring-slate-900 dark:ring-white transition-all hover:scale-110 shadow-sm" style={{ color: c.value }} title={c.name} />
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end">
                        <Button type="submit" disabled={loading} className="w-full" variant="success">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Criar Conta
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
