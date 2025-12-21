import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { TopBar } from "@/components/layout/top-bar"
import { UserProvider } from "@/providers/user-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { getFinancialSummary } from "./summary-actions"
import { getQueryClient } from "@/utils/get-query-client"
import { queryKeys } from "@/lib/query-keys"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { cookies } from "next/headers"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    // 1. Prefetch dos dados no servidor
    const queryClient = getQueryClient()
    const cookieStore = await cookies()
    const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false"

    // Precisamos buscar os dados. Como o dashboard-service usa apiClient que pode depender
    // de headers/cookies no client, aqui no server usamos a Server Action 'getFinancialSummary'
    // ou adaptamos o service para aceitar token/contexto.
    // Simples: Usamos a action existente que já trata cookies.
    await queryClient.prefetchQuery({
        queryKey: queryKeys.dashboard.summary(),
        queryFn: getFinancialSummary
    })

    // stats para a sidebar (ainda necessário passar via prop ou ela pode consumir useQuery tbm)
    // Para otimizar, a Sidebar deveria usar useQuery e pegar do cache desidratado!
    // Mas por compatibilidade, vamos passar stats direto se ela precisar, ou refatorar ela.
    // O código atual da sidebar espera 'stats' como prop? Vamos verificar.
    // Assumindo que sim, pegamos o dado do cache para passar:
    // stats para a sidebar
    const stats = queryClient.getQueryData(queryKeys.dashboard.summary()) as any

    return (
        <UserProvider>
            <TooltipProvider delayDuration={200}>
                {/* 2. HydrationBoundary passa o estado do servidor para o cliente */}
                {/* Removing HydrationBoundary temporarily to debug "No QueryClient set" error. 
                    If this fixes it, we need to wrap it properly or investigate provider context. */}
                {/* <HydrationBoundary state={dehydrate(queryClient)}> */}
                <div className="flex h-screen w-full">
                    <SidebarProvider defaultOpen={defaultOpen}>
                        <AppSidebar stats={stats} />
                        <main className="flex-1 flex flex-col w-full h-full bg-muted/10">
                            <TopBar />
                            <div className="flex-1 overflow-auto">
                                {children}
                            </div>
                        </main>
                    </SidebarProvider>
                </div>
                {/* </HydrationBoundary> */}
            </TooltipProvider>
        </UserProvider>
    )
}
