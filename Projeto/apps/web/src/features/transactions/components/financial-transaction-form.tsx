"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowDownCircle, ArrowLeftRight, ArrowUpCircle, Lock, Loader2, CreditCard } from "lucide-react"
import { getAccounts, Account } from "@/app/(protected)/caixa/accounts/actions"
import { getCategories, getSubcategories, getPaymentMethods, Category, Subcategory } from "@/app/(protected)/caixa/transactions/actions"
import { getCreditCards } from "@/app/(protected)/compromissos/cards/actions"
import { usePermission } from "@/hooks/use-permission"
import { usePrimaryCard } from "@/hooks/use-primary-card"
import { cn } from "@/lib/utils"
import { CurrencyInput } from "@/components/ui/currency-input"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { toast } from "sonner"

export interface FinancialTransactionFormData {
    type: 'receita' | 'despesa' | 'transferencia' | 'compra'
    amount: number
    description: string
    notes?: string
    accountId: string
    targetAccountId?: string
    categoryId?: string
    subcategoryId?: string
    paymentMethodId?: string
    selectedCardId?: string
    installments?: string
    date: string
    // Retroativo
    isRetroactive?: boolean
    startInstallment?: number
    endInstallment?: number
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
    formId?: string
    hideFooter?: boolean
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
    dateLabel = "Data",
    formId,
    hideFooter = false
}: FinancialTransactionFormProps) {
    const isSubmittingRef = useRef(false)
    const { can } = usePermission()
    const { primaryCardId } = usePrimaryCard()

    // Form State
    const [type, setType] = useState<'receita' | 'despesa' | 'transferencia' | 'compra'>(initialData?.type || 'despesa')
    const [amount, setAmount] = useState(initialData?.amount || 0)
    const [description, setDescription] = useState(initialData?.description || "")
    const [notes, setNotes] = useState(initialData?.notes || "")
    const [accountId, setAccountId] = useState(initialData?.accountId || "")
    const [targetAccountId, setTargetAccountId] = useState(initialData?.targetAccountId || "")
    const [categoryId, setCategoryId] = useState(initialData?.categoryId || "")
    const [subcategoryId, setSubcategoryId] = useState(initialData?.subcategoryId || "")
    const [paymentMethodId, setPaymentMethodId] = useState(initialData?.paymentMethodId || "")
    const [selectedCardId, setSelectedCardId] = useState(initialData?.selectedCardId || "")
    const [installments, setInstallments] = useState(initialData?.installments || "1")
    const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0])

    // Retroativo
    const [isRetroactive, setIsRetroactive] = useState(false)
    const [installmentAmount, setInstallmentAmount] = useState(0)
    const [totalInstallments, setTotalInstallments] = useState(12)
    const [startInstallment, setStartInstallment] = useState(1)
    const [endInstallment, setEndInstallment] = useState(12)

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

    // Resetar Retroativo quando o tipo mudar
    useEffect(() => {
        if (type !== 'compra') {
            setIsRetroactive(false)
        }
    }, [type])

    // Carregar categorias quando tipo mudar
    useEffect(() => {
        if (type !== 'transferencia') {
            const categoryType = (type === 'receita') ? 'receita' : 'despesa'
            getCategories(categoryType).then(setCategories)
            if (mode === 'create' && !initialData?.categoryId) {
                setCategoryId("")
                setSubcategoryId("")
            }
        }
    }, [type, mode, initialData])

    // Carregar subcategorias quando categoria mudar
    useEffect(() => {
        if (categoryId) {
            getSubcategories(categoryId).then(setSubcategories)
        } else {
            setSubcategories([])
        }
    }, [categoryId])

    // Sincronizar dados iniciais quando mudarem (importante para diálogos de edição)
    useEffect(() => {
        if (mode === 'edit' && initialData) {
            if (initialData.type) setType(initialData.type)
            if (initialData.amount !== undefined) setAmount(initialData.amount)
            if (initialData.description !== undefined) setDescription(initialData.description)
            if (initialData.notes !== undefined) setNotes(initialData.notes)
            if (initialData.accountId !== undefined) setAccountId(initialData.accountId)
            if (initialData.targetAccountId !== undefined) setTargetAccountId(initialData.targetAccountId)
            if (initialData.categoryId !== undefined) setCategoryId(initialData.categoryId)
            if (initialData.subcategoryId !== undefined) setSubcategoryId(initialData.subcategoryId)
            if (initialData.paymentMethodId !== undefined) setPaymentMethodId(initialData.paymentMethodId)
            if (initialData.selectedCardId !== undefined) setSelectedCardId(initialData.selectedCardId)
            if (initialData.installments !== undefined) setInstallments(initialData.installments)
            if (initialData.date !== undefined) setDate(initialData.date)
        }
    }, [initialData, mode])

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

            // Se for aba "Cartão" e tivermos cartões mas nenhum selecionado, pega o primário
            if (type === 'compra' && !selectedCardId && primaryCardId) {
                setSelectedCardId(String(primaryCardId));
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
            toast.warning("Informe um valor maior que zero.")
            return
        }

        if (type === 'transferencia') {
            if (!accountId || !targetAccountId) return
            if (accountId === targetAccountId) {
                toast.warning("As contas de origem e destino devem ser diferentes.")
                return
            }
        } else {
            // Conta só é obrigatória se o seletor estiver visível (transações reais)
            if (showAccountSelector && !accountId) {
                toast.warning("Selecione uma conta bancária.")
                return
            }
            // Categoria é obrigatória se o seletor estiver visível
            if (showCategorySelector && !categoryId) {
                toast.warning("Selecione uma categoria.")
                return
            }
        }

        isSubmittingRef.current = true

        try {
            await onSubmit({
                type,
                amount: isRetroactive ? installmentAmount * (endInstallment - startInstallment + 1) : amount,
                description: description || (type === 'transferencia' ? 'Transferência' : ''),
                notes,
                accountId,
                targetAccountId,
                categoryId,
                subcategoryId,
                paymentMethodId,
                selectedCardId,
                installments: isRetroactive ? String(totalInstallments) : installments,
                date,
                isRetroactive,
                startInstallment,
                endInstallment
            })
        } catch (error: any) {
            toast.error(error.message || "Erro ao processar transação")
        } finally {
            isSubmittingRef.current = false
        }
    }

    const currentMethod = methods.find(m => m.id === paymentMethodId || m.slug === paymentMethodId)
    const isCreditCard = type === 'compra' || (currentMethod?.slug === 'credit_card' && type !== 'transferencia')

    // 🎯 FILTRO DE MODALIDADES CONFORME TIPO
    const filteredMethods = methods.filter(m => {
        if (!m.is_active) return false
        if (type === 'receita') return !!m.allows_income
        if (type === 'despesa') return !!m.allows_expense
        if (type === 'transferencia') return !!m.allows_transfer
        return true
    })

    return (
        <form id={formId} onSubmit={handleSubmit}>
            {/* SELETOR DE TIPO - Bloqueado em edição */}
            {showTypeSelector && (
                <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg mb-4">
                    {(mode === 'create' || type === 'despesa') && (
                        <button
                            type="button"
                            disabled={mode === 'edit'}
                            onClick={() => setType('despesa')}
                            className={cn(
                                "flex-1 h-11 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2",
                                type === 'despesa'
                                    ? "bg-white dark:bg-slate-700 text-red-600 shadow-sm border border-red-100 dark:border-red-900/30"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
                                mode === 'edit' && type !== 'despesa' && "hidden"
                            )}
                        >
                            <ArrowDownCircle className="w-4 h-4" /> Despesa
                        </button>
                    )}
                    {(mode === 'create' || type === 'receita') && (
                        <button
                            type="button"
                            disabled={mode === 'edit'}
                            onClick={() => setType('receita')}
                            className={cn(
                                "flex-1 h-11 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2",
                                type === 'receita'
                                    ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-sm border border-emerald-100 dark:border-emerald-900/30"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
                                mode === 'edit' && type !== 'receita' && "hidden"
                            )}
                        >
                            <ArrowUpCircle className="w-4 h-4" /> Receita
                        </button>
                    )}
                    {(mode === 'create' || type === 'transferencia') && (
                        <button
                            type="button"
                            disabled={mode === 'edit'}
                            onClick={() => {
                                if (!can('transfer_between_accounts')) {
                                    toast.warning("Transferências entre contas são exclusivas para planos Premium.")
                                    return
                                }
                                type !== 'transferencia' && setType('transferencia')
                            }}
                            className={cn(
                                "flex-1 h-11 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2",
                                type === 'transferencia'
                                    ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm border border-blue-100 dark:border-blue-900/30"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
                                mode === 'edit' && type !== 'transferencia' && "hidden"
                            )}
                        >
                            <ArrowLeftRight className="w-4 h-4" /> Transferir
                            {mode === 'create' && !can('transfer_between_accounts') && <Lock className="w-3 h-3 opacity-50" />}
                        </button>
                    )}
                    {(mode === 'create' || type === 'compra') && (
                        <button
                            type="button"
                            disabled={mode === 'edit'}
                            onClick={() => {
                                setType('compra');
                                // Tentar setar o paymentMethodId para o slug 'credit_card'
                                const cardMethod = methods.find(m => m.slug === 'credit_card');
                                if (cardMethod) setPaymentMethodId(cardMethod.id);
                                else setPaymentMethodId('credit_card');
                            }}
                            className={cn(
                                "flex-1 h-11 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2",
                                type === 'compra'
                                    ? "bg-white dark:bg-slate-700 text-orange-600 shadow-sm border border-orange-100 dark:border-orange-900/30"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
                                mode === 'edit' && type !== 'compra' && "hidden"
                            )}
                        >
                            <CreditCard className="w-4 h-4" /> Cartão
                        </button>
                    )}
                </div>
            )}

            <div className="grid gap-5 py-2">
                {/* VALOR E OPÇÃO DE RETROATIVO */}
                <div className="space-y-4">
                    {!isRetroactive ? (
                        <CurrencyInput
                            label="Valor"
                            value={amount}
                            onChange={setAmount}
                            required
                            autoFocus={mode === 'create'}
                            className="text-2xl h-14 font-bold"
                        />
                    ) : (
                        <div className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
                            <div className="flex items-center justify-between mb-2">
                                <Label className="text-xs font-bold uppercase text-blue-600 dark:text-blue-400">Lançamento Retroativo</Label>
                                <button type="button" onClick={() => setIsRetroactive(false)} className="text-xs text-slate-500 hover:underline">Alternar para comum</button>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <CurrencyInput
                                    label="Valor da Parcela"
                                    value={installmentAmount}
                                    onChange={setInstallmentAmount}
                                    required
                                    className="font-bold border-blue-200 dark:border-blue-900 h-11 text-lg"
                                />
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold uppercase text-slate-500">Total de Parcelas</Label>
                                    <Input
                                        type="number"
                                        value={totalInstallments}
                                        onChange={e => setTotalInstallments(Number(e.target.value))}
                                        className="h-11 border-blue-200 dark:border-blue-900"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold uppercase text-slate-500">Parcela Inicial</Label>
                                    <Input
                                        type="number"
                                        value={startInstallment}
                                        onChange={e => setStartInstallment(Number(e.target.value))}
                                        className="h-11 border-blue-200 dark:border-blue-900"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold uppercase text-slate-500">Parcela Final</Label>
                                    <Input
                                        type="number"
                                        value={endInstallment}
                                        onChange={e => setEndInstallment(Number(e.target.value))}
                                        className="h-11 border-blue-200 dark:border-blue-900"
                                    />
                                </div>
                            </div>

                            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                                <span className="text-xs text-slate-500 font-medium">Representa {(endInstallment - startInstallment + 1)} parcelas</span>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500 uppercase font-semibold leading-none mb-1">Total deste Lançamento</p>
                                    <p className="text-xl font-bold text-slate-900 dark:text-white">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(installmentAmount * (endInstallment - startInstallment + 1))}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {(mode === 'create' && !isRetroactive && (type === 'compra' || isCreditCard)) && (
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={() => setIsRetroactive(true)}
                                className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 uppercase tracking-wider"
                            >
                                <ArrowLeftRight className="w-3 h-3" /> Lançamento Parcelado Retroativo
                            </button>
                        </div>
                    )}
                </div>

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
                        className="h-11"
                    />
                </div>

                {/* CATEGORIA E SUBCATEGORIA - Só se não for transferência */}
                {type !== 'transferencia' && showCategorySelector && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase text-slate-500">Categoria</Label>
                            <Select value={categoryId} onValueChange={setCategoryId} required>
                                <SelectTrigger className="h-11 w-full">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories
                                        .filter(c => c.is_active || c.id === categoryId)
                                        .map(cat => (
                                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase text-slate-500">Subcategoria (Opcional)</Label>
                            <Select 
                                value={subcategoryId || "default"} 
                                onValueChange={(val) => setSubcategoryId(val === "default" ? "" : val)}
                                disabled={!categoryId}
                            >
                                <SelectTrigger className="h-11 w-full">
                                    <SelectValue placeholder="Geral" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="default">Geral</SelectItem>
                                    {subcategories
                                        .filter(s => s.is_active || s.id === subcategoryId)
                                        .map(sub => (
                                        <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}

                {/* CONTA E FORMA DE PAGAMENTO */}
                {type !== 'compra' && (showAccountSelector || showPaymentMethodSelector) && (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-300">
                        {showAccountSelector ? (
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase text-slate-500">
                                    {type === 'receita' ? 'Conta de Entrada' : type === 'despesa' ? 'Conta de Saída' : 'Conta de Origem'}
                                </Label>
                                <Select value={accountId} onValueChange={setAccountId} required={showAccountSelector}>
                                    <SelectTrigger className="h-11 w-full">
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {accounts.map(acc => (
                                            <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : <div />}

                        <div className="space-y-2">
                            {type === 'transferencia' ? (
                                <>
                                    <Label className="text-xs font-semibold uppercase text-slate-500">Conta de Destino</Label>
                                    <Select value={targetAccountId} onValueChange={setTargetAccountId} required>
                                        <SelectTrigger className="h-11 w-full">
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {accounts.filter(a => a.id !== accountId).map(acc => (
                                                <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </>
                            ) : showPaymentMethodSelector ? (
                                <>
                                    <Label className="text-xs font-semibold uppercase text-slate-500">Forma de Pagamento</Label>
                                    <Select 
                                        value={paymentMethodId || "default"} 
                                        onValueChange={(val) => setPaymentMethodId(val === "default" ? "" : val)}
                                    >
                                        <SelectTrigger className="h-11 w-full">
                                            <SelectValue placeholder="Opcional" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="default">Opcional</SelectItem>
                                            {filteredMethods.map(m => (
                                                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </>
                            ) : null}
                        </div>
                    </div>
                )}

                {/* DATA E EXTRAS */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase text-slate-500">{dateLabel}</Label>
                        <DatePicker
                            date={date ? new Date(date + 'T12:00:00') : undefined}
                            setDate={(d) => setDate(d ? format(d, 'yyyy-MM-dd') : "")}
                            required
                        />
                    </div>

                    {type === 'transferencia' ? (
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase text-slate-500">Método (Opcional)</Label>
                            <Select 
                                value={paymentMethodId || "default"} 
                                onValueChange={(val) => setPaymentMethodId(val === "default" ? "" : val)}
                            >
                                <SelectTrigger className="h-11 w-full">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="default">Selecione...</SelectItem>
                                    {filteredMethods.map(m => (
                                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ) : (isCreditCard && !isRetroactive) ? (
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase text-slate-500">Parcelas</Label>
                            <Select value={installments} onValueChange={setInstallments}>
                                <SelectTrigger className="h-11 w-full">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(i => (
                                        <SelectItem key={i} value={String(i)}>{i}x</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ) : null}
                </div>

                {/* CARTÃO DE CRÉDITO - SELECIONAR CARTÃO */}
                {isCreditCard && !initialData?.selectedCardId && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                        <Label className="text-xs font-semibold uppercase text-slate-500">Selecionar Cartão de Crédito</Label>
                        <Select value={selectedCardId} onValueChange={setSelectedCardId} required={isCreditCard}>
                            <SelectTrigger className="h-11 w-full mt-1">
                                <SelectValue placeholder="Escolha o cartão..." />
                            </SelectTrigger>
                            <SelectContent>
                                {creditCards.map((card) => {
                                    const isLocked = !can('unlimited_cards') && card.id !== primaryCardId
                                    return (
                                        <SelectItem key={card.id} value={card.id} disabled={isLocked}>
                                            {card.name} {isLocked ? "(Inativo)" : ""}
                                        </SelectItem>
                                    )
                                })}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            {/* OBSERVAÇÕES */}
            <div className="space-y-2 mt-2">
                <Label className="text-xs font-semibold uppercase text-slate-500">Observações (Notes)</Label>
                <Textarea
                    placeholder="Adicione detalhes adicionais sobre esta transação..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                />
            </div>

            {/* FOOTER COM BOTÕES - Só exibe se hideFooter for false */}
            {!hideFooter && (
                <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Button type="button" variant="ghost" onClick={onCancel} className="text-slate-500">
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className={cn(
                            "font-bold shadow-md min-w-[160px] h-11 transition-all active:scale-95",
                            type === 'receita' ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20' :
                                type === 'despesa' ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20' :
                                    'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                        )}
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        {isLoading ? (mode === 'create' ? 'Processando...' : 'Salvando...') : (mode === 'create' ? 'Confirmar Lançamento' : 'Salvar Alterações')}
                    </Button>
                </div>
            )}
        </form>
    )
}
