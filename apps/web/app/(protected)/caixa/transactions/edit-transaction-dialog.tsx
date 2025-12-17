"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, CalendarIcon, AlertCircle, Lock } from "lucide-react"
import { ptBR } from "date-fns/locale"

import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

import { updateTransaction, getCategories, getSubcategories, getPaymentMethods } from "./actions"
import { getAccounts } from "../accounts/actions"

interface EditTransactionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    transaction: any
}

export function EditTransactionDialog({ open, onOpenChange, transaction }: EditTransactionDialogProps) {
    const [loading, setLoading] = useState(false)
    const [accounts, setAccounts] = useState<any[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const [subcategories, setSubcategories] = useState<any[]>([])
    const [methods, setMethods] = useState<any[]>([])

    // Helper para evitar problemas de timezone com datas YYYY-MM-DD
    const parseDate = (dateString: string) => {
        if (!dateString) return new Date();
        // Assume formato YYYY-MM-DD
        const parts = dateString.split('-');
        if (parts.length === 3) {
            const year = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1;
            const day = parseInt(parts[2]);
            return new Date(year, month, day, 12, 0, 0);
        }
        return new Date(dateString); // Fallback
    }

    // Form State
    const [type, setType] = useState<'receita' | 'despesa'>(transaction.type)
    const [date, setDate] = useState<Date | undefined>(transaction.date ? parseDate(transaction.date) : new Date())
    const [selectedAccount, setSelectedAccount] = useState(transaction.account_id)
    const [selectedCategory, setSelectedCategory] = useState(transaction.category_id || "")

    // Payment Method handling (ID preferred, Fallback to slug lookup)
    const [paymentMethodId, setPaymentMethodId] = useState(transaction.payment_method_id || "")

    const isTransfer = !!transaction.related_transaction_id || transaction.category?.name === 'Transferência'

    // Carregar dados iniciais ao abrir
    useEffect(() => {
        if (open) {
            loadData()
        }
    }, [open])

    async function loadData() {
        // Carrega tudo independente do tipo inicial para ter cache ou carrega baseado no tipo atual?
        // Melhor carregar baseado no tipo atual.
        const [accs, cats, payMethods] = await Promise.all([
            getAccounts(true), // Filtrar apenas Ativas
            getCategories(transaction.type, true), // Usa o tipo original da transação inicialmente
            getPaymentMethods()
        ])
        setAccounts(accs)
        setCategories(cats)
        setMethods(payMethods)

        // Reset fields to transaction values
        setType(transaction.type)
        setDate(transaction.date ? parseDate(transaction.date) : new Date())
        setSelectedAccount(transaction.account_id)
        setSelectedCategory(transaction.category_id || "")

        // Resolve Payment Method ID
        if (transaction.payment_method_id) {
            setPaymentMethodId(transaction.payment_method_id)
        } else if (transaction.payment_method) {
            // Tenta encontrar pelo slug se não tiver ID
            const found = payMethods.find((m: any) => m.slug === transaction.payment_method)
            if (found) setPaymentMethodId(found.id)
            else setPaymentMethodId("") // ou 'outros' id se soubessemos
        } else {
            setPaymentMethodId("")
        }
    }
    // Effect para recarregar categorias quando o usuário troca o TIPO
    useEffect(() => {
        if (!open) return

        // Carregar categorias do novo tipo
        getCategories(type, true).then(cats => {
            setCategories(cats)

            // Lógica para limpar ou manter a categoria selecionada
            // Se o tipo mudou em relação ao original da transação, limpamos a seleção para forçar nova escolha
            if (type !== transaction.type) {
                setSelectedCategory("")
                setSubcategories([])
            } else {
                // Se voltou para o tipo original, restaura a categoria original
                setSelectedCategory(transaction.category_id || "")
            }
        })
    }, [type, open, transaction.type, transaction.category_id])

    useEffect(() => {
        if (selectedCategory) {
            getSubcategories(selectedCategory, true).then(setSubcategories)
        } else {
            setSubcategories([])
        }
    }, [selectedCategory])

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        try {
            const formData = new FormData()

            if (date) formData.set('date', format(date, 'yyyy-MM-dd'))
            formData.set('type', type)
            formData.set('accountId', selectedAccount)
            formData.set('categoryId', selectedCategory)

            const nativeFormData = new FormData(e.currentTarget)
            const subCatValue = nativeFormData.get('subcategoryId') as string
            if (subCatValue) formData.set('subcategoryId', subCatValue)

            formData.set('description', nativeFormData.get('description') as string)
            formData.set('amount', nativeFormData.get('amount') as string)

            // Payment Method Logic
            if (paymentMethodId) {
                formData.set('paymentMethodId', paymentMethodId)
                const selectedMethod = methods.find(m => m.id === paymentMethodId)
                if (selectedMethod) {
                    formData.set('paymentMethod', selectedMethod.slug)
                }
            } else {
                formData.set('paymentMethod', 'outros')
            }

            console.log("Submitting update for:", transaction.id)
            await updateTransaction(transaction.id, formData)
            onOpenChange(false)
        } catch (err: any) {
            console.error("Update error:", err)
            alert(err.message || "Erro ao atualizar")
        } finally {
            setLoading(false)
        }
    }

    // Filtragem de métodos
    const filteredMethods = methods.filter(m => {
        if (type === 'receita') return m.allows_income
        if (type === 'despesa') return m.allows_expense
        return true
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{isTransfer ? 'Editar Transferência' : 'Editar Transação'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    {/* Tabs */}
                    {isTransfer ? (
                        <div className="w-full flex items-center justify-center p-2 bg-blue-50 text-blue-700 rounded-md font-medium gap-2">
                            <Lock className="w-4 h-4" />
                            Transferência
                        </div>
                    ) : (
                        <Tabs value={type} onValueChange={(v) => setType(v as any)} className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="despesa" className="data-[state=active]:bg-red-50 data-[state=active]:text-red-600">Despesa</TabsTrigger>
                                <TabsTrigger value="receita" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-600">Receita</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    )}

                    {isTransfer && (
                        <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 p-3 rounded-md">
                            <AlertCircle className="w-4 h-4" />
                            Alterações de valor e data serão aplicadas nas duas contas.
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Valor</Label>
                            <Input name="amount" defaultValue={transaction.amount?.toFixed(2).replace('.', ',')} placeholder="0,00" required className="text-lg font-bold" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="date">Data</Label>
                            <Input
                                id="date"
                                type="date"
                                required
                                value={date ? format(date, 'yyyy-MM-dd') : ''}
                                onChange={(e) => {
                                    if (!e.target.value) {
                                        setDate(undefined)
                                        return
                                    }
                                    const [y, m, d] = e.target.value.split('-').map(Number)
                                    setDate(new Date(y, m - 1, d, 12, 0, 0))
                                }}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Input name="description" defaultValue={transaction.description} placeholder="Descrição" required />
                    </div>

                    {/* Category - Hide if transfer */}
                    {!isTransfer && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Categoria</Label>
                                <Select name="categoryId" value={selectedCategory} onValueChange={setSelectedCategory} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(c => (
                                            <SelectItem key={c.id} value={c.id}>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                                                    {c.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Subcategoria</Label>
                                <Select name="subcategoryId" defaultValue={transaction.subcategory_id} disabled={!selectedCategory || subcategories.length === 0}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Opcional" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {subcategories.map(s => (
                                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Conta</Label>
                            <Select name="accountId" value={selectedAccount} onValueChange={setSelectedAccount} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Conta" />
                                </SelectTrigger>
                                <SelectContent>
                                    {accounts.map(a => (
                                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Método</Label>
                            <Select name="paymentMethodId" value={paymentMethodId} onValueChange={setPaymentMethodId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredMethods.length > 0 ? (
                                        filteredMethods.map(m => (
                                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                        ))
                                    ) : (
                                        <SelectItem value="empty" disabled>Nenhum método disponível</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Salvar Alterações
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
