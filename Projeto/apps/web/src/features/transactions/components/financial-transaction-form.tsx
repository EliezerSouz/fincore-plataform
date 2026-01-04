"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowDownCircle, ArrowLeftRight, ArrowUpCircle, Lock, Loader2, CreditCard, RefreshCw, Info } from "lucide-react"
import { getAccounts, Account } from "@/app/(protected)/caixa/accounts/actions"
import { getCategories, getSubcategories, getPaymentMethods, getInitialTransactionData, Category, Subcategory } from "@/app/(protected)/caixa/transactions/actions"
import { getCreditCards } from "@/app/(protected)/compromissos/cards/actions"
import { getPockets, getParentAccounts } from "@/features/pockets/actions"
import { Pocket, ParentAccount } from "@/types/pockets"
import { usePermission } from "@/hooks/use-permission"
import { useUser } from "@/providers/user-provider"
import { usePrimaryCard } from "@/hooks/use-primary-card"
import { cn } from "@/lib/utils"
import { CurrencyInput } from "@/components/ui/currency-input"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { toast } from "sonner"
import { useFormData } from "@/hooks/use-form-data"
import { useQuery } from "@tanstack/react-query" // Added import

export interface FinancialTransactionFormData {
    type: 'receita' | 'despesa' | 'transferencia' | 'compra'
    amount: number
    description: string
    notes?: string
    accountId?: string // Deprecated, kept for retro-compatibility
    targetAccountId?: string // Deprecated
    pocketId?: string
    targetPocketId?: string
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
    const { can, plan } = usePermission()
    const { primaryCardId } = usePrimaryCard()
    const { refreshUser } = useUser()

    // Force refresh user data on mount to ensure permissions are up to date
    useEffect(() => {
        refreshUser()
    }, [])

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
    // isLoadingInitialData (state removido em favor de React Query)

    // React Query para buscar dados iniciais com Cache (Top Level para Hydration)
    const { data: serverData, isLoading: isLoadingQuery } = useQuery({
        queryKey: ['initialTransactionData'],
        queryFn: getInitialTransactionData,
        staleTime: 1000 * 30, // 30 segundos de cache fresco
        refetchOnWindowFocus: true
    })

    // Preparar dados para hidratar o hook useFormData
    const initialFormData = useMemo(() => {
        if (!serverData) return undefined
        return {
            categories: serverData.categories,
            paymentMethods: serverData.paymentMethods,
            accounts: serverData.accounts
        }
    }, [serverData])

    // Listas - AGORA COM CACHE
    const [accounts, setAccounts] = useState<Account[]>([]) // Mantendo accounts por compatibilidade temporária
    const [pockets, setPockets] = useState<Pocket[]>([])
    const [parentAccounts, setParentAccounts] = useState<ParentAccount[]>([])
    const [creditCards, setCreditCards] = useState<any[]>([])

    // Pocket States
    const [pocketId, setPocketId] = useState(initialData?.pocketId || "")
    const [targetPocketId, setTargetPocketId] = useState(initialData?.targetPocketId || "")

    // Hook com cache para categorias, subcategorias e métodos de pagamento
    // Passa initialData vindo do React Query para evitar request extra
    const formDataCache = useFormData({
        transactionType: type,
        initialData: initialFormData
    })

    // Usar dados do cache
    const categories = formDataCache.categories
    const subcategories = formDataCache.subcategories
    const methods = formDataCache.paymentMethods

    // Resetar Retroativo quando o tipo mudar
    useEffect(() => {
        if (type !== 'compra') {
            setIsRetroactive(false)
        }
    }, [type])

    // Atualizar categoria selecionada no cache quando mudar
    useEffect(() => {
        formDataCache.setSelectedCategory(categoryId)
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
            if (initialData.pocketId !== undefined) setPocketId(initialData.pocketId)
            if (initialData.targetPocketId !== undefined) setTargetPocketId(initialData.targetPocketId)
            if (initialData.categoryId !== undefined) setCategoryId(initialData.categoryId)
            if (initialData.subcategoryId !== undefined) setSubcategoryId(initialData.subcategoryId)
            if (initialData.paymentMethodId !== undefined) setPaymentMethodId(initialData.paymentMethodId)
            if (initialData.selectedCardId !== undefined) setSelectedCardId(initialData.selectedCardId)
            if (initialData.installments !== undefined) setInstallments(initialData.installments)
            if (initialData.date !== undefined) setDate(initialData.date.split('T')[0])
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

    // Sincronizar dados do Server com Estado Local
    useEffect(() => {
        if (serverData) {
            const { accounts: accs, cards, pockets: pocketsList, parents } = serverData

            setAccounts(accs || [])
            setCreditCards(cards || [])
            setPockets(pocketsList || [])
            setParentAccounts(parents || [])

            // Lógica de pré-seleção para CREATE mode
            if (mode === 'create' && pocketsList && pocketsList.length > 0 && !pocketId) {
                // Default to first pocket of first parent if available, or just first pocket
                const caixa = pocketsList.find((p: any) => p.pocket_type === 'CAIXA')
                if (caixa) setPocketId(caixa.id)
                else setPocketId(pocketsList[0].id)
            }

            // Se for aba "Cartão" e tivermos cartões mas nenhum selecionado
            if (type === 'compra' && !selectedCardId && primaryCardId) {
                setSelectedCardId(String(primaryCardId));
            }
        }
    }, [serverData, mode, pocketId, selectedCardId, primaryCardId, type])

    // Loading State Aggregation
    // Se isLoadingQuery for true, estamos buscando dados iniciais no server.
    // Se formDataCache.loading for true (e não tiver initialData), estamos buscando cats/methods.
    const isLoadingData = isLoadingQuery || (!initialFormData && formDataCache.loading)

    // (Removido loadInitialData manual)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        console.log('🔵 Form submitted!', { type, amount, description, categoryId, selectedCardId })

        if (isSubmittingRef.current) {
            console.log('⚠️ Already submitting, skipping...')
            return
        }
        // Validação básica
        const valueToCheck = isRetroactive ? installmentAmount : amount
        if (!valueToCheck || valueToCheck <= 0) {
            toast.warning("Informe um valor maior que zero.")
            return
        }

        if (type === 'transferencia') {
            if (!pocketId || !targetPocketId) {
                // Fallback check for old accountId if needed, but we prefer pockets now
                if (!accountId && !targetAccountId) return
            }
            if (pocketId && targetPocketId && pocketId === targetPocketId) {
                toast.warning("Os pockets de origem e destino devem ser diferentes.")
                return
            }
        } else {
            // Conta/Pocket só é obrigatória se o seletor estiver visível (transações reais)
            if (showAccountSelector && !pocketId && !accountId) {
                toast.warning("Selecione um pocket (conta).")
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
                pocketId,
                targetPocketId,
                accountId, // Legacy/Fallback
                targetAccountId, // Legacy/Fallback
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
    // O backend já filtra por tipo se passarmos o parametro, mas mantemos o filtro client-side por segurança e reatividade imediata
    const filteredMethods = methods.filter(m => {
        if (!m.is_active) return false
        // Se a lista veio do backend filtrada, ela já está correta. 
        // Mas se mudamos o tipo rapidamente e o request ainda não voltou, este filtro ajuda.
        if (type === 'receita') return !!m.allows_income
        if (type === 'despesa') return !!m.allows_expense
        if (type === 'transferencia') return !!m.allows_transfer
        return true
    })

    if (isLoadingData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-slate-100 dark:border-slate-800"></div>
                    <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                </div>
                <p className="text-sm font-medium text-slate-500 animate-pulse">Carregando informações...</p>
            </div>
        )
    }

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
                                // LIBERADO GERAL: Bloqueio removido temporariamente para debug
                                // if (!can('transfer_between_accounts')) {
                                //     toast.warning(`Transferências entre contas são exclusivas para planos Premium. (Plano atual: ${plan})`)
                                //     return
                                // }
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
                                        .filter(c => (!c.is_premium || can('manage_categories')) && (c.is_active || c.id === categoryId))
                                        .map(cat => (
                                            <SelectItem key={cat.id} value={cat.id}>
                                                <span className="flex items-center gap-2">
                                                    {cat.name}
                                                    {cat.type === 'ambas' && <span className="text-[10px] bg-blue-100 text-blue-600 px-1 rounded">H</span>}
                                                </span>
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                            {categoryId && categories.find(c => c.id === categoryId)?.type === 'ambas' && (
                                <p className="text-[10px] text-blue-500 mt-1 flex items-center gap-1">
                                    <Info className="w-3 h-3" />
                                    Categoria híbrida: utilizada para Receitas e Despesas
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold uppercase text-slate-500">Subcategoria (Opcional)</Label>
                                { /* Botão Refresh removido pois o carregamento é automático via hook */}
                            </div>
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
                                    {type === 'receita' ? 'Pocket de Entrada' : type === 'despesa' ? 'Pocket de Saída' : 'Pocket de Origem'}
                                </Label>
                                <Select value={pocketId} onValueChange={setPocketId} required={showAccountSelector}>
                                    <SelectTrigger className="h-11 w-full">
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {parentAccounts.map(parent => {
                                            // Filtra pockets conforme o tipo de transação
                                            // Se for Receita/Despesa/Compra, mostra apenas CAIXA (Conta Corrente)
                                            // Se for Transferência, mostra todos (Caixa e Reservas)
                                            const parentPockets = pockets.filter(p => {
                                                if (p.parent_account_id !== parent.id) return false
                                                if (type !== 'transferencia' && p.pocket_type !== 'CAIXA') return false
                                                return true
                                            })

                                            if (parentPockets.length === 0) return null
                                            return (
                                                <div key={parent.id}>
                                                    {/* Ocultamos o header do grupo pois o nome da instituição já estará no item,
                                                        mas mantemos o div para estrutura ou usamos SelectGroup se quisermos o header visual.
                                                        Como o usuario pediu "aparecer nome da instituição", vamos colocar no item para ficar visivel quando selecionado. */}

                                                    {parentPockets.map(pocket => {
                                                        const isDefaultName = ['Conta Corrente', 'General', 'Principal', 'Caixa'].includes(pocket.name)
                                                        const displayName = isDefaultName ? parent.institution_name : `${parent.institution_name} - ${pocket.name}`

                                                        return (
                                                            <SelectItem key={pocket.id} value={pocket.id}>
                                                                {displayName}
                                                                {pocket.pocket_type !== 'CAIXA' && <span className="text-[10px] ml-2 text-slate-400 border border-slate-200 rounded px-1">{pocket.pocket_type === 'RESERVA_CDI' ? 'Reserva' : 'Inv.'}</span>}
                                                            </SelectItem>
                                                        )
                                                    })}
                                                </div>
                                            )
                                        })}
                                        {/* Pockets sem pai (fallback) - aplica o mesmo filtro */}
                                        {pockets.filter(p => !p.parent_account_id && (type === 'transferencia' || p.pocket_type === 'CAIXA')).length > 0 && (
                                            <div>
                                                <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 bg-slate-50 dark:bg-slate-900/50">Outros</div>
                                                {pockets.filter(p => !p.parent_account_id && (type === 'transferencia' || p.pocket_type === 'CAIXA')).map(pocket => (
                                                    <SelectItem key={pocket.id} value={pocket.id}>
                                                        {pocket.name}
                                                        {pocket.pocket_type !== 'CAIXA' && <span className="text-[10px] ml-2 text-slate-400 border border-slate-200 rounded px-1">{pocket.pocket_type === 'RESERVA_CDI' ? 'Reserva' : 'Inv.'}</span>}
                                                    </SelectItem>
                                                ))}
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : <div />}

                        <div className="space-y-2">
                            {type === 'transferencia' ? (
                                <>
                                    <Label className="text-xs font-semibold uppercase text-slate-500">Pocket de Destino</Label>
                                    <Select value={targetPocketId} onValueChange={setTargetPocketId} required>
                                        <SelectTrigger className="h-11 w-full">
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {parentAccounts.map(parent => {
                                                const parentPockets = pockets.filter(p => p.parent_account_id === parent.id && p.id !== pocketId)
                                                if (parentPockets.length === 0) return null
                                                return (
                                                    <div key={parent.id}>
                                                        {parentPockets.map(pocket => {
                                                            const isDefaultName = ['Conta Corrente', 'General', 'Principal', 'Caixa'].includes(pocket.name)
                                                            const displayName = isDefaultName ? parent.institution_name : `${parent.institution_name} - ${pocket.name}`

                                                            return (
                                                                <SelectItem key={pocket.id} value={pocket.id}>
                                                                    {displayName}
                                                                    {pocket.pocket_type !== 'CAIXA' && <span className="text-[10px] ml-2 text-slate-400 border border-slate-200 rounded px-1">{pocket.pocket_type === 'RESERVA_CDI' ? 'Reserva' : 'Inv.'}</span>}
                                                                </SelectItem>
                                                            )
                                                        })}
                                                    </div>
                                                )
                                            })}
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
                                            {filteredMethods.length === 0 ? (
                                                <SelectItem value="none" disabled>Nenhum disponível</SelectItem>
                                            ) : (
                                                filteredMethods.map(m => (
                                                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                                ))
                                            )}
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
                                    {filteredMethods.length === 0 ? (
                                        <SelectItem value="none" disabled>Nenhum disponível</SelectItem>
                                    ) : (
                                        filteredMethods.map(m => (
                                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                        ))
                                    )}
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
