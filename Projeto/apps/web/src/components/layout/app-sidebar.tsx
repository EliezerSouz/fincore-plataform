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
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    useSidebar,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { Logo } from "@/components/ui/logo"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ModeToggle } from "@/components/layout/mode-toggle"
import { useUser } from "@/providers/user-provider"
import { formatCurrency, cn } from "@/lib/utils"
import { siteConfig } from "@/config/site"

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
        <Sidebar collapsible="icon" {...props} className="border-r border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-[#09090b] text-zinc-600 dark:text-zinc-400">
            <SidebarHeader className="h-20 border-b border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-[#09090b] flex justify-center">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <div title={siteConfig.slogan} className="flex items-center gap-3 px-2 transition-all group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
                            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold shadow-lg shadow-blue-500/20 group-data-[collapsible=icon]:h-9 group-data-[collapsible=icon]:w-9">
                                <Heart className="w-5 h-5 fill-white text-white" />
                                <div className="absolute inset-0 rounded-xl bg-white/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden opacity-100 transition-opacity duration-300">
                                <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                                    {siteConfig.name}
                                </span>
                                <span className="text-[10px] text-zinc-500 font-medium tracking-wider uppercase">
                                    v0.1.0 Beta
                                </span>
                            </div>
                        </div>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="bg-zinc-50 dark:bg-[#09090b] px-2 py-4">
                
                {/* 1. VISÃO GERAL */}
                <SidebarGroup>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                isActive={isActive("/dashboard")}
                                className="h-10 font-medium data-[active=true]:bg-zinc-900 data-[active=true]:text-white dark:data-[active=true]:bg-white dark:data-[active=true]:text-zinc-900 shadow-sm transition-all hover:bg-zinc-200 dark:hover:bg-white/10"
                            >
                                <Link href="/dashboard">
                                    <LayoutDashboard className="h-4 w-4" />
                                    <span>Visão Geral</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>

                {/* 2. CAIXA (Cash Management) */}
                <SidebarGroup>
                    <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-2 mb-2 flex items-center justify-between">
                        <span>Caixa</span>
                        <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-200/50 dark:bg-white/5 px-1.5 py-0.5 rounded">
                            {formatCurrency(liquidez)}
                        </span>
                    </SidebarGroupLabel>
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
                                    className="data-[active=true]:text-blue-600 dark:data-[active=true]:text-blue-400 data-[active=true]:bg-blue-50 dark:data-[active=true]:bg-blue-900/10 font-medium"
                                >
                                    <Link href={item.url}>
                                        <item.icon className="h-4 w-4 opacity-70" />
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>

                {/* 3. COMPROMISSOS (Accounts Payable) */}
                <SidebarGroup>
                    <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-2 mb-2 flex items-center justify-between">
                        <span>Compromissos</span>
                        <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-200/50 dark:bg-white/5 px-1.5 py-0.5 rounded">
                            {formatCurrency(compromissos)}
                        </span>
                    </SidebarGroupLabel>
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
                                    className="data-[active=true]:text-amber-600 dark:data-[active=true]:text-amber-400 data-[active=true]:bg-amber-50 dark:data-[active=true]:bg-amber-900/10 font-medium"
                                >
                                    <Link href={item.url}>
                                        <item.icon className="h-4 w-4 opacity-70" />
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>

                {/* 4. PATRIMÔNIO (Investments) */}
                <SidebarGroup>
                    <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-2 mb-2 flex items-center justify-between">
                        <span>Patrimônio</span>
                        <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-200/50 dark:bg-white/5 px-1.5 py-0.5 rounded">
                            {formatCurrency(patrimonio)}
                        </span>
                    </SidebarGroupLabel>
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
                                    className="data-[active=true]:text-emerald-600 dark:data-[active=true]:text-emerald-400 data-[active=true]:bg-emerald-50 dark:data-[active=true]:bg-emerald-900/10 font-medium"
                                >
                                    <Link href={item.url}>
                                        <item.icon className="h-4 w-4 opacity-70" />
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>

                {/* SISTEMA */}
                <SidebarGroup className="mt-auto">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                isActive={isActive("/sistema/settings")}
                                tooltip="Configurações"
                                className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                            >
                                <Link href="/sistema/settings">
                                    <Settings className="h-4 w-4" />
                                    <span>Configurações do Sistema</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>

            </SidebarContent>

            <SidebarFooter className="bg-zinc-50 dark:bg-[#09090b] border-t border-zinc-200 dark:border-white/5 p-4">
                <UserNav />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}

function UserNav() {
    const router = useRouter()
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
                        <Link href="/sistema/account" className="flex items-center cursor-pointer py-2 px-3 rounded-md transition-colors hover:bg-slate-100 dark:hover:bg-white/10">
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Minha Conta</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-white/5" />
                    <DropdownMenuItem 
                        className="flex items-center cursor-pointer text-red-600 dark:text-red-400 py-2 px-3 rounded-md transition-colors hover:bg-red-50 dark:hover:bg-red-900/10 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/10"
                        onClick={() => router.push('/logout')}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sair</span>
                    </DropdownMenuItem>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
