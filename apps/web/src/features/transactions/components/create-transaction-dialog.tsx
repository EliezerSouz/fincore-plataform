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
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowDownCircle, ArrowUpCircle, Calendar, Plus, Wallet } from "lucide-react"
import { getAccounts, Account } from "@/app/(protected)/caixa/accounts/actions"
import { getCategories, getSubcategories, createTransaction, Category, Subcategory } from "@/app/(protected)/caixa/transactions/actions"
import { cn } from "@/lib/utils"
import { CreateButton } from "@/components/ui/create-button"

interface CreateTransactionDialogProps {
    onSuccess?: () => void
}

export function CreateTransactionDialog({ onSuccess }: CreateTransactionDialogProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [type, setType] = useState<'receita' | 'despesa'>('despesa')

    // Listas
    const [accounts, setAccounts] = useState<Account[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [subcategories, setSubcategories] = useState<Subcategory[]>([])

    // Form
    const [amount, setAmount] = useState("")
    const [description, setDescription] = useState("")
    const [accountId, setAccountId] = useState("")
    const [categoryId, setCategoryId] = useState("")
    const [subcategoryId, setSubcategoryId] = useState("")
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])

    // Carregar dados iniciais
    useEffect(() => {
        if (open) {
            loadData()
        }
    }, [open, type])

    // Carregar subcategorias quando categoria mudar
    useEffect(() => {
        if (categoryId) {
            getSubcategories(categoryId).then(setSubcategories)
        } else {
            setSubcategories([])
        }
    }, [categoryId])

    async function loadData() {
        const [accs, cats] = await Promise.all([
            getAccounts(),
            getCategories(type)
        ])
        setAccounts(accs)
        setCategories(cats)

        // Selecionar conta padrão se houver
        if (accs.length > 0 && !accountId) setAccountId(accs[0].id)
    }

    const isSubmittingRef = useRef(false)

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

            await createTransaction(formData)

            onSuccess?.()
            setOpen(false)
            resetForm()
            setTimeout(() => {
                window.location.reload()
            }, 300)
        } catch (error) {
            alert("Erro ao criar transação")
        } finally {
            setIsLoading(false)
            isSubmittingRef.current = false
        }
    }

    function resetForm() {
        setAmount("")
        setDescription("")
        setCategoryId("")
        setSubcategoryId("")
        setDate(new Date().toISOString().split('T')[0])
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <CreateButton label="Nova Transação" />
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            {type === 'despesa' ? (
                                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400">
                                    <ArrowDownCircle className="w-5 h-5" />
                                </div>
                            ) : (
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-600 dark:text-emerald-400">
                                    <ArrowUpCircle className="w-5 h-5" />
                                </div>
                            )}
                            Nova {type === 'despesa' ? 'Despesa' : 'Receita'}
                        </DialogTitle>
                        <DialogDescription>
                            Registre uma nova movimentação financeira.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg mt-4 mb-4">
                        <button
                            type="button"
                            onClick={() => setType('despesa')}
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
                            onClick={() => setType('receita')}
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
                                placeholder={type === 'despesa' ? "Ex: Padaria, Uber, Netflix..." : "Ex: Salário, Freela..."}
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
                                <Label className="text-xs font-semibold uppercase text-slate-500">Conta de {type === 'receita' ? 'Entrada' : 'Saída'}</Label>
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
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isLoading} className={type === 'receita' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}>
                            {isLoading ? 'Salvando...' : 'Confirmar Transação'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
