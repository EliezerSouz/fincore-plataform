"use client"

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
    console.log("ReactQueryProvider: Mounting...")
    const [queryClient] = useState(() => {
        console.log("ReactQueryProvider: Creating QueryClient...")
        return new QueryClient({
            defaultOptions: {
                queries: {
                    // Padrão Global: Desativar refetch automático agressivo
                    refetchOnWindowFocus: false, // Não refetch ao trocar de aba (User req)
                    retry: 1,
                    staleTime: 1000 * 60 * 5, // 5 minutos padrão (override por domínio)
                },
            },
        })
    })

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    )
}
