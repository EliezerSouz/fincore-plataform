import { Metadata } from "next"
import { getCreditCards } from "./actions"
import { CreditCardList } from "./card-list"
import { CreateCardDialog } from "./create-card-dialog"
import { PrimaryCardManager } from "./primary-card-manager"
import { CreditCard, Wallet, TrendingUp, AlertCircle } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { PageLayout } from "@/components/layout/page-layout"
import { BrandIcon } from "@/features/transactions/components/brand-icon"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
    title: "Cartões de Crédito | Financeiro",
    description: "Gerencie seus cartões de crédito e faturas.",
}

export default async function CardsPage() {
    const cards = await getCreditCards()

    // Cálculos de resumo
    const totalLimit = cards.reduce((acc, card) => acc + card.limit_amount, 0)
    const totalAvailable = cards.reduce((acc, card) => acc + (card.available_limit || card.limit_amount), 0)
    const totalUsed = totalLimit - totalAvailable
    const usagePercentage = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0

    // Agrupar por bandeira
    const cardsByBrand = cards.reduce((acc: any, card) => {
        const brand = card.brand || 'outros'
        if (!acc[brand]) {
            acc[brand] = {
                total: 0,
                available: 0,
                count: 0,
                brand: brand
            }
        }
        acc[brand].total += card.limit_amount
        acc[brand].available += (card.available_limit || card.limit_amount)
        acc[brand].count += 1
        return acc
    }, {})

    const brandSummaries = Object.values(cardsByBrand).sort((a: any, b: any) => b.total - a.total)

    const getBrandLabel = (brand: string) => {
        const labels: Record<string, string> = {
            'master': 'Mastercard',
            'visa': 'Visa',
            'elo': 'Elo',
            'amex': 'American Express',
            'hipercard': 'Hipercard',
            'outros': 'Outros'
        }
        return labels[brand] || brand.charAt(0).toUpperCase() + brand.slice(1)
    }

    return (
        <PageLayout
            title="Cartões de Crédito"
            description="Gerencie limites, faturas e controle seus gastos."
            action={<CreateCardDialog cardsCount={cards.length} />}
            icon={CreditCard}
        >
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Limite Total</CardTitle>
                            <Wallet className="h-4 w-4 text-slate-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalLimit)}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Soma de todos os cartões • {cards.length} cartão{cards.length !== 1 ? 'ões' : ''}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Disponível</CardTitle>
                            <TrendingUp className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalAvailable)}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Crédito livre • {usagePercentage.toFixed(0)}% em uso
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Limite Usado</CardTitle>
                            <CreditCard className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalUsed)}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Crédito comprometido • {((totalUsed / totalLimit) * 100).toFixed(0)}% do total
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Meus Cartões</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-6">
                             <PrimaryCardManager cards={cards} />
                        </div>
                        
                        {cards.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 py-24 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center bg-slate-50/50 dark:bg-slate-950/50 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                <div className="bg-white dark:bg-slate-900 p-4 rounded-full mb-4 shadow-sm">
                                    <CreditCard className="w-10 h-10 text-slate-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                                    Nenhum cartão encontrado
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8 leading-relaxed">
                                    Você ainda não cadastrou nenhum cartão de crédito. Comece agora para controlar seus limites e faturas.
                                </p>
                                <CreateCardDialog cardsCount={cards.length} />
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* Agrupamento por bandeira (se houver múltiplas) */}
                                {brandSummaries.length > 1 ? (
                                    brandSummaries.map((summary: any) => {
                                        const cardsOfBrand = cards.filter(c => (c.brand || 'outros') === summary.brand)
                                        const usedPercentage = summary.total > 0 ? ((summary.total - summary.available) / summary.total) * 100 : 0

                                        return (
                                            <div key={summary.brand} className="space-y-4">
                                                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                                            <BrandIcon brand={summary.brand} className="h-6 w-6 text-slate-700 dark:text-slate-300" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                                                {getBrandLabel(summary.brand)}
                                                            </h3>
                                                            <p className="text-sm text-muted-foreground">
                                                                {summary.count} cartão{summary.count !== 1 ? 'ões' : ''} • {formatCurrency(summary.available)} disponível de {formatCurrency(summary.total)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={`text-sm font-semibold ${usedPercentage > 80 ? 'text-red-600' : usedPercentage > 50 ? 'text-amber-600' : 'text-green-600'}`}>
                                                            {usedPercentage.toFixed(0)}% em uso
                                                        </p>
                                                    </div>
                                                </div>
                                                <CreditCardList cards={cardsOfBrand} />
                                            </div>
                                        )
                                    })
                                ) : (
                                    <CreditCardList cards={cards} />
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </PageLayout>
    )
}
