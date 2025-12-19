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
import { FinancialTransactionForm, FinancialTransactionFormData } from "@/features/transactions/components/financial-transaction-form"

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

    async function handleFormSubmit(data: FinancialTransactionFormData) {
        setLoading(true)
        try {
            const formData = new FormData()
            formData.append('description', data.description)
            formData.append('amount', data.amount.toString())
            formData.append('date', data.date)
            formData.append('categoryId', data.categoryId || "")
            formData.append('subcategoryId', data.subcategoryId || "")
            formData.append('mode', mode)
            formData.append('installments', data.installments || "1")

            await createPayable(formData)
            setOpen(false)
            router.refresh()
        } catch (e: any) {
            alert(e.message || 'Erro ao criar conta a pagar')
        } finally {
            setLoading(false)
        }
    }

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
            <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="text-xl font-bold">Nova Conta a Pagar</DialogTitle>
                </DialogHeader>

                <div className="px-6 pt-4">
                    <Tabs value={mode} onValueChange={handleModeChange} className="w-full">
                        <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-slate-800 p-1 h-11">
                            <TabsTrigger value="single" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">Única</TabsTrigger>
                            <TabsTrigger value="fixed" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
                                {can('manage_recurrence') ? 'Fixa' : <span className="flex items-center gap-1 opacity-60">Fixa <Lock className="w-3 h-3" /></span>}
                            </TabsTrigger>
                            <TabsTrigger value="installment" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
                                {can('manage_recurrence') ? 'Parcelada' : <span className="flex items-center gap-1 opacity-60">Parc. <Lock className="w-3 h-3" /></span>}
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <div className="p-6 pt-4">
                    <FinancialTransactionForm
                        mode="create"
                        onSubmit={handleFormSubmit}
                        onCancel={() => setOpen(false)}
                        isLoading={loading}
                        showTypeSelector={false} // Sempre despesa em Payables
                        showAccountSelector={false} // Regra 2: Sem conta na criação de payable
                        showPaymentMethodSelector={false} // Regra 2: Sem forma de pagamento
                        initialData={{
                            type: 'despesa',
                            installments: mode === 'single' ? "1" : "12"
                        }}
                        dateLabel="Vencimento"
                    />
                </div>

                <UpsellModal
                    open={showUpsellRecurrence}
                    onOpenChange={setShowUpsellRecurrence}
                    title="Recorrência Inteligente"
                    description="Contas fixas e parcelamentos automáticos são exclusivos do Premium. Automatize suas finanças e nunca mais esqueça um boleto."
                />
            </DialogContent>
        </Dialog>
    )
}
