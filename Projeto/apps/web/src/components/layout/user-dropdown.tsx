"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"

interface UserDropdownProps {
    name: string
    initials: string
    avatarUrl?: string | null
}

export function UserDropdown({ name, initials, avatarUrl }: UserDropdownProps) {
    const router = useRouter()
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    const triggerButton = (
        <button className="flex items-center gap-3 pl-2 h-11 border-l border-gray-200 dark:border-white/10 outline-none">
            <div className="text-right hidden md:block">
                <p className="text-sm font-medium leading-none text-gray-900 dark:text-gray-100">{name}</p>
            </div>
            <Avatar className="h-10 w-10 ring-2 ring-transparent group-hover:ring-blue-500/20 transition-all">
                <AvatarImage src={avatarUrl || ""} alt={name} className="object-cover" />
                <AvatarFallback className="bg-blue-600 text-white font-medium">{initials}</AvatarFallback>
            </Avatar>
        </button>
    )

    if (!isMounted) {
        return triggerButton
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                {triggerButton}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-2">
                <DropdownMenuItem>Minha Conta</DropdownMenuItem>
                <DropdownMenuItem>Configurações</DropdownMenuItem>
                <DropdownMenuItem 
                    className="text-red-500 focus:text-red-500 cursor-pointer"
                    onClick={() => router.push('/logout')}
                >
                    Sair
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
