"use client"

import { Bell, Heart, Menu, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { UserDropdown } from "@/components/layout/user-dropdown"
import { useUser } from "@/providers/user-provider"
import { useSidebar } from "@/components/ui/sidebar"
import { Logo } from "@/components/ui/logo"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/layout/mode-toggle"

export function TopBar() {
    const { user, isLoading } = useUser()
    const { state, isMobile, toggleSidebar } = useSidebar()
    const pathname = usePathname()

    // Map paths to titles
    const getPageTitle = (path: string) => {
        if (path === "/dashboard") return "Visão Geral"
        if (path.startsWith("/caixa/transactions")) return "Transações"
        if (path.startsWith("/caixa/accounts")) return "Minhas Contas"
        if (path.startsWith("/caixa/categories")) return "Categorias"
        if (path.startsWith("/compromissos/cards")) return "Cartões de Crédito"
        if (path.startsWith("/compromissos/payables")) return "Contas a Pagar"
        if (path.startsWith("/patrimonio/investments")) return "Meus Investimentos"
        if (path.startsWith("/patrimonio/planning")) return "Metas & Planejamento"
        if (path.startsWith("/sistema/settings")) return "Configurações"
        if (path.startsWith("/sistema/account")) return "Minha Conta"
        return "FinCore Dashboard"
    }

    const pageTitle = getPageTitle(pathname || "")

    // Fallback data
    const displayUser = user || {
        name: isLoading ? "Carregando..." : "Usuário",
        initials: "...",
        planLabel: isLoading ? "Carregando..." : "Gratuito",
        avatarUrl: null
    }

    const showLogo = isMobile || state === "collapsed"

    return (
        <header className="flex items-center justify-between h-16 px-4 md:px-8 bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-md border-b border-gray-200/50 dark:border-white/5 sticky top-0 z-30 transition-all">
            <div className="flex items-center gap-4">
                {/* Sidebar Toggle Button - Visible always as requested */}
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={toggleSidebar}
                    className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                >
                    {state === 'expanded' ? (
                        <Menu className="h-5 w-5" />
                    ) : (
                        <ChevronRight className="h-5 w-5" />
                    )}
                </Button>

                {/* Logo/Title - Visible on Mobile or when Sidebar is collapsed */}
                <div className={cn(
                    "flex items-center gap-3 transition-all duration-300",
                    showLogo ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 absolute pointer-events-none"
                )}>
                    <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold shadow-lg shadow-blue-500/20">
                        <Heart className="w-4 h-4 fill-white text-white" />
                        <div className="absolute inset-0 rounded-lg bg-white/20 blur-sm opacity-0 hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex flex-col gap-0.5 leading-none">
                        <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                            FinCore
                        </span>
                        <span className="text-[9px] text-zinc-500 font-medium tracking-wider uppercase">
                            v0.1.0 Beta
                        </span>
                    </div>
                </div>

                {/* Page Title (Dynamic) */}
                <div className={cn(
                    "flex flex-col transition-all duration-300",
                    showLogo ? "hidden md:flex opacity-50 scale-95 ml-2" : "opacity-100 scale-100"
                )}>
                     <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        {pageTitle}
                     </h1>
                </div>
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-2 md:space-x-4 ml-auto">
                {/* Motto - Hidden on mobile */}
                <span className="hidden xl:block text-xs text-zinc-400 dark:text-zinc-500 italic mr-4">
                    "O coração da sua vida financeira"
                </span>

                {/* Subscription status */}
                <div className={cn(
                    "hidden lg:flex items-center gap-2 px-3 py-1 rounded-full border shadow-sm transition-all",
                    user?.plan === 'free' && "bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400",
                    user?.plan === 'premium' && "bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-500/20 text-white shadow-blue-500/20",
                    (user?.plan === 'premium_ia' || user?.plan === 'enterprise') && "bg-gradient-to-r from-purple-600 to-pink-600 border-purple-500/20 text-white shadow-purple-500/20"
                )}>
                    <div className={cn(
                        "w-2 h-2 rounded-full animate-pulse",
                        user?.plan === 'free' ? "bg-slate-400" : "bg-white"
                    )} />
                    <span className="text-xs font-bold uppercase tracking-wide">
                        {user?.plan === 'premium_ia' ? 'FINCORE IA' : displayUser.planLabel}
                    </span>
                </div>

                {/* Theme Toggle */}
                <ModeToggle />

                {/* Notifications */}
                <button className="relative group h-10 w-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
                    <Bell className="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200" />
                </button>

                {/* User dropdown */}
                <UserDropdown name={displayUser.name} initials={displayUser.initials} avatarUrl={displayUser.avatarUrl} />
            </div>
        </header>
    )
}
