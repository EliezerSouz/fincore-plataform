"use client"

import { useState, useEffect } from "react"
import { BaseModal } from "@/components/ui/base-modal"
import { FileText, Lock } from "lucide-react"
import { createPayable } from "./actions"
import { useRouter } from "next/navigation"
import { getCategories, getSubcategories } from "@/app/(protected)/caixa/transactions/actions"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreateButton } from "@/components/ui/create-button"
import { UpsellModal } from "@/components/ui/upsell-modal"
import { toast } from "sonner"
import { usePermission } from "@/hooks/use-permission"
import { toTransactionFormData } from "@/features/transactions/utils/form-data"
import { FinancialTransactionForm, FinancialTransactionFormData } from "@/features/transactions/components/financial-transaction-form"

export function CreatePayableDialog({ activeCount = 0 }: { activeCount?: number }) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [categories, setCategories] = useState<any[]>([])
    const [subcategories, setSubcategories] = useState<any[]>([])
    const [selectedCategory, setSelectedCategory] = useState<string>("")
    const [mode, setMode] = useState("single")
    const [installments, setInstallments] = useState<number>(12)

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
        if (value === 'single') setInstallments(1)
        else setInstallments(12)
    }

    async function handleFormSubmit(data: FinancialTransactionFormData) {
        setLoading(true)
        try {
            const formData = toTransactionFormData(data)
            // Campos específicos de Payables que o helper pode não cobrir ou que precisam de override
            formData.append('mode', mode)
            formData.set('installments', String(installments))  // Usar state local controlado e SOBRESCREVER o do form interno (que vem como 1)

            await createPayable(formData)
            setOpen(false)
            router.refresh()
            toast.success("Conta a pagar criada com sucesso!")
        } catch (e: any) {
            toast.error(e.message || 'Erro ao criar conta a pagar')
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
        <>
            <CreateButton label="Nova Conta" onClick={() => setOpen(true)} />

            <BaseModal
                open={open}
                onOpenChange={setOpen}
                title={
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <span>Nova Conta a Pagar</span>
                    </div>
                }
                description="Cadastre seus compromissos financeiros."
                className="max-w-[500px]"
                primaryButton={{
                    label: "Criar Conta",
                    isLoading: loading,
                    form: "create-payable-form",
                    type: "submit"
                }}
                secondaryButton={{
                    label: "Cancelar"
                }}
            >
                <div className="space-y-6">
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

                    {/* INPUTS DE RECORRÊNCIA */}
                    {mode !== 'single' && (
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-800 animate-in slide-in-from-top-2">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-xs font-semibold uppercase text-slate-500 mb-1.5 block">
                                        {mode === 'fixed' ? 'Duração (Meses)' : 'Número de Parcelas'}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="2"
                                            max="999"
                                            value={installments}
                                            onChange={(e) => setInstallments(Number(e.target.value))}
                                            className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-blue-600"
                                        />
                                        <div className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium pointer-events-none">
                                            {mode === 'fixed' ? 'meses' : 'x'}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-[2] flex items-center">
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        {mode === 'fixed'
                                            ? "O valor será repetido mensalmente pela duração definida."
                                            : "O valor total informado abaixo será dividido pelo número de parcelas."
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

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
                            // O form interno não precisa saber das parcelas se estamos controlando fora/sobrescrevendo
                        }}
                        dateLabel="Vencimento (1ª Parcela)"
                        formId="create-payable-form"
                        hideFooter={true}
                    />
                </div>

                <UpsellModal
                    open={showUpsellRecurrence}
                    onOpenChange={setShowUpsellRecurrence}
                    title="Recorrência Inteligente"
                    description="Contas fixas e parcelamentos automáticos são exclusivos do Premium. Automatize suas finanças e nunca mais esqueça um boleto."
                />
            </BaseModal>
        </>
    )
}
