"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Crown, Lock, ArrowRight } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface UpsellModalProps {
    trigger?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
    title?: string
    description?: string
}

export function UpsellModal({
    trigger,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
    title = "Funcionalidade Premium",
    description = "Este recurso é exclusivo para assinantes Premium. Faça o upgrade para desbloquear."
}: UpsellModalProps) {
    const [internalOpen, setInternalOpen] = useState(false)

    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : internalOpen
    const onOpenChange = isControlled ? controlledOnOpenChange : setInternalOpen

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="z-[9999] sm:max-w-[425px] flex flex-col items-center text-center p-8 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
                    <Crown className="w-8 h-8 text-amber-600 dark:text-amber-500" />
                </div>
                <DialogTitle className="text-xl mb-2">{title}</DialogTitle>
                <DialogDescription className="text-center mb-6 text-slate-600 dark:text-slate-400">
                    {description}
                    <br /><br />
                    <span className="font-medium text-amber-600 dark:text-amber-500 block">
                        No Premium, você organiza melhor seus gastos e tem relatórios mais precisos.
                    </span>
                </DialogDescription>

                <Button
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02]"
                    onClick={() => {
                        // TODO: Redirecionar para página de planos ou checkout
                        toast.info('Em breve: Checkout Premium')
                        onOpenChange && onOpenChange(false)
                    }}
                >
                    Seja Premium <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                <p className="text-[10px] text-slate-400 mt-3 font-medium uppercase tracking-wide">
                    Cancele quando quiser
                </p>

                <Button
                    variant="ghost"
                    className="mt-1 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:bg-slate-800 h-11 font-normal transition-colors"
                    onClick={() => onOpenChange && onOpenChange(false)}
                >
                    Continuar no Grátis
                </Button>
            </DialogContent>
        </Dialog>
    )
}
