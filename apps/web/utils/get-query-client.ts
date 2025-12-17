import { QueryClient } from '@tanstack/react-query'
import { cache } from 'react'

// getQueryClient via cache do React para garantir uma instância única por requisição (no servidor)
export const getQueryClient = cache(() => new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60 * 1000,
        },
    },
}))
