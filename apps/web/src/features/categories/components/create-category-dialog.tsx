"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CreateButton } from "@/components/ui/create-button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { createCategory } from "@/app/(protected)/caixa/categories/actions"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { usePermission } from "@/hooks/use-permission"
import { Lock, Crown, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { UpsellModal } from "@/components/ui/upsell-modal"
import { CATEGORY_ICONS } from "@/lib/icons"

const COLORS = [
    '#94a3b8', // slate
    '#ef4444', // red
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#ec4899', // pink
]

export function CreateCategoryDialog() {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const { can } = usePermission()

    const [name, setName] = useState("")
    const [type, setType] = useState<'receita' | 'despesa'>('despesa')
    const [color, setColor] = useState(COLORS[0])
    const [icon, setIcon] = useState('tag')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!name) return

        setIsLoading(true)
        try {
            const formData = new FormData()
            formData.append('name', name)
            formData.append('type', type)
            formData.append('color', color)
            formData.append('icon', icon)

            await createCategory(formData)

            setOpen(false)
            resetForm()
        } catch (error) {
            alert("Erro ao criar categoria")
        } finally {
            setIsLoading(false)
        }
    }

    function resetForm() {
        setName("")
        setColor(COLORS[0])
        setIcon('tag')
    }

    // Se NÃO puder gerenciar categorias (Plano Free), mostra o Upsell
    if (!can('manage_categories')) {
        return (
            <UpsellModal
                trigger={
                    <Button className="relative gap-1 shadow-sm bg-blue-600 hover:bg-blue-700 text-white">
                        <span className="flex items-center gap-1">Nova Categoria</span>
                        <div className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full p-0.5 shadow-sm">
                            <Lock className="w-3 h-3" />
                        </div>
                    </Button>
                }
                title="Categorias Personalizadas"
                description="No plano Gratuito, você utiliza as categorias padrão do sistema. Faça upgrade para criar categorias ilimitadas com cores e ícones personalizados."
            />
        )
    }

    // Se for Premium, mostra o formulário normal
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <CreateButton label="Nova Categoria" />
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Nova Categoria</DialogTitle>
                        <DialogDescription>
                            Crie um grupo para organizar suas transações.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            <button
                                type="button"
                                onClick={() => setType('despesa')}
                                className={cn(
                                    "flex-1 py-1.5 text-sm font-medium rounded-md transition-all",
                                    type === 'despesa' ? "bg-white dark:bg-slate-700 shadow-sm text-red-600" : "text-slate-500"
                                )}
                            >
                                Despesa
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('receita')}
                                className={cn(
                                    "flex-1 py-1.5 text-sm font-medium rounded-md transition-all",
                                    type === 'receita' ? "bg-white dark:bg-slate-700 shadow-sm text-emerald-600" : "text-slate-500"
                                )}
                            >
                                Receita
                            </button>
                        </div>

                        <div className="space-y-2">
                            <Label>Nome</Label>
                            <Input
                                placeholder="Ex: Assinaturas, Cursos..."
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Cor</Label>
                            <div className="flex gap-2 flex-wrap">
                                {COLORS.map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        className={cn(
                                            "w-6 h-6 rounded-full border-2 transition-all shadow-sm",
                                            color === c ? "border-slate-900 dark:border-white scale-110" : "border-transparent opacity-70 hover:opacity-100"
                                        )}
                                        style={{ backgroundColor: c }}
                                        onClick={() => setColor(c)}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Ícone</Label>
                            <div className="grid grid-cols-6 gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                                {Object.entries(CATEGORY_ICONS).map(([key, data]) => {
                                    const IconComponent = data.icon
                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            className={cn(
                                                "p-2 rounded-md flex items-center justify-center transition-all aspect-square",
                                                icon === key
                                                    ? "bg-slate-900 text-white shadow-md scale-105"
                                                    : "text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900"
                                            )}
                                            onClick={() => setIcon(key)}
                                            title={data.label}
                                        >
                                            <IconComponent className="w-5 h-5" />
                                        </button>
                                    )
                                })}
                            </div>
                            <p className="text-xs text-slate-500 text-right">Selecionado: {CATEGORY_ICONS[icon]?.label}</p>
                        </div>

                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isLoading} variant="success">
                            {isLoading ? 'Criando...' : 'Criar Categoria'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
