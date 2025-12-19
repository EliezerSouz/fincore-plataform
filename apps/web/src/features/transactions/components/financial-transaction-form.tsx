"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowDownCircle, ArrowLeftRight, ArrowUpCircle, Lock, Loader2 } from "lucide-react"
import { getAccounts, Account } from "@/app/(protected)/caixa/accounts/actions"
import { getCategories, getSubcategories, getPaymentMethods, Category, Subcategory } from "@/app/(protected)/caixa/transactions/actions"
import { getCreditCards } from "@/app/(protected)/compromissos/cards/actions"
import { usePermission } from "@/hooks/use-permission"
import { usePrimaryCard } from "@/hooks/use-primary-card"
import { cn } from "@/lib/utils"
import { CurrencyInput } from "@/components/ui/currency-input"

export interface FinancialTransactionFormData {
    type: 'receita' | 'despesa' | 'transferencia'
    amount: number
    description: string
    accountId: string
    targetAccountId?: string
    categoryId?: string
    subcategoryId?: string
    paymentMethodId?: string
    selectedCardId?: string
    installments?: string
    date: string
}

interface FinancialTransactionFormProps {
    mode: 'create' | 'edit'
    initialData?: Partial<FinancialTransactionFormData>
    onSubmit: (data: FinancialTransactionFormData) => Promise<void>
    onCancel: () => void
    isLoading?: boolean
    showTypeSelector?: boolean
    showAccountSelector?: boolean
    showPaymentMethodSelector?: boolean
    showCategorySelector?: boolean
    dateLabel?: string
}

export function FinancialTransactionForm({
    mode,
    initialData,
    onSubmit,
    onCancel,
    isLoading = false,
    showTypeSelector = true,
    showAccountSelector = true,
    showPaymentMethodSelector = true,
    showCategorySelector = true,
    dateLabel = "Data"
}: FinancialTransactionFormProps) {
    const isSubmittingRef = useRef(false)
    const { can } = usePermission()
    const { primaryCardId } = usePrimaryCard()

    // Form State
    const [type, setType] = useState<'receita' | 'despesa' | 'transferencia'>(initialData?.type || 'despesa')
    const [amount, setAmount] = useState(initialData?.amount || 0)
    const [description, setDescription] = useState(initialData?.description || "")
    const [accountId, setAccountId] = useState(initialData?.accountId || "")
    const [targetAccountId, setTargetAccountId] = useState(initialData?.targetAccountId || "")
    const [categoryId, setCategoryId] = useState(initialData?.categoryId || "")
    const [subcategoryId, setSubcategoryId] = useState(initialData?.subcategoryId || "")
    const [paymentMethodId, setPaymentMethodId] = useState(initialData?.paymentMethodId || "")
    const [selectedCardId, setSelectedCardId] = useState(initialData?.selectedCardId || "")
    const [installments, setInstallments] = useState(initialData?.installments || "1")
    const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0])

    // Listas
    const [accounts, setAccounts] = useState<Account[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [subcategories, setSubcategories] = useState<Subcategory[]>([])
    const [methods, setMethods] = useState<any[]>([])
    const [creditCards, setCreditCards] = useState<any[]>([])

    // Carregar dados iniciais
    useEffect(() => {
        loadInitialData()
    }, [])

    // Carregar categorias quando tipo mudar
    useEffect(() => {
        if (type !== 'transferencia') {
            getCategories(type).then(setCategories)
            if (mode === 'create') {
                setCategoryId("")
                setSubcategoryId("")
            }
        }
    }, [type, mode])

    // Carregar subcategorias quando categoria mudar
    useEffect(() => {
        if (categoryId) {
            getSubcategories(categoryId).then(setSubcategories)
        } else {
            setSubcategories([])
        }
    }, [categoryId])

    // Resetar Forma de Pagamento quando o tipo mudar se não for permitida
    useEffect(() => {
        if (paymentMethodId && methods.length > 0) {
            const method = methods.find(m => m.id === paymentMethodId)
            if (method) {
                if (type === 'receita' && !method.allows_income) setPaymentMethodId("")
                if (type === 'despesa' && !method.allows_expense) setPaymentMethodId("")
                if (type === 'transferencia' && !method.allows_expense) setPaymentMethodId("")
            }
        }
    }, [type, methods])

    async function loadInitialData() {
        try {
            const [accs, payMethods, cards] = await Promise.all([
                getAccounts(),
                getPaymentMethods(),
                getCreditCards()
            ])
            setAccounts(accs)
            setMethods(payMethods)
            setCreditCards(cards)

            if (mode === 'create' && accs.length > 0 && !accountId) {
                setAccountId(accs[0].id)
                if (accs.length > 1) setTargetAccountId(accs[1].id)
            }
        } catch (error) {
            console.error("Error loading initial data:", error)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (isSubmittingRef.current) return

        // Validação básica
        if (!amount || amount <= 0) {
            alert("Informe um valor maior que zero.")
            return
        }

        if (type === 'transferencia') {
            if (!accountId || !targetAccountId) return
            if (accountId === targetAccountId) {
                alert("As contas de origem e destino devem ser diferentes.")
                return
            }
        } else {
            if (!accountId || !categoryId) return
        }

        isSubmittingRef.current = true

        try {
            await onSubmit({
                type,
                amount,
                description: description || (type === 'transferencia' ? 'Transferência' : ''),
                accountId,
                targetAccountId,
                categoryId,
                subcategoryId,
                paymentMethodId,
                selectedCardId,
                installments,
                date
            })
        } catch (error: any) {
            alert(error.message || "Erro ao processar transação")
        } finally {
            isSubmittingRef.current = false
        }
    }

    const currentMethod = methods.find(m => m.id === paymentMethodId)
    const isCreditCard = currentMethod?.slug === 'credit_card' && type !== 'transferencia'

    // 🎯 FILTRO DE MODALIDADES CONFORME TIPO
    const filteredMethods = methods.filter(m => {
        if (!m.is_active) return false
        if (type === 'receita') return !!m.allows_income
        if (type === 'despesa') return !!m.allows_expense
        if (type === 'transferencia') return !!m.allows_transfer
        return true
    })

    return (
        <form onSubmit={handleSubmit}>
            {/* SELETOR DE TIPO */}
            {showTypeSelector && (
                <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg mb-4">
                    <button
                        type="button"
                        onClick={() => setType('despesa')}
                        className={cn(
                            "flex-1 py-1.5 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2",
                            type === 'despesa'
                                ? "bg-white dark:bg-slate-700 text-red-600 shadow-sm border border-red-100 dark:border-red-900/30"
                                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        )}
                    >
                        <ArrowDownCircle className="w-4 h-4" /> Despesa
                    </button>
                    <button
                        type="button"
                        onClick={() => setType('receita')}
                        className={cn(
                            "flex-1 py-1.5 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2",
                            type === 'receita'
                                ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-sm border border-emerald-100 dark:border-emerald-900/30"
                                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        )}
                    >
                        <ArrowUpCircle className="w-4 h-4" /> Receita
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            if (!can('transfer_between_accounts')) {
                                alert("Transferências entre contas são exclusivas para planos Premium.")
                                return
                            }
                            setType('transferencia')
                        }}
                        className={cn(
                            "flex-1 py-1.5 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2",
                            type === 'transferencia'
                                ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm border border-blue-100 dark:border-blue-900/30"
                                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        )}
                    >
                        <ArrowLeftRight className="w-4 h-4" /> Transferir
                        {!can('transfer_between_accounts') && <Lock className="w-3 h-3 opacity-50" />}
                    </button>
                </div>
            )}

            <div className="grid gap-4 py-2">
                {/* VALOR */}
                <CurrencyInput
                    label="Valor"
                    value={amount}
                    onChange={setAmount}
                    required
                    autoFocus={mode === 'create'}
                    className="text-xl h-12"
                />

                {/* DESCRIÇÃO */}
                <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-slate-500">
                        {type === 'transferencia' ? 'Observação (Opcional)' : 'Descrição'}
                    </Label>
                    <Input
                        placeholder={type === 'despesa' ? "Ex: Padaria, Uber, Netflix..." : type === 'receita' ? "Ex: Salário, Freela..." : "Ex: Transferência de Reserva"}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required={type !== 'transferencia'}
                    />
                </div>

                {/* CATEGORIA E SUBCATEGORIA - Só se não for transferência */}
                {type !== 'transferencia' && showCategorySelector && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase text-slate-500">Categoria</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300 shadow-sm"
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                required
                            >
                                <option value="">Selecione...</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase text-slate-500">Subcategoria (Opcional)</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300 shadow-sm"
                                value={subcategoryId}
                                onChange={(e) => setSubcategoryId(e.target.value)}
                                disabled={!categoryId}
                            >
                                <option value="">Geral</option>
                                {subcategories.map(sub => (
                                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                {/* CONTA E FORMA DE PAGAMENTO */}
                {(showAccountSelector || showPaymentMethodSelector) && (
                    <div className="grid grid-cols-2 gap-4">
                        {showAccountSelector ? (
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase text-slate-500">
                                    {type === 'receita' ? 'Conta de Entrada' : type === 'despesa' ? 'Conta de Saída' : 'Conta de Origem'}
                                </Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300 shadow-sm"
                                    value={accountId}
                                    onChange={(e) => setAccountId(e.target.value)}
                                    required={showAccountSelector}
                                >
                                    <option value="">Selecione...</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                                    ))}
                                </select>
                            </div>
                        ) : <div />}

                        <div className="space-y-2">
                            {type === 'transferencia' ? (
                                <>
                                    <Label className="text-xs font-semibold uppercase text-slate-500">Conta de Destino</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300 shadow-sm"
                                        value={targetAccountId}
                                        onChange={(e) => setTargetAccountId(e.target.value)}
                                        required
                                    >
                                        <option value="">Selecione...</option>
                                        {accounts.filter(a => a.id !== accountId).map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                                        ))}
                                    </select>
                                </>
                            ) : showPaymentMethodSelector ? (
                                <>
                                    <Label className="text-xs font-semibold uppercase text-slate-500">Forma de Pagamento</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300 shadow-sm"
                                        value={paymentMethodId}
                                        onChange={(e) => setPaymentMethodId(e.target.value)}
                                    >
                                        <option value="">Opcional</option>
                                        {filteredMethods.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                </>
                            ) : null}
                        </div>
                    </div>
                )}

                {/* DATA E EXTRAS */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase text-slate-500">{dateLabel}</Label>
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                            className="shadow-sm"
                        />
                    </div>

                    {type === 'transferencia' ? (
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase text-slate-500">Método (Opcional)</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300 shadow-sm"
                                value={paymentMethodId}
                                onChange={(e) => setPaymentMethodId(e.target.value)}
                            >
                                <option value="">Selecione...</option>
                                {filteredMethods.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                    ) : isCreditCard ? (
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase text-slate-500">Parcelas</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300 shadow-sm"
                                value={installments}
                                onChange={(e) => setInstallments(e.target.value)}
                            >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(i => (
                                    <option key={i} value={String(i)}>{i}x</option>
                                ))}
                            </select>
                        </div>
                    ) : null}
                </div>

                {/* CARTÃO DE CRÉDITO - SELECIONAR CARTÃO */}
                {isCreditCard && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                        <Label className="text-xs font-semibold uppercase text-slate-500">Selecionar Cartão de Crédito</Label>
                        <select
                            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300 shadow-sm mt-1"
                            value={selectedCardId}
                            onChange={(e) => setSelectedCardId(e.target.value)}
                            required={isCreditCard}
                        >
                            <option value="">Escolha o cartão...</option>
                            {creditCards.map((card) => {
                                const isLocked = !can('unlimited_cards') && card.id !== primaryCardId
                                return (
                                    <option key={card.id} value={card.id} disabled={isLocked}>
                                        {card.name} {isLocked ? "(Inativo)" : ""}
                                    </option>
                                )
                            })}
                        </select>
                    </div>
                )}
            </div>

            {/* FOOTER COM BOTÕES */}
            <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
                <Button
                    type="submit"
                    disabled={isLoading}
                    className={cn(
                        "font-bold shadow-md min-w-[140px]",
                        type === 'receita' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' :
                            type === 'despesa' ? 'bg-red-600 hover:bg-red-700 text-white' :
                                'bg-blue-600 hover:bg-blue-700 text-white'
                    )}
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {isLoading ? (mode === 'create' ? 'Lançando...' : 'Salvando...') : (mode === 'create' ? 'Confirmar Transação' : 'Salvar Alterações')}
                </Button>
            </div>
        </form>
    )
}
