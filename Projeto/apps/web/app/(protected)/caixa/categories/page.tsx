import { getCategories } from "./actions"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { CategoryList } from "@/features/categories/components/category-list"
import { CreateCategoryDialog } from "@/features/categories/components/create-category-dialog"
import { PageLayout } from "@/components/layout/page-layout"
import { Tag, TrendingUp, TrendingDown, Layers } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
        >
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total de Categorias</CardTitle>
                            <Layers className="h-4 w-4 text-slate-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                {totalReceitas + totalDespesas}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {totalSubsReceitas + totalSubsDespesas} subcategorias
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Categorias de Receita</CardTitle>
                            <TrendingUp className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                {totalReceitas}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {totalSubsReceitas} subcategorias
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Categorias de Despesa</CardTitle>
                            <TrendingDown className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                {totalDespesas}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {totalSubsDespesas} subcategorias
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Gerenciamento</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="despesa" className="relative z-10">
                            <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
                                <TabsTrigger value="despesa" className="data-[state=active]:bg-red-50 data-[state=active]:text-red-700 dark:data-[state=active]:bg-red-900/30 dark:data-[state=active]:text-red-400">
                                    <TrendingDown className="w-4 h-4 mr-2" />
                                    Despesas ({totalDespesas})
                                </TabsTrigger>
                                <TabsTrigger value="receita" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-900/30 dark:data-[state=active]:text-emerald-400">
                                    <TrendingUp className="w-4 h-4 mr-2" />
                                    Receitas ({totalReceitas})
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="despesa">
                                <CategoryList categories={despesas} type="despesa" />
                            </TabsContent>
                            <TabsContent value="receita">
                                <CategoryList categories={receitas} type="receita" />
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </PageLayout>
    )
}
