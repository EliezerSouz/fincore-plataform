"use client"

import { useState, useEffect } from "react"
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
import { 
    updateCategoryDetails, 
    createSubcategory, 
    deleteSubcategory, 
    updateSubcategory, 
    deleteCategory 
} from "@/app/(protected)/caixa/categories/actions"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { CATEGORY_ICONS } from "@/lib/icons"
import { Tag, Check, ArrowDownCircle, ArrowUpCircle, Loader2, Plus, Trash2, AlertTriangle } from "lucide-react"
import { COLOR_PRESETS } from "@/constants/ui-presets"
import { useRouter } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function EditCategorySheet({ category, open, onOpenChange }: { category: any, open: boolean, onOpenChange: (open: boolean) => void }) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [name, setName] = useState(category.name)
    const [type, setType] = useState<'receita' | 'despesa'>(category.type)
    const [color, setColor] = useState(category.color || COLOR_PRESETS[0].hex)
    const [icon, setIcon] = useState(category.icon || 'tag')
    
    // Subcategories state
    const [subcategories, setSubcategories] = useState<any[]>(category.subcategories || [])
    const [newSubName, setNewSubName] = useState("")
    const [isCreatingSub, setIsCreatingSub] = useState(false)
    
    // Delete category state
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [isDeletingCategory, setIsDeletingCategory] = useState(false)

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

    async function handleAddSub() {
        if (!newSubName.trim()) return
        setIsCreatingSub(true)
        try {
            const formData = new FormData()
            formData.append('name', newSubName)
            formData.append('categoryId', category.id)
            
            await createSubcategory(formData)
            
            // Optimistic update or refresh
            setNewSubName("")
            router.refresh()
            // We might want to re-fetch subcategories or update local state if we had the full object back
            // For now, router.refresh() will update the page data but not necessarily this sheet's local state if it's not remounted.
            // But since this is a controlled component opened from parent, maybe parent re-renders?
            // Actually, we should probably update local state to show it immediately if possible.
            // But createSubcategory returns the created object, let's assume it does.
            
            // To be safe and simple: just close/reopen or rely on router.refresh if the parent passes updated category.
            // If the parent component (CategoryList) fetches data, router.refresh() updates that data.
            // The EditCategorySheet receives `category` prop. 
            // If the parent re-renders with new `category` prop, we need to update `subcategories` state.
            // So we need a useEffect to sync prop to state.
        } catch (error) {
            console.error(error)
        } finally {
            setIsCreatingSub(false)
        }
    }

    async function handleToggleSub(sub: any) {
        // Optimistic update
        const newStatus = sub.is_active === false ? true : false
        const updatedSubs = subcategories.map(s => s.id === sub.id ? { ...s, is_active: newStatus } : s)
        setSubcategories(updatedSubs)

        try {
            const formData = new FormData()
            formData.append('id', sub.id)
            formData.append('is_active', newStatus.toString())
            await updateSubcategory(formData)
            router.refresh()
        } catch (error) {
            // Revert on error
            setSubcategories(subcategories)
        }
    }

    async function handleDeleteSub(subId: string) {
        if (!confirm("Excluir subcategoria?")) return
        
        const previousSubs = [...subcategories]
        setSubcategories(subcategories.filter(s => s.id !== subId))

        try {
            await deleteSubcategory(subId)
            router.refresh()
        } catch (error) {
            setSubcategories(previousSubs)
        }
    }

    async function handleDeleteCategory() {
        setIsDeletingCategory(true)
        try {
            await deleteCategory(category.id)
            setDeleteConfirmOpen(false)
            onOpenChange(false)
            router.refresh()
        } catch (error) {
            alert("Erro ao excluir categoria. Verifique se existem transações vinculadas.")
        } finally {
            setIsDeletingCategory(false)
        }
    }

    useEffect(() => {
        if (category.subcategories) {
            setSubcategories(category.subcategories)
        }
    }, [category.subcategories])

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-white dark:bg-slate-950 p-0 gap-0 border-l border-slate-200 dark:border-slate-800">
                <div className="h-full flex flex-col">
                    <SheetHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-10">
                        <SheetTitle className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                                 <Tag className="w-5 h-5 text-blue-600" />
                            </div>
                            Editar Categoria
                        </SheetTitle>
                        <SheetDescription>
                            Gerencie detalhes e subcategorias.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
                        <form id="edit-category-form" onSubmit={handleSubmit} className="space-y-6">
                            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg opacity-60 cursor-not-allowed" title="O tipo da categoria não pode ser alterado">
                                <button
                                    type="button"
                                    disabled
                                    className={cn(
                                        "flex-1 py-1.5 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 cursor-not-allowed",
                                        type === 'despesa' ? "bg-white dark:bg-slate-700 shadow-sm text-red-600" : "text-slate-500"
                                    )}
                                >
                                    <ArrowDownCircle className={cn("w-4 h-4", type === 'despesa' && "text-red-600")} />
                                    Despesa
                                </button>
                                <button
                                    type="button"
                                    disabled
                                    className={cn(
                                        "flex-1 py-1.5 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 cursor-not-allowed",
                                        type === 'receita' ? "bg-white dark:bg-slate-700 shadow-sm text-emerald-600" : "text-slate-500"
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
                                    className="text-lg font-semibold"
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
                                <div className="grid grid-cols-6 gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 max-h-[160px] overflow-y-auto custom-scrollbar">
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

                        <Separator />

                        {/* SUBCATEGORIAS */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                    Subcategorias
                                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500">{subcategories.length}</span>
                                </h3>
                            </div>

                            <div className="flex gap-2">
                                <Input 
                                    placeholder="Nova subcategoria..." 
                                    value={newSubName}
                                    onChange={(e) => setNewSubName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            handleAddSub()
                                        }
                                    }}
                                    className="h-9 text-sm"
                                />
                                <Button size="sm" onClick={handleAddSub} disabled={!newSubName.trim() || isCreatingSub} className="h-9 w-9 p-0 shrink-0">
                                    {isCreatingSub ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                </Button>
                            </div>

                            <div className="space-y-1">
                                {subcategories.length === 0 && (
                                    <div className="text-center py-6 text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                                        Nenhuma subcategoria cadastrada.
                                    </div>
                                )}
                                {subcategories.map((sub) => (
                                    <div key={sub.id} className="group flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                                        <div className="flex items-center gap-3 flex-1">
                                            <Switch 
                                                checked={sub.is_active !== false}
                                                onCheckedChange={() => handleToggleSub(sub)}
                                                className="scale-75 data-[state=checked]:bg-emerald-500"
                                            />
                                            <span className={cn(
                                                "text-sm font-medium transition-colors",
                                                sub.is_active === false ? "text-slate-400 line-through decoration-slate-300" : "text-slate-700 dark:text-slate-200"
                                            )}>
                                                {sub.name}
                                            </span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleDeleteSub(sub.id)}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Separator />
                        
                        <div className="pt-2">
                             <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 gap-2 h-10">
                                        <Trash2 className="w-4 h-4" />
                                        Excluir Categoria
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta ação não pode ser desfeita. Isso excluirá permanentemente a categoria <strong>{category.name}</strong> e todas as suas subcategorias.
                                            <br/><br/>
                                            <span className="flex items-center gap-2 text-amber-600 bg-amber-50 p-2 rounded text-xs font-medium">
                                                <AlertTriangle className="w-4 h-4" />
                                                Se houver transações vinculadas, a exclusão será bloqueada.
                                            </span>
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDeleteCategory} className="bg-red-600 hover:bg-red-700 text-white">
                                            {isDeletingCategory ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                            Sim, excluir
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>

                    <SheetFooter className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm mt-auto gap-2 sm:space-x-0">
                         <SheetClose asChild>
                            <Button variant="outline" type="button" disabled={isLoading} className="flex-1">
                                Cancelar
                            </Button>
                        </SheetClose>
                        <Button type="submit" form="edit-category-form" disabled={isLoading} className="flex-1">
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Salvar Alterações
                        </Button>
                    </SheetFooter>
                </div>
            </SheetContent>
        </Sheet>
    )
}
