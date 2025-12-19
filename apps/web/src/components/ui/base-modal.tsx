"use client"

import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface BaseModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string | React.ReactNode
    description?: string | React.ReactNode
    children: React.ReactNode
    primaryButton?: {
        label: string
        onClick?: () => void
        isLoading?: boolean
        disabled?: boolean
        form?: string
        type?: "button" | "submit"
        className?: string
    }
    secondaryButton?: {
        label: string
        onClick?: () => void
        disabled?: boolean
        variant?: "ghost" | "outline" | "secondary"
    }
    maxWidth?: string
    className?: string
}

export function BaseModal({
    open,
    onOpenChange,
    title,
    description,
    children,
    primaryButton,
    secondaryButton,
    maxWidth = "sm:max-w-[500px]",
    className,
}: BaseModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={cn(maxWidth, "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800", className)}>
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        {title}
                    </DialogTitle>
                    {description && (
                        <DialogDescription>
                            {description}
                        </DialogDescription>
                    )}
                </DialogHeader>

                <div className="py-2">
                    {children}
                </div>

                {(primaryButton || secondaryButton) && (
                    <DialogFooter className="flex flex-row justify-end gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                        {secondaryButton && (
                            <Button
                                type="button"
                                variant={secondaryButton.variant || "ghost"}
                                onClick={secondaryButton.onClick || (() => onOpenChange(false))}
                                disabled={secondaryButton.disabled}
                                className="text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                                {secondaryButton.label}
                            </Button>
                        )}
                        {primaryButton && (
                            <Button
                                type={primaryButton.type || "button"}
                                form={primaryButton.form}
                                onClick={primaryButton.onClick}
                                disabled={primaryButton.disabled || primaryButton.isLoading}
                                className={cn(
                                    "font-bold shadow-md h-11 transition-all active:scale-95 px-6 min-w-[140px]",
                                    !primaryButton.className?.includes("bg-") && "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20",
                                    primaryButton.className
                                )}
                            >
                                {primaryButton.isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : null}
                                {primaryButton.label}
                            </Button>
                        )}
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    )
}
