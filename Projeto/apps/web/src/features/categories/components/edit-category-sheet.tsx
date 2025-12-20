"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet"
import { updateCategoryDetails } from "@/app/(protected)/caixa/categories/actions"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { CATEGORY_ICONS } from "@/lib/icons"
import { Tag, Check, ArrowDownCircle, ArrowUpCircle, Loader2 } from "lucide-react"
import { COLOR_PRESETS } from "@/constants/ui-presets"
import { useRouter } from "next/navigation"

export function EditCategorySheet({ category, open, onOpenChange }: { category: any, open: boolean, onOpenChange: (open: boolean) => void }) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [name, setName] = useState(category.name)
    const [type, setType] = useState<'receita' | 'despesa'>(category.type)
    const [color, setColor] = useState(category.color || COLOR_PRESETS[0].hex)
    const [icon, setIcon] = useState(category.icon || 'tag')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!name) return

        setIsLoading(true)
        try {
            const formData = new FormData()
            formData.append('id', category.id)
            formData.append('name', name)
            formData.append('type', type)
            formData.append('color', color)
            formData.append('icon', icon)

            await updateCategoryDetails(formData)

            onOpenChange(false)
            router.refresh()
        } catch (error) {
            alert("Erro ao atualizar categoria")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                             <Tag className="w-5 h-5 text-blue-600" />
                        </div>
                        Editar Categoria
                    </SheetTitle>
                    <SheetDescription>
                        Atualize os detalhes da categoria {category.name}.
                    </SheetDescription>
                </SheetHeader>

                <form id="edit-category-form" onSubmit={handleSubmit} className="space-y-6 py-6">
                    <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <button
                            type="button"
                            onClick={() => setType('despesa')}
                            className={cn(
                                "flex-1 py-1.5 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2",
                                type === 'despesa' ? "bg-white dark:bg-slate-700 shadow-sm text-red-600" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <ArrowDownCircle className={cn("w-4 h-4", type === 'despesa' && "text-red-600")} />
                            Despesa
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('receita')}
                            className={cn(
                                "flex-1 py-1.5 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2",
                                type === 'receita' ? "bg-white dark:bg-slate-700 shadow-sm text-emerald-600" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <ArrowUpCircle className={cn("w-4 h-4", type === 'receita' && "text-emerald-600")} />
                            Receita
                        </button>
                    </div>

                    <div className="space-y-2">
                        <Label>Nome da Categoria</Label>
                        <Input
                            placeholder="Ex: Assinaturas, Cursos..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-3">
                        <Label>Cor de Identificação</Label>
                        <div className="flex gap-3 flex-wrap bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                            {COLOR_PRESETS.map((c) => (
                                <button
                                    key={c.hex}
                                    type="button"
                                    className={cn(
                                        "w-8 h-8 rounded-full transition-all shadow-sm flex items-center justify-center relative",
                                        color === c.hex ? "ring-2 ring-offset-2 ring-slate-400 dark:ring-slate-600 scale-110" : "hover:scale-110 opacity-70 hover:opacity-100"
                                    )}
                                    style={{ backgroundColor: c.hex }}
                                    onClick={() => setColor(c.hex)}
                                    title={c.name}
                                >
                                    {color === c.hex && <Check className="w-4 h-4 text-white drop-shadow-md" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>Ícone</Label>
                            <span className="text-xs text-slate-500 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                {CATEGORY_ICONS[icon]?.label}
                            </span>
                        </div>
                        <div className="grid grid-cols-6 gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 max-h-[200px] overflow-y-auto custom-scrollbar">
                            {Object.entries(CATEGORY_ICONS).map(([key, data]) => {
                                const IconComponent = data.icon
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        className={cn(
                                            "p-2 rounded-xl flex items-center justify-center transition-all aspect-square",
                                            icon === key
                                                ? "bg-blue-600 text-white shadow-md scale-105"
                                                : "text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-blue-600 hover:shadow-sm"
                                        )}
                                        onClick={() => setIcon(key)}
                                        title={data.label}
                                    >
                                        <IconComponent className="w-5 h-5" />
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </form>

                <SheetFooter className="gap-2 sm:space-x-0">
                     <SheetClose asChild>
                        <Button variant="outline" type="button" disabled={isLoading}>
                            Cancelar
                        </Button>
                    </SheetClose>
                    <Button type="submit" form="edit-category-form" disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Salvar Alterações
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
