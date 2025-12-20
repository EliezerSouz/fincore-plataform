"use client"

import { useState, useEffect } from "react"
import { MoreHorizontal, Trash2, Eye, Edit2, TrendingDown, AlertCircle, Lock, CheckCircle, CreditCard as CreditCardIcon } from "lucide-react"
import { CreditCard, deleteCreditCard } from "./actions"
import { formatCurrency, cn } from "@/lib/utils"
import Link from "next/link"
import { usePrimaryCard } from "@/hooks/use-primary-card"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { InlineInsight } from "@/components/inline-insight"
import { generateRuleBasedCreditCardInsight, type AIInsight } from "@/lib/ai/insights-rules"
import { EditCardDialog } from "./edit-card-dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { getTextColor, isLightColor, adjustBrightness } from "@/lib/utils/colors"

export function CreditCardItem({ card, isLocked = false }: { card: CreditCard, isLocked?: boolean }) {
    const { setPrimary } = usePrimaryCard()
    const [isDeleting, setIsDeleting] = useState(false)
    const [showEdit, setShowEdit] = useState(false)
    const [insight, setInsight] = useState<AIInsight | null>(null)

    // Calcular percentual de uso do limite
    const usedPercentage = card.available_limit !== undefined
        ? ((card.limit_amount - card.available_limit) / card.limit_amount) * 100
        : 0

    const isHighUsage = usedPercentage > 80
    const isCriticalUsage = usedPercentage > 95

    // Gera insight para o cartão
    useEffect(() => {
        // Só gera insight para situações críticas (uso alto do limite)
        if (usedPercentage < 70) {
            setInsight(null)
            return
        }

        const loadInsight = async () => {
            const ruleInsight = generateRuleBasedCreditCardInsight(card)
            setInsight(ruleInsight)
        }

        loadInsight()
    }, [card, usedPercentage])

    const handleDelete = async () => {
        try {
            await deleteCreditCard(card.id)
            toast.success("Cartão excluído com sucesso")
        } catch (error) {
            toast.error("Erro ao excluir cartão")
        } finally {
            setIsDeleting(false)
        }
    }

    const textColor = getTextColor(card.color)
    const isLight = isLightColor(card.color)

    return (
        <>
            <div className="group relative">
                {isLocked && (
                    <div className="absolute inset-0 z-20 bg-background/50 backdrop-blur-[1px] rounded-xl flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800">
                        <div className="bg-background/90 p-4 rounded-lg shadow-lg border text-center max-w-[80%]">
                            <Lock className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm font-medium">Cartão Bloqueado</p>
                            <p className="text-xs text-muted-foreground mt-1">Upgrade para acessar múltiplos cartões</p>
                        </div>
                    </div>
                )}

                <Link href={isLocked ? '#' : `/compromissos/cards/${card.id}`}>
                    <div
                        className={cn(
                            "relative overflow-hidden rounded-xl transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer h-[220px] flex flex-col justify-between",
                            isLocked && "opacity-40 pointer-events-none"
                        )}
                        style={{
                            backgroundColor: card.color,
                            background: `linear-gradient(135deg, ${card.color} 0%, ${adjustBrightness(card.color, -30)} 100%)`,
                            color: textColor,
                            boxShadow: `0 10px 30px -10px ${card.color}50`
                        }}
                    >
                        {/* Texture Overlay */}
                        <div className="absolute inset-0 opacity-10 pointer-events-none"
                            style={{
                                backgroundImage: 'radial-gradient(circle at 100% 100%, rgba(255,255,255,0.2) 0%, transparent 50%), radial-gradient(circle at 0% 0%, rgba(255,255,255,0.2) 0%, transparent 50%)',
                                backgroundSize: '100% 100%'
                            }}></div>
                        
                        <div
                            className="absolute -right-8 -bottom-12 transform rotate-[15deg] pointer-events-none transition-transform group-hover:scale-110 duration-700"
                            style={{
                                color: isLight ? 'black' : 'white',
                                opacity: 0.05
                            }}
                        >
                            <CreditCardIcon className="w-48 h-48" />
                        </div>

                        {/* Header */}
                        <div className="relative z-10 p-6 flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-lg tracking-tight truncate max-w-[150px]">{card.name}</h3>
                                <p className={cn("text-xs opacity-80 uppercase tracking-widest font-medium mt-0.5", isLight ? "text-slate-900" : "text-white")}>
                                    {card.brand || 'Cartão'}
                                </p>
                            </div>
                            <div className="opacity-80">
                                {card.brand === 'master' && <div className="flex -space-x-2"><div className="w-6 h-6 rounded-full bg-red-500/90 mix-blend-multiply"></div><div className="w-6 h-6 rounded-full bg-yellow-500/90 mix-blend-multiply"></div></div>}
                                {card.brand === 'visa' && <span className="font-bold italic text-xl tracking-tighter">VISA</span>}
                                {!['master', 'visa'].includes(card.brand || '') && <CreditCardIcon className="w-6 h-6" />}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="relative z-10 px-6 pb-6 mt-auto">
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between items-end mb-1">
                                        <span className={cn("text-xs font-medium uppercase tracking-wider opacity-80", isLight ? "text-slate-800" : "text-slate-200")}>Limite Disponível</span>
                                        <span className="font-mono font-bold text-lg leading-none">
                                            {formatCurrency(card.available_limit || 0)}
                                        </span>
                                    </div>
                                    
                                    {/* Progress Bar Customizada */}
                                    <div className="h-1.5 w-full bg-black/10 rounded-full overflow-hidden backdrop-blur-sm">
                                        <div 
                                            className={cn("h-full rounded-full transition-all duration-500", 
                                                isCriticalUsage ? "bg-red-500" : 
                                                isHighUsage ? "bg-yellow-500" : 
                                                "bg-white"
                                            )}
                                            style={{ width: `${Math.min(usedPercentage, 100)}%` }}
                                        />
                                    </div>
                                    
                                    <div className="flex justify-between mt-1.5 text-[10px] font-medium opacity-70">
                                        <span>Usado: {Math.round(usedPercentage)}%</span>
                                        <span>Total: {formatCurrency(card.limit_amount)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Actions Menu */}
                <div className="absolute top-4 right-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-md border border-white/10 text-white hover:bg-white/30 shadow-sm">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setPrimary(card.id)}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Definir como Principal
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setShowEdit(true)}>
                                <Edit2 className="mr-2 h-4 w-4" />
                                Editar Cartão
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                onClick={() => setIsDeleting(true)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir Cartão
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* AI Insight Inline */}
            {insight && (
                <div className="mt-2 -mx-1">
                    <InlineInsight 
                        title={insight.title}
                        description={insight.description}
                        variant={insight.type}
                        className="text-xs py-2"
                    />
                </div>
            )}

            <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Cartão</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir o cartão <strong>{card.name}</strong>?
                            Esta ação não pode ser desfeita e excluirá todo o histórico de faturas e transações associadas.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            Excluir Cartão
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <EditCardDialog 
                card={card}
                open={showEdit}
                onOpenChange={setShowEdit}
            />
        </>
    )
}
