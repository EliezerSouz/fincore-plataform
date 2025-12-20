/**
 * Sistema de Insights Financeiros Inteligentes
 * 
 * Motor de análise baseado em regras que gera insights personalizados
 * sem necessidade de APIs externas ou tokens.
 * 
 * Futuro: Pode ser expandido para usar LLMs (Groq, Hugging Face, etc.)
 */

export interface Insight {
    id: string
    type: 'warning' | 'success' | 'info' | 'danger'
    title: string
    message: string
    action?: {
        label: string
        href?: string
        onClick?: () => void
    }
    priority: number // 1-10, maior = mais importante
}

export interface AccountData {
    id: string
    name: string
    type: string
    balance: number
    is_active: boolean
}

export class InsightsEngine {
    /**
     * Gera insights baseados nas contas do usuário
     */
    static generateAccountInsights(accounts: AccountData[]): Insight[] {
        const insights: Insight[] = []

        // Análise 1: Contas com saldo negativo
        const negativeAccounts = accounts.filter(a => a.balance < 0 && a.is_active)
        if (negativeAccounts.length > 0) {
            const totalNegative = negativeAccounts.reduce((sum, acc) => sum + Math.abs(acc.balance), 0)
            insights.push({
                id: 'negative-balance',
                type: 'danger',
                title: '⚠️ Atenção: Saldo negativo detectado',
                message: `Você tem ${negativeAccounts.length} conta${negativeAccounts.length > 1 ? 's' : ''} com saldo negativo, totalizando ${this.formatCurrency(totalNegative)} em débito.`,
                action: {
                    label: 'Ver detalhes',
                },
                priority: 10
            })
        }

        // Análise 2: Concentração de saldo
        const activeAccounts = accounts.filter(a => a.is_active && a.balance > 0)
        if (activeAccounts.length > 0) {
            const totalBalance = activeAccounts.reduce((sum, acc) => sum + acc.balance, 0)
            const maxAccount = activeAccounts.reduce((max, acc) => acc.balance > max.balance ? acc : max)
            const concentration = (maxAccount.balance / totalBalance) * 100

            if (concentration > 80) {
                insights.push({
                    id: 'high-concentration',
                    type: 'warning',
                    title: '💡 Diversifique seus recursos',
                    message: `${concentration.toFixed(0)}% do seu dinheiro está em "${maxAccount.name}". Considere distribuir em outras contas para reduzir riscos.`,
                    priority: 7
                })
            }
        }

        // Análise 3: Contas inativas com saldo
        const inactiveWithBalance = accounts.filter(a => !a.is_active && a.balance !== 0)
        if (inactiveWithBalance.length > 0) {
            insights.push({
                id: 'inactive-with-balance',
                type: 'info',
                title: '📋 Contas inativas com saldo',
                message: `Você tem ${inactiveWithBalance.length} conta${inactiveWithBalance.length > 1 ? 's' : ''} inativa${inactiveWithBalance.length > 1 ? 's' : ''} com saldo. Considere reativar ou transferir os recursos.`,
                priority: 5
            })
        }

        // Análise 4: Saúde financeira geral
        const totalPositive = activeAccounts.reduce((sum, acc) => sum + acc.balance, 0)
        const totalNegativeBalance = negativeAccounts.reduce((sum, acc) => sum + acc.balance, 0)
        const netBalance = totalPositive + totalNegativeBalance

        if (netBalance > 0 && negativeAccounts.length === 0) {
            insights.push({
                id: 'healthy-finances',
                type: 'success',
                title: '✅ Finanças saudáveis',
                message: `Parabéns! Todas as suas contas estão com saldo positivo, totalizando ${this.formatCurrency(netBalance)}.`,
                priority: 3
            })
        }

        // Análise 5: Muitas contas ativas
        if (activeAccounts.length > 5) {
            insights.push({
                id: 'many-accounts',
                type: 'info',
                title: '🎯 Simplifique sua gestão',
                message: `Você tem ${activeAccounts.length} contas ativas. Considere consolidar para facilitar o controle financeiro.`,
                priority: 4
            })
        }

        // Análise 6: Reserva de emergência
        const savingsAccounts = activeAccounts.filter(a =>
            a.type?.toLowerCase() === 'poupanca' ||
            a.type?.toLowerCase() === 'poupança'
        )
        const totalSavings = savingsAccounts.reduce((sum, acc) => sum + acc.balance, 0)
        const monthlyExpenseEstimate = Math.abs(totalNegativeBalance) || totalPositive * 0.3 // Estimativa

        if (totalSavings < monthlyExpenseEstimate * 3) {
            insights.push({
                id: 'low-emergency-fund',
                type: 'warning',
                title: '🛡️ Fortaleça sua reserva de emergência',
                message: `Sua reserva atual é de ${this.formatCurrency(totalSavings)}. Recomendamos ter pelo menos 3-6 meses de despesas guardados.`,
                priority: 8
            })
        }

        // Ordena por prioridade (maior primeiro)
        return insights.sort((a, b) => b.priority - a.priority)
    }

    /**
     * Gera insights baseados em transações (futuro)
     */
    static generateTransactionInsights(transactions: any[]): Insight[] {
        // TODO: Implementar análise de padrões de gastos
        return []
    }

    /**
     * Formata valor em moeda
     */
    private static formatCurrency(value: number): string {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value)
    }
}

/**
 * Hook para usar insights em componentes React
 */
export function useInsights(accounts: AccountData[]) {
    return InsightsEngine.generateAccountInsights(accounts)
}
