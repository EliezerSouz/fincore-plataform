"use client"

import { Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import { UserDropdown } from "@/components/layout/user-dropdown"
import { useUser } from "@/providers/user-provider"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Logo } from "@/components/logo"

export function TopBar() {
    const { user, isLoading } = useUser()

    // Fallback data
    const displayUser = user || {
        name: isLoading ? "Carregando..." : "Usuário",
        initials: "...",
        planLabel: isLoading ? "Carregando..." : "Gratuito",
        avatarUrl: null
    }

    return (
        <header className="flex items-center justify-between h-16 px-4 md:px-8 bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-md border-b border-gray-200/50 dark:border-white/5 sticky top-0 z-30 transition-all">
            {/* Mobile Menu Button */}
            <div className="md:hidden">
                <SidebarTrigger className="h-9 w-9" />
            </div>

            {/* Logo/Title */}
            <div className="hidden md:block">
                <Logo size="sm" />
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-2 md:space-x-6 ml-auto">
                {/* Subscription status */}
                {/* Subscription status */}
                <div className={cn(
                    "hidden md:flex items-center gap-2 px-3 py-1 rounded-full border shadow-sm transition-all",
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

                {/* Notifications */}
                <button className="relative group p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
                    <Bell className="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200" />
                </button>

                {/* User dropdown */}
                <UserDropdown name={displayUser.name} initials={displayUser.initials} avatarUrl={displayUser.avatarUrl} />
            </div>
        </header>
    )
}
