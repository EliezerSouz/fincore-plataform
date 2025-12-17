"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react"
import { getAccounts, Account } from "@/app/(protected)/caixa/accounts/actions"
import { getInvoiceDetails } from "@/app/(protected)/compromissos/cards/actions"
import { formatCurrency, cn } from "@/lib/utils"
import { getCategories, getSubcategories, updateTransaction, Category, Subcategory, Transaction } from "@/app/(protected)/caixa/transactions/actions"

interface EditTransactionDialogProps {
    transaction: Transaction
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditTransactionDialog({ transaction, open, onOpenChange }: EditTransactionDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const isSubmittingRef = useRef(false)
    const [type, setType] = useState<'receita' | 'despesa'>(transaction.type === 'transferencia' ? 'despesa' : transaction.type)

    // Listas
    const [accounts, setAccounts] = useState<Account[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [subcategories, setSubcategories] = useState<Subcategory[]>([])

    // Helper para data YYYY-MM-DD
    const formatDateForInput = (d: string) => {
        if (!d) return ""
        try {
            return new Date(d).toISOString().split('T')[0]
        } catch (e) {
            return ""
        }
    }

    // Form
    const [amount, setAmount] = useState(transaction.amount.toString())
    const [description, setDescription] = useState(transaction.description)
    const [accountId, setAccountId] = useState(transaction.account_id)
    const [categoryId, setCategoryId] = useState(transaction.category_id || "")
    const [subcategoryId, setSubcategoryId] = useState(transaction.subcategory_id || "")
    const [date, setDate] = useState(formatDateForInput(transaction.date))

    // Reset form when transaction changes
    useEffect(() => {
        if (open) {
            setAmount(transaction.amount.toString())
            setDescription(transaction.description)
            setType(transaction.type === 'transferencia' ? 'despesa' : transaction.type)
            setDate(formatDateForInput(transaction.date))
            setAccountId(transaction.account_id)
            setCategoryId(transaction.category_id || "")
            setSubcategoryId(transaction.subcategory_id || "")
            loadData(transaction.type === 'transferencia' ? 'despesa' : transaction.type)
        }
    }, [open, transaction])

    // Load subcategories when category changes
    useEffect(() => {
        if (categoryId) {
            getSubcategories(categoryId).then(setSubcategories)
        } else {
            setSubcategories([])
        }
    }, [categoryId])

    async function loadData(currentType: 'receita' | 'despesa') {
        const [accs, cats] = await Promise.all([
            getAccounts(),
            getCategories(currentType)
        ])
        setAccounts(accs)
        setCategories(cats)
    }

    // Handle type change
    async function handleTypeChange(newType: 'receita' | 'despesa') {
        setType(newType)
        setCategoryId("") // Clear category on type switch to avoid mismatch
        setSubcategoryId("")
        const cats = await getCategories(newType)
        setCategories(cats)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (isSubmittingRef.current) return
        if (!amount || !description || !accountId || !categoryId) return

        isSubmittingRef.current = true
        setIsLoading(true)
        try {
            const formData = new FormData()
            formData.append('description', description)
            formData.append('amount', amount)
            formData.append('type', type)
            formData.append('date', date)
            formData.append('accountId', accountId)
            formData.append('categoryId', categoryId)
            if (subcategoryId) formData.append('subcategoryId', subcategoryId)

            await updateTransaction(transaction.id, formData)

            onOpenChange(false)
            setTimeout(() => {
                window.location.reload()
            }, 300)
        } catch (error) {
            alert("Erro ao atualizar transação")
        } finally {
            setIsLoading(false)
            isSubmittingRef.current = false
        }
    }
    const [compositionData, setCompositionData] = useState<any>(null)

    // Load Invoice Composition if it's a credit card payment
    useEffect(() => {
        if (open && transaction.credit_card_invoice_id) {
            getInvoiceDetails(transaction.credit_card_invoice_id).then(data => {
                const invoice = data.invoice
                const payments = data.payments || []
                const rollover = data.rollover_amount || 0

                const paymentTotal = payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0)
                const fundsAvailable = paymentTotal + rollover
                const surplusNext = Math.max(0, fundsAvailable - invoice.total_amount)

                // Show if complex scenario AND paid
                if ((invoice.status === 'paid') && ((Math.abs(paymentTotal - invoice.total_amount) > 0.01) || (rollover > 0.01))) {
                    setCompositionData({
                        rollover,
                        totalInvoice: invoice.total_amount,
                        surplusNext,
                        paymentTotal
                    })
                } else {
                    setCompositionData(null)
                }
            }).catch(err => console.error("Error loading invoice details", err))
        } else {
            setCompositionData(null)
        }
    }, [open, transaction])

    // ... existing code ...

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            {/* ... icons ... */}
                            Editar Transação
                        </DialogTitle>
                        <DialogDescription>
                            Faça alterações na movimentação selecionada.
                        </DialogDescription>
                    </DialogHeader>

                    {/* PAYMENT COMPOSITION BLOCK */}
                    {compositionData && (
                        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                            <h4 className="uppercase font-bold tracking-wider opacity-70 mb-3 text-slate-500 dark:text-slate-400">
                                Composição do Pagamento
                            </h4>
                            <div className="space-y-2 font-medium text-slate-700 dark:text-slate-300">
                                {compositionData.rollover > 0.01 && (
                                    <div className="flex justify-between">
                                        <span className="opacity-80">Crédito fatura anterior</span>
                                        <span>{formatCurrency(compositionData.rollover)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="opacity-80">Valor da fatura</span>
                                    <span>{formatCurrency(compositionData.totalInvoice)}</span>
                                </div>
                                {compositionData.surplusNext > 0.01 && (
                                    <div className="flex justify-between text-amber-600 dark:text-amber-500 font-bold">
                                        <span className="opacity-90">Crédito para próxima fatura</span>
                                        <span>{formatCurrency(compositionData.surplusNext)}</span>
                                    </div>
                                )}

                                <div className="h-px bg-slate-200 dark:bg-slate-800 my-2"></div>

                                <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white">
                                    <span>Total pago (Banco)</span>
                                    <span>{formatCurrency(compositionData.paymentTotal)}</span>
                                </div>
                            </div>
                            {compositionData.surplusNext > 0 && (
                                <p className="text-[10px] text-slate-500 mt-2 leading-tight">
                                    O valor excedente foi convertido em crédito para a próxima fatura.
                                </p>
                            )}
                        </div>
                    )}
                    {/* ... existing types buttons ... */}
                    <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg mt-4 mb-4">
                        <button
                            type="button"
                            onClick={() => handleTypeChange('despesa')}
                            className={cn(
                                "flex-1 py-1.5 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2",
                                type === 'despesa'
                                    ? "bg-white dark:bg-slate-700 text-red-600 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            )}
                        >
                            <ArrowDownCircle className="w-4 h-4" /> Despesa
                        </button>
                        <button
                            type="button"
                            onClick={() => handleTypeChange('receita')}
                            className={cn(
                                "flex-1 py-1.5 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2",
                                type === 'receita'
                                    ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            )}
                        >
                            <ArrowUpCircle className="w-4 h-4" /> Receita
                        </button>
                    </div>

                    <div className="grid gap-4 py-2">
                        {/* VALOR E DESCRIÇÃO */}
                        <div className="grid grid-cols-4 gap-4">
                            <div className="col-span-4 space-y-2">
                                <Label className="text-xs font-semibold uppercase text-slate-500">Valor</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">R$</span>
                                    <Input
                                        type="number"
                                        placeholder="0,00"
                                        step="0.01"
                                        className="pl-10 text-xl font-bold h-12"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase text-slate-500">Descrição</Label>
                            <Input
                                placeholder="Dê um nome para esta transação..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                            />
                        </div>

                        {/* CATEGORIA E SUBCATEGORIA */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase text-slate-500">Categoria</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
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
                                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
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

                        {/* CONTA E DATA */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase text-slate-500">Conta</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
                                    value={accountId}
                                    onChange={(e) => setAccountId(e.target.value)}
                                    required
                                >
                                    <option value="">Selecione...</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase text-slate-500">Data</Label>
                                <Input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isLoading} className={type === 'receita' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}>
                            {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
