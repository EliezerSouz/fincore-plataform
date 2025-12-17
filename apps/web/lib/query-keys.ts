/**
 * Centralized Query Keys for Cache Management
 * 
 * Mantém consistência entre Web e Mobile.
 * Alterar aqui reflete em toda a aplicação.
 */
export const queryKeys = {
    dashboard: {
        all: ['dashboard'] as const,
        summary: () => [...queryKeys.dashboard.all, 'summary'] as const,
    },
    transactions: {
        all: ['transactions'] as const,
        list: (filters: Record<string, any>) => [...queryKeys.transactions.all, 'list', filters] as const,
        details: (id: string) => [...queryKeys.transactions.all, 'detail', id] as const,
    },
    accounts: {
        all: ['accounts'] as const,
        list: () => [...queryKeys.accounts.all, 'list'] as const,
    },
    categories: {
        all: ['categories'] as const,
        list: (type?: string) => [...queryKeys.categories.all, 'list', { type }] as const,
    },
    cards: {
        all: ['cards'] as const,
        list: () => [...queryKeys.cards.all, 'list'] as const,
    },
}
