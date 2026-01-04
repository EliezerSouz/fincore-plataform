"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CreateButton } from "@/components/ui/create-button"
import { BaseModal } from "@/components/ui/base-modal"
import { createCategory } from "@/app/(protected)/caixa/categories/actions"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { usePermission } from "@/hooks/use-permission"
import { Lock, Tag, Check, ArrowDownCircle, ArrowUpCircle, ArrowRightLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { UpsellModal } from "@/components/ui/upsell-modal"
import { CATEGORY_ICONS } from "@/lib/icons"
import { COLOR_PRESETS } from "@/constants/ui-presets"
import { toast } from "sonner"

export function CreateCategoryDialog() {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const { can } = usePermission()

    const [name, setName] = useState("")
    const [type, setType] = useState<'receita' | 'despesa' | 'ambas'>('despesa')
    const [color, setColor] = useState(COLOR_PRESETS[0].hex)
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

            toast.success("Categoria criada com sucesso!")

            setOpen(false)
            resetForm()
        } catch (error) {
            toast.error("Erro ao criar categoria")
        } finally {
            setIsLoading(false)
        }
    }

    function resetForm() {
        setName("")
        setColor(COLOR_PRESETS[0].hex)
        setIcon('tag')
    }

    // Se NÃO puder gerenciar categorias (Plano Free), mostra o Upsell
    if (!can('manage_categories')) {
        return (
            <UpsellModal
                trigger={
                    <Button className="relative gap-1 shadow-sm bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 px-4 rounded-xl">
                        <span className="flex items-center gap-2">
                            <Tag className="w-4 h-4" />
                            Nova Categoria
                        </span>
                        <div className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full p-0.5 shadow-sm border border-white dark:border-slate-900">
                            <Lock className="w-2.5 h-2.5" />
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
        <>
            <CreateButton label="Nova Categoria" onClick={() => setOpen(true)} />

            <BaseModal
                open={open}
                onOpenChange={setOpen}
                title={
                    <div className="flex items-center gap-2">
                        <Tag className="w-5 h-5 text-blue-600" />
                        <span>Nova Categoria</span>
                    </div>
                }
                description="Crie um grupo para organizar suas transações."
                primaryButton={{
                    label: "Criar Categoria",
                    isLoading: isLoading,
                    form: "create-category-form",
                    type: "submit"
                }}
                secondaryButton={{
                    label: "Cancelar"
                }}
            >
                <form id="create-category-form" onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <button
                            type="button"
                            onClick={() => setType('despesa')}
                            className={cn(
                                "flex-1 h-11 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2",
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
                                "flex-1 h-11 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2",
                                type === 'receita' ? "bg-white dark:bg-slate-700 shadow-sm text-emerald-600" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <ArrowUpCircle className={cn("w-4 h-4", type === 'receita' && "text-emerald-600")} />
                            Receita
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('ambas')}
                            className={cn(
                                "flex-1 h-11 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2",
                                type === 'ambas' ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <ArrowRightLeft className={cn("w-4 h-4", type === 'ambas' && "text-blue-600")} />
                            Híbrida
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
                                        "w-11 h-11 rounded-full transition-all shadow-sm flex items-center justify-center relative",
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
                                            "h-11 w-11 rounded-xl flex items-center justify-center transition-all",
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
            </BaseModal>
        </>
    )
}
