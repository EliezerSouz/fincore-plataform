/**
 * Insights baseados em regras (sem IA)
 * Funções síncronas que rodam no cliente
 */

export interface AIInsight {
    text: string
    type: 'tip' | 'warning' | 'success'
}

/**
 * Gera insights baseados em regras para conta individual
 */
export function generateRuleBasedAccountInsight(
    balance: number,
    accountType: string
): AIInsight {
    if (balance < 0) {
        return {
            text: accountType === 'digital' || accountType === 'corrente'
                ? 'Atenção ao limite de crédito usado'
                : 'Regularize o saldo negativo',
            type: 'warning'
        }
    }

    if (balance === 0) {
        return {
            text: 'Conta sem movimentação recente',
            type: 'tip'
        }
    }

    if (balance > 10000) {
        return {
            text: 'Considere investir parte deste saldo',
            type: 'success'
        }
    }

    return {
        text: 'Mantenha o controle dos gastos',
        type: 'tip'
    }
}

/**
 * Gera insights baseados em regras para saldo consolidado
 */
export function generateRuleBasedConsolidatedInsight(
    totalBalance: number,
    accountCount: number
): AIInsight {
    if (totalBalance < 0) {
        return {
            text: 'Priorize regularizar contas negativas',
            type: 'warning'
        }
    }

    if (totalBalance < 1000) {
        return {
            text: 'Construa sua reserva de emergência',
            type: 'tip'
        }
    }

    if (accountCount > 5) {
        return {
            text: 'Considere consolidar suas contas',
            type: 'tip'
        }
    }

    return {
        text: 'Finanças saudáveis, continue assim!',
        type: 'success'
    }
}

/**
 * Gera insights baseados em regras para cartões de crédito
 */
export function generateRuleBasedCreditCardInsight(
    limitAmount: number,
    availableLimit: number,
    usedPercentage: number
): AIInsight {
    if (usedPercentage >= 95) {
        return {
            text: 'Limite crítico! Evite novas compras',
            type: 'warning'
        }
    }

    if (usedPercentage >= 80) {
        return {
            text: 'Atenção: Limite quase esgotado',
            type: 'warning'
        }
    }

    if (usedPercentage >= 70) {
        return {
            text: 'Planeje o pagamento da próxima fatura',
            type: 'tip'
        }
    }

    if (usedPercentage >= 50) {
        return {
            text: 'Monitore seus gastos neste cartão',
            type: 'tip'
        }
    }

    return {
        text: 'Limite saudável, use com responsabilidade',
        type: 'success'
    }
}
