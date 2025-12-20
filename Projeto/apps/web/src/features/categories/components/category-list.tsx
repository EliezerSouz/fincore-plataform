"use client"

import { useState, useEffect } from "react"
import { Category, deleteCategory, createSubcategory, deleteSubcategory, updateCategory, updateSubcategory } from "@/app/(protected)/caixa/categories/actions"
import { Tag, Trash2, Plus, ChevronDown, ChevronUp, Lock, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CATEGORY_ICONS } from "@/lib/icons"
import { usePermission } from "@/hooks/use-permission"
import { UpsellModal } from "@/components/ui/upsell-modal"
import { DeleteDialog } from "@/components/ui/delete-dialog"
import { EditCategorySheet } from "@/features/categories/components/edit-category-sheet"
import { useRouter } from "next/navigation"

export function CategoryList({ categories, type }: { categories: Category[], type: 'receita' | 'despesa' }) {
    const filtered = categories.filter(c => c.type === type)
    const active = filtered.filter(c => c.is_active !== false)
    const inactive = filtered.filter(c => c.is_active === false)

    if (filtered.length === 0) {
        return (
            <div className="text-center py-10 text-slate-400 text-sm border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                Nenhuma categoria de {type} encontrada.
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {active.map(cat => (
                    <CategoryCard key={cat.id} category={cat} />
                ))}
            </div>

            {inactive.length > 0 && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 animate-in fade-in">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase mb-4 flex items-center gap-2">
                        <span>Arquivadas / Inativas</span>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{inactive.length}</span>
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 opacity-75 grayscale-[0.5] hover:grayscale-0 transition-all duration-300">
                        {inactive.map(cat => (
                            <CategoryCard key={cat.id} category={cat} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

function CategoryCard({ category }: { category: Category }) {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [subName, setSubName] = useState("")
    const [isCreating, setIsCreating] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [showUpsell, setShowUpsell] = useState(false)
    const [deleteCategoryOpen, setDeleteCategoryOpen] = useState(false)
    const [editCategoryOpen, setEditCategoryOpen] = useState(false)
    const [subToDelete, setSubToDelete] = useState<any>(null)

    // Local state for optimistic UI
    const [isActive, setIsActive] = useState(category.is_active !== false)
    const [subcategories, setSubcategories] = useState<any[]>(category.subcategories || [])

    const { can } = usePermission()

    // Sync with props if they change
    useEffect(() => {
        setIsActive(category.is_active !== false)
    }, [category.is_active])

    useEffect(() => {
        setSubcategories(category.subcategories || [])
    }, [category.subcategories])

    // Resolve icon from library or fallback to Tag
    const IconComponent = CATEGORY_ICONS[category.icon]?.icon || Tag

    async function handleDeleteCategory() {
        setIsDeleting(true)
        try {
            await deleteCategory(category.id)
            router.refresh()
        } catch (e: any) {
            console.error(e)
            if (e.message?.includes("foreign key") || e.code === "23503") {
                alert("Não é possível excluir esta categoria pois ela possui transações vinculadas. Tente desativá-la.")
            } else {
                alert("Erro ao excluir: " + e.message)
            }
        } finally {
            setIsDeleting(false)
            setDeleteCategoryOpen(false)
        }
    }

    async function handleAddSub() {
        if (!subName.trim()) return
        setIsCreating(true)
        
        // Optimistic ID (will be replaced by router.refresh or if we use returned object)
        const tempId = `temp-${Date.now()}`
        const optimisticSub = { id: tempId, name: subName, is_active: true }
        
        // Optimistic update
        setSubcategories(prev => [...prev, optimisticSub])
        setSubName("")
        if (!isOpen) setIsOpen(true)

        try {
            const formData = new FormData()
            formData.append('categoryId', category.id)
            formData.append('name', optimisticSub.name)
            formData.append('is_active', 'true')
            
            const newSub = await createSubcategory(formData)
            
            // Update with real data if available
            if (newSub && (newSub as any).id) {
                setSubcategories(prev => prev.map(s => s.id === tempId ? newSub : s))
            } else {
                 router.refresh()
            }
        } catch (e: any) {
            // Revert
            setSubcategories(prev => prev.filter(s => s.id !== tempId))
            alert(e.message || 'Erro ao adicionar')
            setSubName(optimisticSub.name) // restore input
        } finally {
            setIsCreating(false)
        }
    }

    async function handleDeleteSub() {
        if (!subToDelete) return
        const subId = subToDelete.id
        
        // Optimistic update
        setSubcategories(prev => prev.filter(s => s.id !== subId))
        setSubToDelete(null)

        try {
            await deleteSubcategory(subId)
            // router.refresh() 
        } catch (e: any) {
            // Revert
            setSubcategories(prev => [...prev, subToDelete])
            console.error(e)
            if (e.message?.includes("foreign key") || e.code === "23503") {
                alert("Não é possível excluir esta subcategoria pois ela possui transações vinculadas.")
            } else {
                alert(e.message)
            }
        }
    }

    async function handleToggleSub(sub: any) {
        if (!can('create_subcategory')) return

        const newStatus = !sub.is_active
        
        // Optimistic update
        setSubcategories(prev => prev.map(s => s.id === sub.id ? { ...s, is_active: newStatus } : s))

        try {
            const formData = new FormData()
            formData.append('id', sub.id)
            formData.append('is_active', newStatus.toString())
            await updateSubcategory(formData)
        } catch (e: any) {
            // Revert
            setSubcategories(prev => prev.map(s => s.id === sub.id ? { ...s, is_active: !newStatus } : s))
            console.error(e)
            alert('Erro ao atualizar subcategoria')
        }
    }

    async function handleToggleActive() {
        if (!can('unlimited_categories')) {
            setShowUpsell(true)
            return
        }

        const newStatus = !isActive
        setIsActive(newStatus) // Optimistic visual update

        try {
            const formData = new FormData()
            formData.append('id', category.id)
            formData.append('is_active', newStatus.toString())

            await updateCategory(formData)
            router.refresh() // Sync with server to move category between lists
        } catch (e: any) {
            setIsActive(!newStatus) // Revert
            console.error(e)
            alert('Erro ao atualizar status')
        }
    }

    return (
        <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden group hover:shadow-md transition-all ${!isActive ? 'opacity-80' : ''}`}>
            <div className={`flex items-center justify-between p-3 border-l-4`} style={{ borderLeftColor: isActive ? category.color : '#cbd5e1' }}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 cursor-pointer transition-transform active:scale-95"
                        style={{ backgroundColor: isActive ? `${category.color}15` : '#f1f5f9', color: isActive ? category.color : '#94a3b8' }}
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="truncate cursor-pointer flex-1" onClick={() => setIsOpen(!isOpen)}>
                        <h3 className={`font-semibold truncate flex items-center gap-2 ${isActive ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500'}`}>
                            {category.name}
                        </h3>
                        <p className="text-xs text-slate-500">{subcategories.length || 0} subcategorias</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Toggle Active/Inactive */}
                    {can('unlimited_categories') ? (
                        <div
                            className="flex items-center gap-1.5 cursor-pointer p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            onClick={(e) => {
                                e.stopPropagation()
                                handleToggleActive()
                            }}
                            title={isActive ? "Desativar categoria" : "Ativar categoria"}
                        >
                            <span className={`text-[10px] font-semibold uppercase tracking-wider ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                                {isActive ? 'Ativa' : 'Inativa'}
                            </span>
                            <div className={`w-3 h-3 rounded-full border shadow-sm transition-all ${isActive ? 'bg-emerald-500 border-emerald-600' : 'bg-slate-200 border-slate-300 dark:bg-slate-700 dark:border-slate-600'}`} />
                        </div>
                    ) : (
                         <>
                            <div
                                className="flex items-center gap-1.5 cursor-pointer p-1.5 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setShowUpsell(true)
                                }}
                            >
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 opacity-90">
                                    Ativa
                                </span>
                                <div className="relative">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-600 shadow-sm opacity-90" />
                                    <div className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full p-[1px] shadow-sm">
                                        <Lock className="w-2 h-2" />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-8 h-8 p-0 text-slate-400 hover:text-slate-600"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                </div>
            </div>

            {isOpen && (
                <div className="px-3 pb-3 pt-0 space-y-2 animate-in slide-in-from-top-2 duration-200 relative">
                    {/* Watermark */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" style={{ color: category.color }}>
                        <IconComponent className="w-48 h-48" strokeWidth={1} />
                    </div>

                    <div className="h-px bg-slate-100 dark:bg-slate-800 mb-2 relative z-10"></div>

                    {/* Lista de Subs */}
                    <div className="relative z-10">
                        {(!subcategories || subcategories.length === 0) && (
                            <p className="text-xs text-slate-400 italic px-2 py-1">Nenhuma subcategoria.</p>
                        )}

                        {subcategories.map((sub) => (
                            <div key={sub.id} className="group/sub flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50 text-sm transition-colors">
                                <div className="flex items-center gap-2 flex-1">
                                    {can('create_subcategory') ? (
                                        <input
                                            type="checkbox"
                                            checked={sub.is_active !== false}
                                            onChange={() => {
                                                handleToggleSub(sub)
                                            }}
                                            className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                            disabled={!isActive}
                                        />
                                    ) : (
                                        <UpsellModal
                                            trigger={
                                                <div className="relative w-4 h-4 flex items-center justify-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={sub.is_active !== false}
                                                        readOnly
                                                        className="w-4 h-4 rounded border-slate-300 text-slate-400 opacity-50 cursor-pointer pointer-events-none"
                                                    />
                                                    <div className="absolute inset-0 z-10" />
                                                </div>
                                            }
                                            title="Controle de Subcategorias"
                                            description="No plano Gratuito, você não pode desativar subcategorias individualmente. Faça upgrade para ter controle total."
                                        />
                                    )}
                                    <span className={`text-slate-600 dark:text-slate-300 font-medium ${sub.is_active === false ? 'line-through opacity-50' : ''}`}>
                                        {sub.name}
                                    </span>
                                </div>
                                {can('delete_category') && (
                                    <button
                                        onClick={() => setSubToDelete(sub)}
                                        className="opacity-0 group-hover/sub:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"
                                        title="Excluir subcategoria (Premium)"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Input Nova Sub - Bloqueado se Inativa */}
                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 relative z-10">
                        {isActive ? (
                            can('create_subcategory') ? (
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Nova subcategoria..."
                                        className="h-8 text-sm bg-slate-50 dark:bg-slate-800/50"
                                        value={subName}
                                        onChange={(e) => setSubName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleAddSub()
                                        }}
                                    />
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="h-8 w-8 p-0 shrink-0"
                                        onClick={handleAddSub}
                                        disabled={isCreating}
                                    >
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                            ) : (
                                <UpsellModal
                                    trigger={
                                        <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/50 rounded border border-dashed border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 transition-colors">
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <Lock className="w-3 h-3 text-amber-500" />
                                                <span>Subcategorias são Premium</span>
                                            </div>
                                            <span className="text-xs text-amber-600 font-bold hover:text-amber-700">
                                                Liberar
                                            </span>
                                        </div>
                                    }
                                    title="Crie Subcategorias"
                                    description="Organize seus gastos com precisão criando subcategorias personalizadas (ex: Uber, iFood, Netflix)."
                                />
                            )
                        ) : (
                            <div className="text-center py-2 text-xs text-slate-400 bg-slate-50 dark:bg-slate-900 rounded">
                                Ative a categoria para adicionar subcategorias.
                            </div>
                        )}
                    </div>

                    <div className="pt-2 flex justify-end gap-2 relative z-10">
                        {can('manage_categories') && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-[10px] uppercase tracking-wide text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10"
                                onClick={() => setEditCategoryOpen(true)}
                            >
                                <Pencil className="w-3 h-3 mr-1" />
                                Editar
                            </Button>
                        )}

                        {can('delete_category') && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-[10px] uppercase tracking-wide text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
                                onClick={() => setDeleteCategoryOpen(true)}
                                disabled={isDeleting}
                            >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Excluir
                            </Button>
                        )}
                    </div>
                </div>
            )}
            
            <UpsellModal
                open={showUpsell}
                onOpenChange={setShowUpsell}
                title="Controle de Categorias"
                description="No plano Gratuito, as categorias padrão não podem ser desativadas. Faça upgrade para personalizar completamente."
            />

            <EditCategorySheet
                category={category}
                open={editCategoryOpen}
                onOpenChange={setEditCategoryOpen}
            />

            <DeleteDialog
                open={deleteCategoryOpen}
                onOpenChange={setDeleteCategoryOpen}
                onConfirm={handleDeleteCategory}
                title="Excluir Categoria"
                description={
                    <span>
                        Tem certeza que deseja excluir a categoria <strong>{category.name}</strong> e todas as suas subcategorias?
                        <br /><br />
                        <span className="text-red-600 font-semibold">Atenção:</span> Se houver transações vinculadas, a exclusão será bloqueada pelo sistema para segurança dos dados. Neste caso, recomendamos apenas <strong>Desativar</strong> a categoria.
                    </span>
                }
                isDeleting={isDeleting}
            />

            <DeleteDialog
                open={!!subToDelete}
                onOpenChange={(open) => !open && setSubToDelete(null)}
                onConfirm={handleDeleteSub}
                title="Excluir Subcategoria"
                description={`Tem certeza que deseja excluir a subcategoria "${subToDelete?.name}"?`}
            />
        </div>
    )
}
