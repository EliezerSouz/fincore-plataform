"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updatePayable, Payable } from "./actions"
import { useRouter } from "next/navigation"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { getCategories, getSubcategories } from "@/app/(protected)/caixa/transactions/actions"
import * as Icons from "lucide-react"

interface EditPayableDialogProps {
    payable: Payable
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditPayableDialog({ payable, open, onOpenChange }: EditPayableDialogProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [categories, setCategories] = useState<any[]>([])
    const [subcategories, setSubcategories] = useState<any[]>([])

    // Corrigido para usar category_id adicionado na interface
    const [selectedCategory, setSelectedCategory] = useState<string>(payable.category_id || "")

    const [formData, setFormData] = useState({
        description: payable.description,
        amount: payable.amount,
        date: new Date(payable.due_date).toISOString().split('T')[0],
        categoryId: payable.category_id || "",
        subcategoryId: payable.subcategory_id || ""
    })

    useEffect(() => {
        if (open) {
            getCategories('despesa', true).then(setCategories)
        }
    }, [open])

    // Effect para carregar subcategorias quando categoria muda
    useEffect(() => {
        if (selectedCategory) {
            getSubcategories(selectedCategory, true).then(setSubcategories)
        } else {
            setSubcategories([])
        }
    }, [selectedCategory])

    // Atualiza form quando payable muda ou abre
    useEffect(() => {
        if (open && payable) {
            setSelectedCategory(payable.category_id || "")
            // Subcategories serão carregadas pelo effect acima quando selectedCategory mudar

            // Pequeno delay ou lógica para garantir que subcategories estejam carregadas antes de setar o valor no select?
            // O Select do Radix lida bem se o valor inicial não bater com as options (fica vazio e depois preenche).

            setFormData({
                description: payable.description,
                amount: payable.amount,
                date: new Date(payable.due_date).toISOString().split('T')[0],
                categoryId: payable.category_id || "",
                subcategoryId: payable.subcategory_id || ""
            })
        }
    }, [open, payable])

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)

        try {
            const data = new FormData(event.currentTarget)
            await updatePayable(payable.id, data)
            onOpenChange(false)
            router.refresh()
        } catch (e: any) {
            alert(e.message || 'Erro ao editar conta')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Editar Conta</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="description">Descrição</Label>
                        <Input
                            id="description"
                            name="description"
                            defaultValue={payable.description}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Valor (R$)</Label>
                            <Input
                                id="amount"
                                name="amount"
                                defaultValue={payable.amount}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="date">Vencimento</Label>
                            <Input
                                id="date"
                                name="date"
                                type="date"
                                defaultValue={new Date(payable.due_date).toISOString().split('T')[0]}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="categoryId">Categoria</Label>
                            <Select
                                value={selectedCategory}
                                onValueChange={(val) => {
                                    setSelectedCategory(val)
                                    setFormData(prev => ({ ...prev, categoryId: val, subcategoryId: "" }))
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {/* Input hidden para garantir envio no FormData se necessário, mas já estamos tratando manualmente */}
                            <input type="hidden" name="categoryId" value={selectedCategory} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="subcategoryId">Subcategoria</Label>
                            <Select
                                value={formData.subcategoryId}
                                onValueChange={(val) => setFormData(prev => ({ ...prev, subcategoryId: val }))}
                                disabled={!selectedCategory || subcategories.length === 0}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {subcategories.map((sub) => (
                                        <SelectItem key={sub.id} value={sub.id}>
                                            {sub.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <input type="hidden" name="subcategoryId" value={formData.subcategoryId} />
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <div className="w-full text-xs text-muted-foreground text-left">
                            <p>Editando apenas este lançamento.</p>
                        </div>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
