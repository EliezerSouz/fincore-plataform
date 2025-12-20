"use client"

import { useState } from "react"
import { Category, updateCategory } from "@/app/(protected)/caixa/categories/actions"
import { Tag, MoreHorizontal, LayoutGrid, List as ListIcon, Search, Archive } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CATEGORY_ICONS } from "@/lib/icons"
import { usePermission } from "@/hooks/use-permission"
import { EditCategorySheet } from "@/features/categories/components/edit-category-sheet"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { UpsellModal } from "@/components/ui/upsell-modal"
import { useRouter } from "next/navigation"

export function CategoryList({ categories, type }: { categories: Category[], type: 'receita' | 'despesa' }) {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [search, setSearch] = useState("")
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [isSheetOpen, setIsSheetOpen] = useState(false)

    const filtered = categories.filter(c => c.type === type && c.name.toLowerCase().includes(search.toLowerCase()))
    const active = filtered.filter(c => c.is_active !== false)
    const inactive = filtered.filter(c => c.is_active === false)

    const handleEdit = (category: Category) => {
        setEditingCategory(category)
        setIsSheetOpen(true)
    }

    if (categories.filter(c => c.type === type).length === 0) {
        return (
            <div className="text-center py-12 text-slate-400 text-sm border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                <div className="mx-auto w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                    <Tag className="w-6 h-6 text-slate-300" />
                </div>
                <p>Nenhuma categoria de {type} encontrada.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                        placeholder="Buscar categoria..." 
                        className="pl-9 bg-white dark:bg-slate-900"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg self-end sm:self-auto">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={cn(
                            "p-1.5 rounded-md transition-all",
                            viewMode === 'grid' ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100" : "text-slate-500 hover:text-slate-700"
                        )}
                        title="Visualização em Grade"
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={cn(
                            "p-1.5 rounded-md transition-all",
                            viewMode === 'list' ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100" : "text-slate-500 hover:text-slate-700"
                        )}
                        title="Visualização em Lista"
                    >
                        <ListIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Active Categories */}
            <div className={cn(
                "grid gap-4",
                viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
            )}>
                {active.map(cat => (
                    <CategoryItem 
                        key={cat.id} 
                        category={cat} 
                        viewMode={viewMode} 
                        onEdit={() => handleEdit(cat)} 
                    />
                ))}
            </div>

            {active.length === 0 && search && (
                <div className="text-center py-8 text-slate-400">
                    Nenhuma categoria ativa encontrada para "{search}".
                </div>
            )}

            {/* Inactive Categories */}
            {inactive.length > 0 && (
                <div className="pt-8 border-t border-slate-100 dark:border-slate-800 animate-in fade-in space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></div>
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <Archive className="w-3.5 h-3.5" />
                            Arquivadas
                            <Badge variant="secondary" className="text-[10px] px-1.5 h-5 min-w-[1.25rem]">{inactive.length}</Badge>
                        </h3>
                        <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></div>
                    </div>
                    
                    <div className={cn(
                        "grid gap-4 opacity-60 hover:opacity-100 transition-opacity",
                        viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
                    )}>
                        {inactive.map(cat => (
                            <CategoryItem 
                                key={cat.id} 
                                category={cat} 
                                viewMode={viewMode} 
                                onEdit={() => handleEdit(cat)} 
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Edit Sheet */}
            {editingCategory && (
                <EditCategorySheet 
                    key={editingCategory.id}
                    category={editingCategory} 
                    open={isSheetOpen} 
                    onOpenChange={(open) => {
                        setIsSheetOpen(open)
                        if (!open) setEditingCategory(null)
                    }} 
                />
            )}
        </div>
    )
}

function CategoryItem({ 
    category, 
    viewMode, 
    onEdit 
}: { 
    category: Category, 
    viewMode: 'grid' | 'list', 
    onEdit: () => void 
}) {
    const router = useRouter()
    const { can } = usePermission()
    const [showUpsell, setShowUpsell] = useState(false)
    const IconComponent = CATEGORY_ICONS[category.icon]?.icon || Tag
    const subCount = category.subcategories?.length || 0
    const isActive = category.is_active !== false

    const handleToggleActive = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!can('unlimited_categories')) {
            setShowUpsell(true)
            return
        }

        try {
            const formData = new FormData()
            formData.append('id', category.id)
            formData.append('is_active', (!isActive).toString())
            await updateCategory(formData)
            router.refresh()
        } catch (error) {
            console.error("Erro ao atualizar status", error)
        }
    }

    if (viewMode === 'list') {
        return (
            <>
                <div 
                    onClick={onEdit}
                    className="group flex items-center gap-4 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer"
                >
                    <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                        style={{ 
                            backgroundColor: isActive ? `${category.color}15` : '#f1f5f9', 
                            color: isActive ? category.color : '#94a3b8' 
                        }}
                    >
                        <IconComponent className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className={cn("font-semibold truncate text-sm", isActive ? "text-slate-900 dark:text-slate-100" : "text-slate-500")}>
                                {category.name}
                            </h3>
                            {!isActive && <Badge variant="outline" className="text-[10px] h-5">Inativa</Badge>}
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                            {subCount === 0 ? "Sem subcategorias" : `${subCount} subcategoria${subCount > 1 ? 's' : ''}`}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                            <MoreHorizontal className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
                <UpsellModal 
                    open={showUpsell} 
                    onOpenChange={setShowUpsell}
                    title="Limite de Categorias"
                    description="No plano gratuito você não pode arquivar categorias. Faça o upgrade para ter controle total."
                />
            </>
        )
    }

    return (
        <>
            <div 
                onClick={onEdit}
                className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: isActive ? category.color : 'transparent' }} />
                
                <div className="flex items-start justify-between mb-3">
                    <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm"
                        style={{ 
                            backgroundColor: isActive ? `${category.color}15` : '#f1f5f9', 
                            color: isActive ? category.color : '#94a3b8' 
                        }}
                    >
                        <IconComponent className="w-6 h-6" />
                    </div>
                    
                    <div 
                        role="button"
                        onClick={handleToggleActive}
                        className={cn(
                            "w-2 h-2 rounded-full ring-2 ring-white dark:ring-slate-900 transition-all hover:scale-150",
                            isActive ? "bg-emerald-500" : "bg-slate-300"
                        )}
                        title={isActive ? "Categoria Ativa" : "Categoria Inativa"}
                    />
                </div>

                <div>
                    <h3 className={cn("font-bold text-base mb-1 truncate", isActive ? "text-slate-900 dark:text-slate-100" : "text-slate-500")}>
                        {category.name}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{subCount} subcategorias</span>
                    </div>
                </div>
            </div>
            <UpsellModal 
                open={showUpsell} 
                onOpenChange={setShowUpsell}
                title="Limite de Categorias"
                description="No plano gratuito você não pode arquivar categorias. Faça o upgrade para ter controle total."
            />
        </>
    )
}
