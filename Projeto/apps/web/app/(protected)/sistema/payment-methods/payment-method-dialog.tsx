"use client"

import { useState, useEffect } from "react"
import { BaseModal } from "@/components/ui/base-modal"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowUpCircle, ArrowDownCircle, ArrowLeftRight, CreditCard, FileText, GitBranch, Wallet, Info } from "lucide-react"
import { createPaymentMethod, updatePaymentMethod, PaymentMethod } from "./actions"
import { CreateButton } from "@/components/ui/create-button"
import { useRouter } from "next/navigation"
import { SwitchTile } from "@/components/ui/switch-tile"
import { toast } from "sonner"

interface PaymentMethodDialogProps {
    method?: PaymentMethod
    trigger?: React.ReactNode
    onSuccess?: () => void
}

export function PaymentMethodDialog({ method, trigger, onSuccess }: PaymentMethodDialogProps) {
    const router = useRouter()
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
            
            // Auto-generate slug if empty (creation)
            let finalSlug = slug
            if (!finalSlug && name) {
                finalSlug = name.toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-z0-9]+/g, "_")
                    .replace(/^_+|_+$/g, "")
            }
            formData.append('slug', finalSlug)
            
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
            router.refresh()
            toast.success(method ? "Modalidade atualizada com sucesso!" : "Modalidade criada com sucesso!")
        } catch (error: any) {
            toast.error(error.message || "Erro ao salvar modalidade")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            {trigger ? (
                <div onClick={() => setOpen(true)} className="inline-block cursor-pointer">
                    {trigger}
                </div>
            ) : (
                <CreateButton label="Nova Modalidade" onClick={() => setOpen(true)} />
            )}

            <BaseModal
                open={open}
                onOpenChange={setOpen}
                title={method ? 'Editar Modalidade' : 'Nova Modalidade de Pagamento'}
                description="Configure onde e como esta forma de pagamento pode ser utilizada no sistema."
                maxWidth="sm:max-w-[600px]"
                primaryButton={{
                    label: isLoading ? 'Salvando...' : method ? 'Salvar Alterações' : 'Criar Modalidade',
                    isLoading,
                    form: 'payment-method-form',
                    type: 'submit'
                }}
                secondaryButton={{
                    label: 'Cancelar',
                    onClick: () => setOpen(false)
                }}
            >
                <form id="payment-method-form" onSubmit={handleSubmit} className="grid gap-6 py-4 max-h-[65vh] overflow-y-auto pr-2">
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
                                className="shadow-sm h-11"
                            />
                        </div>

                        {method && (
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase text-slate-500">Identificador (Slug)</Label>
                                <div className="px-3 py-2.5 bg-slate-50 dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800">
                                    <code className="text-xs font-mono text-slate-500 break-all">{slug}</code>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* CONTEXTOS DE USO */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <GitBranch className="w-4 h-4" />
                            Contextos de Uso (Onde pode ser usado)
                        </h3>

                        <SwitchTile
                            checked={allowsIncome}
                            onCheckedChange={setAllowsIncome}
                            label="Permitir em Receitas"
                            description="Entrada de dinheiro (salário, vendas, etc)"
                            icon={ArrowUpCircle}
                            iconClassName="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                        />

                        <SwitchTile
                            checked={allowsExpense}
                            onCheckedChange={setAllowsExpense}
                            label="Permitir em Despesas"
                            description="Saída de dinheiro (compras, contas, etc)"
                            icon={ArrowDownCircle}
                            iconClassName="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                        />

                        <SwitchTile
                            checked={allowsTransfer}
                            onCheckedChange={setAllowsTransfer}
                            label="Permitir em Transferências"
                            description="Movimentação entre contas próprias"
                            icon={ArrowLeftRight}
                            iconClassName="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                        />

                        <SwitchTile
                            checked={affectsCreditCard}
                            onCheckedChange={setAffectsCreditCard}
                            label="Afeta Cartão de Crédito"
                            description="Lançamento vai para fatura do cartão"
                            icon={CreditCard}
                            iconClassName="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                        />

                        <SwitchTile
                            checked={affectsInvoice}
                            onCheckedChange={setAffectsInvoice}
                            label="Afeta Faturas/Boletos"
                            description="Pagamento de contas e faturas"
                            icon={FileText}
                            iconClassName="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                        />

                        <SwitchTile
                            checked={isInternal}
                            onCheckedChange={setIsInternal}
                            label="Movimento Interno"
                            description="Não afeta resultado financeiro"
                            icon={GitBranch}
                            iconClassName="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        />
                    </div>

                    {/* COMPORTAMENTO */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <Wallet className="w-4 h-4" />
                            Comportamento Financeiro
                        </h3>

                        <SwitchTile
                            checked={affectsBalance}
                            onCheckedChange={setAffectsBalance}
                            label="Afeta Saldo Imediatamente"
                            description="Altera o saldo da conta na hora"
                            icon={Wallet}
                            iconClassName="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                        />

                        <SwitchTile
                            checked={requiresBankAccount}
                            onCheckedChange={setRequiresBankAccount}
                            label="Requer Conta Bancária"
                            description="Precisa vincular a uma conta"
                            icon={Wallet}
                            iconClassName="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                        />
                    </div>

                    {/* STATUS */}
                    {method && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Status</h3>
                            <SwitchTile
                                checked={isActive}
                                onCheckedChange={setIsActive}
                                label="Modalidade Ativa"
                                description="Desative para ocultar da lista"
                                icon={Info}
                                iconClassName="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                            />
                        </div>
                    )}
                </form>
            </BaseModal>
        </>
    )
}
