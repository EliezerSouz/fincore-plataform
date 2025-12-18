import { getCategories } from "./actions"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { CategoryList } from "@/features/categories/components/category-list"
import { CreateCategoryDialog } from "@/features/categories/components/create-category-dialog"
import { PageLayout } from "@/components/page-layout"
import { Tag, TrendingUp, TrendingDown, Layers } from "lucide-react"

export default async function CategoriesPage() {
    const receitas = await getCategories('receita')
    const despesas = await getCategories('despesa')

    // Contadores
    const totalReceitas = receitas.length
    const totalDespesas = despesas.length
    const totalSubsReceitas = receitas.reduce((acc, cat) => acc + (cat.subcategories?.length || 0), 0)
    const totalSubsDespesas = despesas.reduce((acc, cat) => acc + (cat.subcategories?.length || 0), 0)

    return (
        <PageLayout
            title="Categorias"
            description="Organize suas receitas e despesas em categorias personalizadas."
            action={<CreateCategoryDialog />}
            icon={Tag}
            summaryCards={
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col justify-between space-y-2 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Total</span>
                            <Layers className="h-4 w-4 text-slate-600" />
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                            {totalReceitas + totalDespesas}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {totalSubsReceitas + totalSubsDespesas} subcategorias
                        </div>
                    </div>

                    <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col justify-between space-y-2 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Receitas</span>
                            <TrendingUp className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                            {totalReceitas}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {totalSubsReceitas} subcategorias
                        </div>
                    </div>

                    <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col justify-between space-y-2 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Despesas</span>
                            <TrendingDown className="h-4 w-4 text-red-600" />
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                            {totalDespesas}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {totalSubsDespesas} subcategorias
                        </div>
                    </div>

                    <div className="rounded-xl border bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg p-6 flex flex-col justify-between space-y-2 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        <div className="flex items-center justify-between relative z-10">
                            <span className="text-sm font-medium text-purple-100">Subcategorias</span>
                            <Tag className="h-4 w-4 text-purple-200" />
                        </div>
                        <div className="text-2xl font-bold relative z-10">
                            {totalSubsReceitas + totalSubsDespesas}
                        </div>
                        <div className="text-xs text-purple-100 relative z-10">
                            Total de subcategorias
                        </div>
                    </div>
                </div>
            }
        >
            {/* Tabs */}
            <Tabs defaultValue="despesa" className="relative z-10">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="despesa" className="data-[state=active]:bg-red-50 data-[state=active]:text-red-700 dark:data-[state=active]:bg-red-900/30 dark:data-[state=active]:text-red-400">
                        <TrendingDown className="w-4 h-4 mr-2" />
                        Despesas ({totalDespesas})
                    </TabsTrigger>
                    <TabsTrigger value="receita" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-900/30 dark:data-[state=active]:text-emerald-400">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Receitas ({totalReceitas})
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="despesa" className="mt-6">
                    <CategoryList categories={despesas} type="despesa" />
                </TabsContent>
                <TabsContent value="receita" className="mt-6">
                    <CategoryList categories={receitas} type="receita" />
                </TabsContent>
            </Tabs>
        </PageLayout>
    )
}
