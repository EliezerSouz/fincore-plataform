"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { BaseModal } from "@/components/ui/base-modal"
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
import { Tag, Check, ArrowDownCircle, ArrowUpCircle, Loader2, Plus, Trash2, AlertTriangle, Crown } from "lucide-react"
import { COLOR_PRESETS } from "@/constants/ui-presets"
import { useRouter } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { usePermission } from "@/hooks/use-permission"
import { UpsellModal } from "@/components/ui/upsell-modal"
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
    const { can, isFree } = usePermission()
    const [showUpsell, setShowUpsell] = useState(false)
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

    // Check permissions
    const isSystemLocked = category.is_system;
    const canEdit = !isSystemLocked && can('edit_categories');
    const isReadOnly = !canEdit;

    async function handleSubmit(e?: React.FormEvent) {
        if (e) e.preventDefault()
        if (!name) return

        if (isReadOnly) {
            if (isFree && !isSystemLocked) {
                setShowUpsell(true)
            } else {
                toast.error("Esta categoria não pode ser editada.")
            }
            return
        }

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
            toast.success("Categoria atualizada com sucesso!")
        } catch (error) {
            toast.error("Erro ao atualizar categoria")
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
            
            setNewSubName("")
            router.refresh()
        } catch (error) {
            console.error(error)
        } finally {
            setIsCreatingSub(false)
        }
    }

    async function handleToggleSub(sub: any) {
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
            toast.success("Categoria excluída")
        } catch (error) {
            toast.error("Erro ao excluir categoria. Verifique se existem transações vinculadas.")
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
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            title={
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                         <Tag className="w-5 h-5 text-blue-600" />
                    </div>
                    Editar Categoria
                </div>
            }
            description="Gerencie detalhes e subcategorias."
            primaryButton={
                isReadOnly 
                    ? (isFree && !isSystemLocked ? {
                        label: "Fazer Upgrade",
                        onClick: () => setShowUpsell(true)
                      } : undefined)
                    : {
                        label: "Salvar Alterações",
                        onClick: () => handleSubmit(),
                        isLoading: isLoading
                    }
            }
            secondaryButton={{
                label: isReadOnly ? "Fechar" : "Cancelar",
                onClick: () => onOpenChange(false)
            }}
        >
            <div className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
                <form id="edit-category-form" onSubmit={handleSubmit} className="space-y-6">
                    {isReadOnly && (
                        <div className={cn(
                            "p-3 rounded-lg text-sm flex items-start gap-2 border",
                            isSystemLocked 
                                ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50"
                                : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50"
                        )}>
                            {isSystemLocked ? (
                                <>
                                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                    <p>
                                        <strong>Categoria de Sistema:</strong> Esta categoria é essencial para o funcionamento do sistema e não pode ser editada ou ter subcategorias adicionadas.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <Crown className="w-4 h-4 mt-0.5 shrink-0" />
                                    <p>
                                        <strong>Modo de Visualização:</strong> Você está visualizando esta categoria. Faça upgrade para o plano Premium para editar e gerenciar categorias.
                                    </p>
                                </>
                            )}
                        </div>
                    )}

                    <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg opacity-60 cursor-not-allowed" title="O tipo da categoria não pode ser alterado">
                        <button
                            type="button"
                            disabled
                            className={cn(
                                "flex-1 h-11 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 cursor-not-allowed",
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
                                "flex-1 h-11 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 cursor-not-allowed",
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
                            className="h-11 bg-slate-50 dark:bg-slate-900"
                            disabled={isReadOnly}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Cor da Etiqueta</Label>
                        <div className="flex flex-wrap gap-2">
                            {COLOR_PRESETS.map((preset) => (
                                <button
                                    key={preset.hex}
                                    type="button"
                                    disabled={isReadOnly}
                                    onClick={() => setColor(preset.hex)}
                                    className={cn(
                                        "w-8 h-8 rounded-full border-2 transition-all",
                                        color === preset.hex 
                                            ? "border-slate-900 dark:border-white scale-110 shadow-sm" 
                                            : "border-transparent hover:scale-105",
                                        isReadOnly && color !== preset.hex && "opacity-30 cursor-not-allowed"
                                    )}
                                    style={{ backgroundColor: preset.hex }}
                                    title={preset.label}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Ícone</Label>
                        <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-[160px] overflow-y-auto p-1 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                            {Object.entries(CATEGORY_ICONS).map(([key, item]) => {
                                const Icon = item.icon
                                const isSelected = icon === key
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        disabled={isReadOnly}
                                        onClick={() => setIcon(key)}
                                        className={cn(
                                            "flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-all aspect-square",
                                            isSelected 
                                                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm scale-95" 
                                                : isReadOnly ? "text-slate-300 cursor-not-allowed" : "text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                                        )}
                                        title={item.label}
                                    >
                                        <Icon className="w-5 h-5" />
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </form>

                <Separator />

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            Subcategorias
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500">{subcategories.length}</span>
                        </h3>
                    </div>

                    {!isReadOnly && (
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
                                className="h-11 text-sm"
                            />
                            <Button onClick={handleAddSub} disabled={!newSubName.trim() || isCreatingSub} className="h-11 w-11 p-0 shrink-0">
                                {isCreatingSub ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            </Button>
                        </div>
                    )}

                    <div className="space-y-1">
                        {subcategories.length === 0 && (
                            <div className="text-center py-6 text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                                {isReadOnly ? "Esta categoria não permite subcategorias." : "Nenhuma subcategoria cadastrada."}
                            </div>
                        )}
                        {subcategories.map((sub) => (
                            <div key={sub.id} className="group flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                                <div className="flex items-center gap-3 flex-1">
                                    <Switch 
                                        checked={sub.is_active !== false}
                                        onCheckedChange={() => handleToggleSub(sub)}
                                        className="scale-75 data-[state=checked]:bg-emerald-500"
                                        disabled={isReadOnly}
                                    />
                                    <span className={cn(
                                        "text-sm font-medium transition-colors",
                                        sub.is_active === false ? "text-slate-400 line-through decoration-slate-300" : "text-slate-700 dark:text-slate-200"
                                    )}>
                                        {sub.name}
                                    </span>
                                </div>
                                {!isReadOnly && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-11 w-11 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleDeleteSub(sub.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {!isReadOnly && (
                    <>
                        <Separator />
                        <div className="p-4 rounded-lg border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10">
                            <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">Zona de Perigo</h4>
                            <p className="text-xs text-red-600/80 dark:text-red-400/70 mb-3">
                                Ao excluir esta categoria, todas as transações vinculadas perderão a categorização.
                            </p>
                            
                            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" className="w-full">
                                        Excluir Categoria
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta ação não pode ser desfeita. Isso excluirá permanentemente a categoria
                                            <span className="font-bold text-slate-900 dark:text-white mx-1">"{category.name}"</span>
                                            e suas subcategorias.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDeleteCategory} className="bg-red-600 hover:bg-red-700">
                                            {isDeletingCategory ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                            Sim, excluir categoria
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </>
                )}
            </div>
            <UpsellModal 
                open={showUpsell} 
                onOpenChange={setShowUpsell}
                title="Funcionalidade Premium"
                description="No plano gratuito você não pode editar categorias. Faça o upgrade para personalizar seu financeiro."
            />
        </BaseModal>
    )
}