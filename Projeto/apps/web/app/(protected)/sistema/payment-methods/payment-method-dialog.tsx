"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowUpCircle, ArrowDownCircle, ArrowLeftRight, CreditCard, FileText, GitBranch, Wallet, Info } from "lucide-react"
import { createPaymentMethod, updatePaymentMethod, PaymentMethod } from "./actions"
import { cn } from "@/lib/utils"
import { CreateButton } from "@/components/ui/create-button"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface PaymentMethodDialogProps {
    method?: PaymentMethod
    trigger?: React.ReactNode
    onSuccess?: () => void
}

export function PaymentMethodDialog({ method, trigger, onSuccess }: PaymentMethodDialogProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Form State
    const [name, setName] = useState(method?.name || "")
    const [slug, setSlug] = useState(method?.slug || "")

    // Flags de Contexto
    const [allowsIncome, setAllowsIncome] = useState(method?.allows_income ?? true)
    const [allowsExpense, setAllowsExpense] = useState(method?.allows_expense ?? true)
    const [allowsTransfer, setAllowsTransfer] = useState(method?.allows_transfer ?? false)
    const [affectsCreditCard, setAffectsCreditCard] = useState(method?.affects_credit_card ?? false)
    const [affectsInvoice, setAffectsInvoice] = useState(method?.affects_invoice ?? false)
    const [isInternal, setIsInternal] = useState(method?.is_internal ?? false)

    // Flags de Comportamento
    const [affectsBalance, setAffectsBalance] = useState(method?.affects_balance ?? true)
    const [requiresBankAccount, setRequiresBankAccount] = useState(method?.requires_bank_account ?? true)

    // Status
    const [isActive, setIsActive] = useState(method?.is_active ?? true)

    useEffect(() => {
        if (open) {
            setName(method?.name || "")
            setSlug(method?.slug || "")
            setAllowsIncome(method?.allows_income ?? true)
            setAllowsExpense(method?.allows_expense ?? true)
            setAllowsTransfer(method?.allows_transfer ?? false)
            setAffectsCreditCard(method?.affects_credit_card ?? false)
            setAffectsInvoice(method?.affects_invoice ?? false)
            setIsInternal(method?.is_internal ?? false)
            setAffectsBalance(method?.affects_balance ?? true)
            setRequiresBankAccount(method?.requires_bank_account ?? true)
            setIsActive(method?.is_active ?? true)
        }
    }, [open, method])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setIsLoading(true)

        try {
            const formData = new FormData()
            formData.append('name', name)
            formData.append('slug', slug)
            formData.append('allows_income', String(allowsIncome))
            formData.append('allows_expense', String(allowsExpense))
            formData.append('allows_transfer', String(allowsTransfer))
            formData.append('affects_credit_card', String(affectsCreditCard))
            formData.append('affects_invoice', String(affectsInvoice))
            formData.append('is_internal', String(isInternal))
            formData.append('affects_balance', String(affectsBalance))
            formData.append('requires_bank_account', String(requiresBankAccount))
            formData.append('is_active', String(isActive))

            if (method) {
                await updatePaymentMethod(method.id, formData)
            } else {
                await createPaymentMethod(formData)
            }

            onSuccess?.()
            setOpen(false)
            setTimeout(() => {
                window.location.reload()
            }, 300)
        } catch (error: any) {
            alert(error.message || "Erro ao salvar modalidade")
        } finally {
            setIsLoading(false)
        }
    }

    const ToggleSwitch = ({ checked, onChange, label, description, icon: Icon, color }: any) => (
        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-3 flex-1">
                <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                    checked ? `${color}` : "bg-slate-200 dark:bg-slate-800"
                )}>
                    <Icon className={cn("w-4 h-4", checked ? "text-white" : "text-slate-400")} />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{description}</p>
                </div>
            </div>
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    checked ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
                )}
            >
                <span
                    className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        checked ? "translate-x-6" : "translate-x-1"
                    )}
                />
            </button>
        </div>
    )

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <CreateButton label="Nova Modalidade" />}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
                            {method ? 'Editar Modalidade' : 'Nova Modalidade de Pagamento'}
                        </DialogTitle>
                        <DialogDescription>
                            Configure onde e como esta forma de pagamento pode ser utilizada no sistema.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        {/* INFORMAÇÕES BÁSICAS */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <Info className="w-4 h-4" />
                                Informações Básicas
                            </h3>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase text-slate-500">Nome da Modalidade</Label>
                                <Input
                                    placeholder="Ex: PIX, Dinheiro, Cartão de Débito..."
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    autoFocus
                                    className="shadow-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase text-slate-500">Identificador (Slug)</Label>
                                <Input
                                    placeholder="Ex: pix, cash, debit_card..."
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                                    required
                                    className="shadow-sm font-mono text-sm"
                                />
                                <p className="text-[10px] text-slate-500">Usado internamente. Não altere após criar.</p>
                            </div>
                        </div>

                        {/* CONTEXTOS DE USO */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <GitBranch className="w-4 h-4" />
                                Contextos de Uso (Onde pode ser usado)
                            </h3>

                            <ToggleSwitch
                                checked={allowsIncome}
                                onChange={setAllowsIncome}
                                label="Permitir em Receitas"
                                description="Entrada de dinheiro (salário, vendas, etc)"
                                icon={ArrowUpCircle}
                                color="bg-emerald-600"
                            />

                            <ToggleSwitch
                                checked={allowsExpense}
                                onChange={setAllowsExpense}
                                label="Permitir em Despesas"
                                description="Saída de dinheiro (compras, contas, etc)"
                                icon={ArrowDownCircle}
                                color="bg-red-600"
                            />

                            <ToggleSwitch
                                checked={allowsTransfer}
                                onChange={setAllowsTransfer}
                                label="Permitir em Transferências"
                                description="Movimentação entre contas próprias"
                                icon={ArrowLeftRight}
                                color="bg-blue-600"
                            />

                            <ToggleSwitch
                                checked={affectsCreditCard}
                                onChange={setAffectsCreditCard}
                                label="Afeta Cartão de Crédito"
                                description="Lançamento vai para fatura do cartão"
                                icon={CreditCard}
                                color="bg-purple-600"
                            />

                            <ToggleSwitch
                                checked={affectsInvoice}
                                onChange={setAffectsInvoice}
                                label="Afeta Faturas/Boletos"
                                description="Pagamento de contas e faturas"
                                icon={FileText}
                                color="bg-amber-600"
                            />

                            <ToggleSwitch
                                checked={isInternal}
                                onChange={setIsInternal}
                                label="Movimento Interno"
                                description="Não afeta resultado financeiro"
                                icon={GitBranch}
                                color="bg-slate-600"
                            />
                        </div>

                        {/* COMPORTAMENTO */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <Wallet className="w-4 h-4" />
                                Comportamento Financeiro
                            </h3>

                            <ToggleSwitch
                                checked={affectsBalance}
                                onChange={setAffectsBalance}
                                label="Afeta Saldo Imediatamente"
                                description="Altera o saldo da conta na hora"
                                icon={Wallet}
                                color="bg-green-600"
                            />

                            <ToggleSwitch
                                checked={requiresBankAccount}
                                onChange={setRequiresBankAccount}
                                label="Requer Conta Bancária"
                                description="Precisa vincular a uma conta"
                                icon={Wallet}
                                color="bg-indigo-600"
                            />
                        </div>

                        {/* STATUS */}
                        {method && (
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Status</h3>
                                <ToggleSwitch
                                    checked={isActive}
                                    onChange={setIsActive}
                                    label="Modalidade Ativa"
                                    description="Desative para ocultar da lista"
                                    icon={Info}
                                    color="bg-blue-600"
                                />
                            </div>
                        )}
                    </div>

                    <DialogFooter className="mt-4">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="font-bold bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            {isLoading ? 'Salvando...' : method ? 'Salvar Alterações' : 'Criar Modalidade'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
