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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Plus, CalendarIcon, Lock } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { DatePicker } from "@/components/ui/date-picker"

// Actions
import { createTransaction, createTransfer, getCategories, getSubcategories, getPaymentMethods } from "./actions"
import { getAccounts } from "../accounts/actions"
import { getCreditCards } from "@/app/(protected)/compromissos/cards/actions"
import { usePermission } from "@/hooks/use-permission"
import { usePrimaryCard } from "@/hooks/use-primary-card"
import { useRouter } from "next/navigation"

export function CreateTransactionDialog({ onSuccess }: { onSuccess?: () => void }) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [accounts, setAccounts] = useState<any[]>([])
    const [creditCards, setCreditCards] = useState<any[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const [subcategories, setSubcategories] = useState<any[]>([])
    const [methods, setMethods] = useState<any[]>([])
    const { can } = usePermission()
    const { primaryCardId } = usePrimaryCard()

    // Form State
    const [type, setType] = useState<'receita' | 'despesa' | 'transferencia'>('despesa')
    const [date, setDate] = useState<Date | undefined>(new Date())

    // Transaction Fields
    const [selectedCategory, setSelectedCategory] = useState("")
    const [selectedAccount, setSelectedAccount] = useState("")
    const [paymentMethodId, setPaymentMethodId] = useState("")
    const [selectedCardId, setSelectedCardId] = useState("")
    const [installments, setInstallments] = useState("1")

    // Transfer Fields
    const [targetAccount, setTargetAccount] = useState("")

    useEffect(() => {
        if (open) {
            loadData()
            setDate(new Date())
            setType('despesa')
            setSelectedCategory("")
            setSelectedAccount("")
            setTargetAccount("")
            setPaymentMethodId("")
            setSelectedCardId("")
            setInstallments("1")
        }
    }, [open])

    useEffect(() => {
        if (selectedCategory) {
            getSubcategories(selectedCategory, true).then(setSubcategories)
        } else {
            setSubcategories([])
        }
    }, [selectedCategory])

    async function loadData() {
        const [accs, cats, payMethods, cards] = await Promise.all([
            getAccounts(true),
            getCategories(type === 'transferencia' ? undefined : type, true),
            getPaymentMethods(),
            getCreditCards()
        ])
        setAccounts(accs)
        setCategories(cats)
        setMethods(payMethods)
        setCreditCards(cards)

        if (accs.length > 0) {
            setSelectedAccount(accs[0].id)
            // Default target to second account if exists?
            if (accs.length > 1) setTargetAccount(accs[1].id)
        }
    }

    useEffect(() => {
        if (open) {
            // Se for transferencia, não necessariamente precisamos recarregar categorias se não formos mostrá-las
            // Mas se mostrarmos, ok.
            if (type !== 'transferencia') {
                getCategories(type, true).then(setCategories)
            }
            setSelectedCategory("")
        }
    }, [type, open])

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        try {
            const formData = new FormData()

            // Common Fields
            if (date) formData.set('date', format(date, 'yyyy-MM-dd'))
            formData.set('amount', (new FormData(e.currentTarget).get('amount') as string))
            const desc = new FormData(e.currentTarget).get('description') as string
            formData.set('description', desc || (type === 'transferencia' ? 'Transferência' : ''))

            // Payment Method
            if (paymentMethodId) {
                formData.set('paymentMethodId', paymentMethodId)
                const selectedMethod = methods.find(m => m.id === paymentMethodId)
                if (selectedMethod && selectedMethod.slug === 'credit_card' && type !== 'transferencia') {
                    if (!selectedCardId) throw new Error("Selecione um cartão de crédito")
                    formData.set('cardId', selectedCardId)
                    formData.set('installments', installments)
                    formData.set('paymentMethod', 'credit_card')

                    // Campos Retroativos
                    const nativeFormData = new FormData(e.currentTarget)
                    const startingInstallment = nativeFormData.get('startingInstallment') as string
                    const installmentValue = nativeFormData.get('installmentValue') as string

                    if (startingInstallment) formData.set('startingInstallment', startingInstallment)
                    if (installmentValue) formData.set('installmentValue', installmentValue)
                }
            }

            if (type === 'transferencia') {
                if (!selectedAccount) throw new Error("Selecione a conta de origem")
                if (!targetAccount) throw new Error("Selecione a conta de destino")
                if (selectedAccount === targetAccount) throw new Error("As contas devem ser diferentes")

                formData.set('sourceAccountId', selectedAccount)
                formData.set('targetAccountId', targetAccount)

                await createTransfer(formData)
            } else {
                // Standard Transaction
                let accId = selectedAccount
                if (!accId && accounts.length > 0) accId = accounts[0].id

                formData.set('type', type)
                formData.set('accountId', accId)
                if (selectedCategory) formData.set('categoryId', selectedCategory)

                const nativeFormData = new FormData(e.currentTarget)
                const subCatValue = nativeFormData.get('subcategoryId') as string
                if (subCatValue) formData.set('subcategoryId', subCatValue)

                if (!paymentMethodId) formData.set('paymentMethod', 'outros')

                // Card logic handled above? No, createTransaction expects 'paymentMethod' field if method is set.
                // Re-verify logic.
                // Existing logic set 'paymentMethod' to slug.
                if (paymentMethodId) {
                    const selectedMethod = methods.find(m => m.id === paymentMethodId)
                    if (selectedMethod) formData.set('paymentMethod', selectedMethod.slug)
                }

                if (!formData.get('accountId')) throw new Error("Selecione uma conta")

                await createTransaction(formData)
            }

            setOpen(false)
            router.refresh()
            onSuccess?.()
        } catch (err: any) {
            alert(err.message || "Erro ao criar transação")
        } finally {
            setLoading(false)
        }
    }

    const isCreditCard = methods.find(m => m.id === paymentMethodId)?.slug === 'credit_card' && type !== 'transferencia'

    const filteredMethods = methods.filter(m => {
        if (type === 'receita') return m.allows_income
        if (type === 'despesa') return m.allows_expense
        if (type === 'transferencia') return m.allows_expense // Transfer starts as expense
        return true
    })

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    size="sm"
                    className="gap-2 font-medium shadow-sm transition-all hover:scale-[1.02] active:scale-95"
                    variant="default"
                    suppressHydrationWarning
                >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Nova Transação</span>
                    <span className="sm:hidden">Nova</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{type === 'transferencia' ? 'Nova Transferência' : 'Nova Transação'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <Tabs value={type} onValueChange={(v) => {
                        if (v === 'transferencia' && !can('transfer_between_accounts')) {
                            alert("Transferências entre contas são exclusivas para planos Premium.")
                            return
                        }
                        setType(v as any)
                    }} className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="despesa" className="data-[state=active]:bg-red-50 data-[state=active]:text-red-600">Despesa</TabsTrigger>
                            <TabsTrigger value="receita" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-600">Receita</TabsTrigger>
                            <TabsTrigger value="transferencia" className="items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
                                Transferência
                                {!can('transfer_between_accounts') && <Lock className="w-3 h-3" />}
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Valor</Label>
                            <Input name="amount" placeholder="0,00" required className="text-lg font-bold" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="date">Data</Label>
                            <DatePicker
                                id="date"
                                date={date}
                                setDate={setDate}
                                required
                            />
                        </div>
                    </div>

                    {type !== 'transferencia' && (
                        <div className="space-y-2">
                            <Label>Descrição</Label>
                            <Input name="description" placeholder="Ex: Compras no Mercado" required />
                        </div>
                    )}

                    {type !== 'transferencia' ? (
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
                                <Select name="subcategoryId" disabled={!selectedCategory || subcategories.length === 0}>
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
                    ) : null}

                    {type === 'transferencia' ? (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>De (Origem)</Label>
                                <Select value={selectedAccount} onValueChange={setSelectedAccount} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {accounts.map(a => (
                                            <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Para (Destino)</Label>
                                <Select value={targetAccount} onValueChange={setTargetAccount} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {accounts.filter(a => a.id !== selectedAccount).map(a => (
                                            <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    ) : (
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
                            {!isCreditCard && (
                                <div className="space-y-2">
                                    <Label>Método</Label>
                                    <Select name="paymentMethodId" value={paymentMethodId} onValueChange={setPaymentMethodId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredMethods.map(m => (
                                                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Payment Method for Transfer - show it below accounts? */}
                    {type === 'transferencia' && (
                        <div className="space-y-2">
                            <Label>Método de Transferência</Label>
                            <Select name="paymentMethodId" value={paymentMethodId} onValueChange={setPaymentMethodId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Ex: Pix, TED..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredMethods.map(m => (
                                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}


                    {isCreditCard && (
                        <div className="space-y-4 animate-in fade-in duration-300">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Cartão</Label>
                                    <Select value={selectedCardId} onValueChange={setSelectedCardId} required={isCreditCard}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Escolha..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {creditCards.map((card) => {
                                                const isLocked = !can('unlimited_cards') && card.id !== primaryCardId
                                                return (
                                                    <SelectItem key={card.id} value={card.id} disabled={isLocked} className={cn(isLocked && "opacity-50 line-through")}>
                                                        {card.name} {isLocked && "(Inativo)"}
                                                    </SelectItem>
                                                )
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Total de Parcelas</Label>
                                    <Select value={installments} onValueChange={setInstallments} required={isCreditCard}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="1x" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Array.from({ length: 12 }, (_, i) => i + 1).map(i => {
                                                const isRestricted = !can('unlimited_installments') && i > 3
                                                return (
                                                    <SelectItem key={i} value={String(i)} disabled={isRestricted} className={cn(isRestricted && "opacity-50")}>
                                                        {i}x {isRestricted && '(Premium)'}
                                                    </SelectItem>
                                                )
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Campos Retroativos */}
                            {parseInt(installments) > 1 && (
                                <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-900/20 space-y-3">
                                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 text-sm font-medium">
                                        <span>📅</span>
                                        <span>Lançamento Retroativo (Opcional)</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <Label className="text-xs">Começar da Parcela</Label>
                                            <Select name="startingInstallment" defaultValue="1">
                                                <SelectTrigger className="h-9">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Array.from({ length: parseInt(installments) }, (_, i) => i + 1).map(i => (
                                                        <SelectItem key={i} value={String(i)}>
                                                            Parcela {i}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs">Valor por Parcela</Label>
                                            <Input
                                                name="installmentValue"
                                                placeholder="Auto"
                                                className="h-9 text-xs"
                                            />
                                        </div>
                                    </div>

                                    <p className="text-[10px] text-muted-foreground">
                                        💡 <strong>Exemplo:</strong> Compra de R$ 600 em 6x. Já pagou 3 faturas?
                                        Comece da parcela 4 e informe R$ 100 por parcela. Serão criadas apenas as parcelas 4, 5 e 6.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}


                    {/* Method for Standard (Credit Card specific UI structure match) */}
                    {type !== 'transferencia' && isCreditCard && (
                        <div className="space-y-2">
                            <Label>Método</Label>
                            <Select name="paymentMethodId" value={paymentMethodId} onValueChange={setPaymentMethodId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredMethods.map(m => (
                                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="pt-4 flex justify-end">
                        <Button type="submit" disabled={loading} className="w-full" variant="success">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Confirmar
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
