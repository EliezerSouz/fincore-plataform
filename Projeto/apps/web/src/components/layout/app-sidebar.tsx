"use client"

import * as React from "react"
import {
    LayoutDashboard,
    Wallet,
    CreditCard,
    PieChart,
    Settings,
    ArrowRightLeft,
    Target,
    BarChart3,
    Landmark,
    CalendarClock,
    ChevronDown,
    LogOut,
    Shield,
    TrendingUp,
    Tag,
    AlertCircle,
    Building2,
    Coins,
    Activity,
    Heart,
    Loader2,
    Beaker
} from "lucide-react"



import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    useSidebar,
} from "@/components/ui/sidebar"
import { Logo } from "@/components/ui/logo"
import { usePathname } from "next/navigation"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ModeToggle } from "@/components/layout/mode-toggle"
import { signout } from "@/app/actions"
import { useUser } from "@/providers/user-provider"
import { formatCurrency, cn } from "@/lib/utils"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
    stats?: {
        liquidez: number
        compromissos: number
        patrimonio: number
    }
}

export function AppSidebar({ stats, ...props }: AppSidebarProps) {
    const pathname = usePathname()
    // stats são passados como prop, removendo necessidade de hook com polling
    const liquidez = stats?.liquidez || 0
    const compromissos = stats?.compromissos || 0
    const patrimonio = stats?.patrimonio || 0

    const isActive = (url: string) => pathname === url || pathname?.startsWith(`${url}/`)
    const { user, isLoading } = useUser()

    const planLabel = user?.planLabel || "FREE"
    const isPremium = user?.isPremium || false
    const daysRemaining = user?.trialDaysRemaining || 0
    const isTemp = user?.trialDaysRemaining && user?.trialDaysRemaining > 0 // Assuming logic maps back to trialDaysRemaining for temp access display or we need a new field.
    // Actually user provider maps things to 'trialDaysRemaining'.



    return (
        <Sidebar collapsible="icon" {...props} className="border-r border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#0F172A] text-slate-600 dark:text-slate-300">
            <SidebarHeader className="h-16 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#0F172A]">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <div className="flex items-center gap-3 px-2 py-1 transition-all group-data-[collapsible=icon]:justify-center">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold shadow-md">
                                <span className="flex items-center">F<Heart className="w-2.5 h-2.5 ml-px fill-rose-500 text-rose-500" /></span>
                            </div>
                            <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden opacity-100 transition-opacity duration-300">
                                <Logo size="lg" />
                                <span className="text-[10px] text-muted-foreground font-medium tracking-wide">
                                    O coração da sua vida financeira.
                                </span>
                            </div>
                        </div>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="bg-slate-50 dark:bg-[#0F172A] pt-4">
                <div className="px-3 space-y-6">
                    {/* 1. VISÃO (Navegação Pura) */}
                    <div>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isActive("/dashboard")}
                                    className="h-10 font-medium data-[active=true]:bg-blue-600 data-[active=true]:text-white data-[active=true]:shadow-md transition-all hover:bg-slate-200 dark:hover:bg-white/10"
                                >
                                    <a href="/dashboard">
                                        <div className="flex items-center justify-center w-5 h-5 rounded bg-blue-100 text-blue-600 data-[active=true]:bg-white/20 data-[active=true]:text-white dark:bg-blue-900/50 dark:text-blue-300 mr-2">
                                            <LayoutDashboard className="h-4 w-4" />
                                        </div>
                                        <span>Dashboard</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </div>

                    {/* 2. CAIXA (Cash Management) */}
                    <div>
                        <div className="flex items-center justify-between px-3 mb-2 mt-4 group-data-[collapsible=icon]:hidden">
                            <h3 className="text-xs font-black text-slate-900 dark:text-slate-100/90 uppercase tracking-wider flex items-center gap-1.5">
                                <Coins className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                CAIXA
                            </h3>
                            <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full shadow-sm">
                                {formatCurrency(liquidez)}
                            </span>
                        </div>
                        <SidebarMenu>
                            {[
                                { title: "Transações", url: "/caixa/transactions", icon: ArrowRightLeft },
                                { title: "Minhas Contas", url: "/caixa/accounts", icon: Landmark },
                                { title: "Categorias", url: "/caixa/categories", icon: Tag },
                            ].map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive(item.url)}
                                        tooltip={item.title}
                                        className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white hover:bg-blue-50 dark:hover:bg-white/5 data-[active=true]:text-blue-700 dark:data-[active=true]:text-white data-[active=true]:bg-blue-50 dark:data-[active=true]:bg-white/5 data-[active=true]:border-l-2 data-[active=true]:border-blue-600 rounded-l-none pl-3 transition-all"
                                    >
                                        <a href={item.url}>
                                            <item.icon className="h-4 w-4 opacity-70" />
                                            <span>{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </div>

                    {/* 3. COMPROMISSOS (Accounts Payable) */}
                    <div>
                        <div className="flex items-center justify-between px-3 mb-2 mt-4 group-data-[collapsible=icon]:hidden">
                            <h3 className="text-xs font-black text-slate-900 dark:text-slate-100/90 uppercase tracking-wider flex items-center gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                COMPROMISSOS
                            </h3>
                            <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full shadow-sm">
                                {formatCurrency(compromissos)}
                            </span>
                        </div>
                        <SidebarMenu>
                            {[
                                { title: "Cartões de Crédito", url: "/compromissos/cards", icon: CreditCard },
                                { title: "Contas a Pagar", url: "/compromissos/payables", icon: CalendarClock },
                            ].map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive(item.url)}
                                        tooltip={item.title}
                                        className="text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-white hover:bg-amber-50 dark:hover:bg-white/5 data-[active=true]:text-amber-700 dark:data-[active=true]:text-white data-[active=true]:bg-amber-50 dark:data-[active=true]:bg-white/5 data-[active=true]:border-l-2 data-[active=true]:border-amber-500 rounded-l-none pl-3 transition-all"
                                    >
                                        <a href={item.url}>
                                            <item.icon className="h-4 w-4 opacity-70" />
                                            <span>{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </div>

                    {/* 4. PATRIMÔNIO (Investments) */}
                    <div>
                        <div className="flex items-center justify-between px-3 mb-2 mt-4 group-data-[collapsible=icon]:hidden">
                            <h3 className="text-xs font-black text-slate-900 dark:text-slate-100/90 uppercase tracking-wider flex items-center gap-1.5">
                                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                PATRIMÔNIO
                            </h3>
                            <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full shadow-sm">
                                {formatCurrency(patrimonio)}
                            </span>
                        </div>
                        <SidebarMenu>
                            {[
                                { title: "Meus Investimentos", url: "/patrimonio/investments", icon: PieChart },
                                { title: "Metas & Planejamento", url: "/patrimonio/planning", icon: Target },
                            ].map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive(item.url)}
                                        tooltip={item.title}
                                        className="text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-white hover:bg-emerald-50 dark:hover:bg-white/5 data-[active=true]:text-emerald-700 dark:data-[active=true]:text-white data-[active=true]:bg-emerald-50 dark:data-[active=true]:bg-white/5 data-[active=true]:border-l-2 data-[active=true]:border-emerald-500 rounded-l-none pl-3 transition-all"
                                    >
                                        <a href={item.url}>
                                            <item.icon className="h-4 w-4 opacity-70" />
                                            <span>{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </div>


                    {/* SISTEMA */}
                    <div>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isActive("/sistema/settings")}
                                    tooltip="Configurações"
                                    className="text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                                >
                                    <a href="/sistema/settings">
                                        <Settings className="h-4 w-4" />
                                        <span>Sistema</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>


                        </SidebarMenu>
                    </div>
                </div>
            </SidebarContent>

            <SidebarFooter className="bg-slate-50 dark:bg-[#0F172A] border-t border-slate-200 dark:border-white/5 p-4">
                <UserNav />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}

function UserNav() {
    const [isMounted, setIsMounted] = React.useState(false)
    const { isMobile } = useSidebar()
    const { user, isLoading } = useUser()

    React.useEffect(() => {
        setIsMounted(true)
    }, [])

    const displayUser = user || {
        name: isLoading ? "Carregando..." : "Usuário",
        email: isLoading ? "..." : "usuario@exemplo.com",
        initials: "...",
        planLabel: isLoading ? "..." : "Gratuito",
        avatarUrl: null
    }

    if (!isMounted) {
        return (
            <div className="flex items-center gap-2 p-2">
                <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
                <div className="flex-1 space-y-1">
                    <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                    <div className="h-2 w-12 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                </div>
            </div>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="data-[state=open]:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/5 transition-colors group">
                    <Avatar className="h-8 w-8 rounded-lg border border-slate-200 dark:border-white/10">
                        <AvatarImage src={displayUser.avatarUrl || ""} alt="User" className="object-cover" />
                        <AvatarFallback className="rounded-lg bg-blue-700 text-white font-bold">{displayUser.initials}</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                        <span className="truncate font-semibold text-slate-700 dark:text-white">{displayUser.name}</span>
                        <span className="truncate text-xs text-slate-500">{displayUser.planLabel}</span>
                    </div>
                    <ChevronDown className="ml-auto size-4 text-slate-500 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl bg-white dark:bg-[#1E293B] border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 shadow-xl" side={isMobile ? "bottom" : "right"} align="end" sideOffset={8}>
                <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-3 px-3 py-3 text-left text-sm border-b border-slate-100 dark:border-white/5">
                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-bold text-slate-900 dark:text-white">{displayUser.name}</span>
                            <span className="truncate text-xs text-slate-500">{displayUser.email}</span>
                        </div>
                    </div>
                </DropdownMenuLabel>
                <div className="p-1">
                    <DropdownMenuItem asChild>
                        <a href="/sistema/account" className="flex items-center cursor-pointer py-2 px-3 rounded-md transition-colors hover:bg-slate-100 dark:hover:bg-white/10">
                            <Settings className="mr-2 h-4 w-4" />
                            Minha Conta
                        </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer py-2 px-3 rounded-md transition-colors select-none hover:bg-slate-100 dark:hover:bg-white/10">
                        <div className="flex w-full items-center justify-between">
                            <span>Tema</span>
                            <ModeToggle />
                        </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        asChild
                        className="text-red-600 dark:text-red-400 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950/30 cursor-pointer py-2 px-3 rounded-md transition-colors"
                    >
                        <form action={signout} className="w-full">
                            <button type="submit" className="flex w-full items-center">
                                <LogOut className="mr-2 h-4 w-4" />
                                Sair do Sistema
                            </button>
                        </form>
                    </DropdownMenuItem>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
