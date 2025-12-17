"use client"

import { useState, useEffect } from "react"
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
import * as Icons from "lucide-react"
import { createPayable } from "./actions"
import { useRouter } from "next/navigation"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { getCategories, getSubcategories } from "@/app/(protected)/caixa/transactions/actions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreateButton } from "@/components/ui/create-button"
import { UpsellModal } from "@/components/ui/upsell-modal"
import { usePermission } from "@/hooks/use-permission"
import { Lock } from "lucide-react"

export function CreatePayableDialog({ activeCount = 0 }: { activeCount?: number }) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [categories, setCategories] = useState<any[]>([])
    const [subcategories, setSubcategories] = useState<any[]>([])
    const [selectedCategory, setSelectedCategory] = useState<string>("")
    const [mode, setMode] = useState("single")

    // Permission States
    const { can } = usePermission()
    const [showUpsellRecurrence, setShowUpsellRecurrence] = useState(false)

    // Regra: Bloquear criação se >= 5 contas (e não tiver perms)
    // OBS: O ideal seria checar activeCount total do sistema, mas passaremos via prop
    const canCreate = can('unlimited_accounts') || activeCount < 5

    useEffect(() => {
        if (open) {
            getCategories('despesa', true).then(setCategories)
        }
    }, [open])

    useEffect(() => {
        if (selectedCategory) {
            getSubcategories(selectedCategory, true).then(setSubcategories)
        } else {
            setSubcategories([])
        }
    }, [selectedCategory])

    function handleModeChange(value: string) {
        if (value !== 'single' && !can('manage_recurrence')) {
            setShowUpsellRecurrence(true)
            return
        }
        setMode(value)
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)

        try {
            const formData = new FormData(event.currentTarget)
            formData.append('mode', mode)

            await createPayable(formData)
            setOpen(false)
            router.refresh()
        } catch (e: any) {
            alert(e.message || 'Erro ao criar conta a pagar')
        } finally {
            setLoading(false)
        }
    }

    // Default to today
    const today = new Date().toISOString().split('T')[0]

    if (!canCreate) {
        return (
            <UpsellModal
                trigger={
                    <div className="relative inline-block">
                        <CreateButton label="Nova Conta" />
                        <div className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full p-0.5 shadow-sm">
                            <Lock className="w-3 h-3" />
                        </div>
                    </div>
                }
                title="Limite de Contas"
                description="No plano Gratuito, você pode gerenciar até 5 contas pendentes simultaneamente. Faça upgrade para contas ilimitadas."
            />
        )
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <CreateButton label="Nova Conta" />
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Nova Conta a Pagar</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">

                    <Tabs value={mode} onValueChange={handleModeChange} className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="single">Única</TabsTrigger>
                            <TabsTrigger value="fixed">
                                {can('manage_recurrence') ? 'Fixa Mensal' : <span className="flex items-center gap-1 opacity-60">Fixa <Lock className="w-3 h-3" /></span>}
                            </TabsTrigger>
                            <TabsTrigger value="installment">
                                {can('manage_recurrence') ? 'Parcelada' : <span className="flex items-center gap-1 opacity-60">Parcelada <Lock className="w-3 h-3" /></span>}
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <UpsellModal
                        open={showUpsellRecurrence}
                        onOpenChange={setShowUpsellRecurrence}
                        title="Recorrência Inteligente"
                        description="Contas fixas e parcelamentos automáticos são exclusivos do Premium. Automatize suas finanças e nunca mais esqueça um boleto."
                    />

                    <div className="space-y-2">
                        <Label htmlFor="description">Descrição</Label>
                        <Input id="description" name="description" placeholder="Ex: Aluguel, Internet" required autoFocus />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Valor {mode === 'fixed' && 'Mensal'} (R$)</Label>
                            <Input id="amount" name="amount" placeholder="0,00" required />
                            {mode === 'installment' && <p className="text-[10px] text-muted-foreground">Valor TOTAL da compra</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="date">Vencimento {mode !== 'single' && ' (1ª)'}</Label>
                            <Input id="date" name="date" type="date" defaultValue={today} required />
                        </div>
                    </div>

                    {mode !== 'single' && (
                        <div className="space-y-2 animate-in slide-in-from-top-2 fade-in">
                            <Label htmlFor="installments">
                                {mode === 'fixed' ? 'Repetir por quantos meses?' : 'Número de Parcelas'}
                            </Label>
                            <Input
                                id="installments"
                                name="installments"
                                type="number"
                                min="2"
                                max="360"
                                defaultValue="12"
                                required
                            />
                            {mode === 'fixed' && <p className="text-[10px] text-muted-foreground">Isso criará lançamentos futuros para cada mês.</p>}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="categoryId">Categoria</Label>
                            <Select name="categoryId" onValueChange={setSelectedCategory} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            <span className="flex items-center gap-2">
                                                {(() => {
                                                    // Renderização dinâmica SEGURA
                                                    const IconComponent = (Icons as any)[cat.icon] || Icons.Circle
                                                    return <IconComponent className="w-4 h-4" />
                                                })()}
                                                <span>{cat.name}</span>
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="subcategoryId">Subcategoria</Label>
                            <Select name="subcategoryId" disabled={!selectedCategory || subcategories.length === 0}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {subcategories.map((sub) => (
                                        <SelectItem key={sub.id} value={sub.id}>
                                            {sub.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={loading} className="w-full" variant="success">
                            {loading ? 'Salvando...' : 'Agendar Conta'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
