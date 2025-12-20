"use client"

import { useState, useEffect } from "react"
import { MoreHorizontal, Trash2, Eye, Edit2, TrendingDown, AlertCircle, Lock, CheckCircle } from "lucide-react"
import { CreditCard, deleteCreditCard } from "./actions"
import { formatCurrency, cn } from "@/lib/utils"
import Link from "next/link"
import { usePrimaryCard } from "@/hooks/use-primary-card"
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
import { generateCreditCardInsight } from "@/lib/ai/ai-insights"
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

function adjustBrightness(col: string, amt: number) {
    var usePound = false;
    if (col[0] == "#") {
        col = col.slice(1);
        usePound = true;
    }
    var num = parseInt(col, 16);
    var r = (num >> 16) + amt;
    if (r > 255) r = 255;
    else if (r < 0) r = 0;
    var b = ((num >> 8) & 0x00FF) + amt;
    if (b > 255) b = 255;
    else if (b < 0) b = 0;
    var g = (num & 0x0000FF) + amt;
    if (g > 255) g = 255;
    else if (g < 0) g = 0;
    return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16);
}

// Função para detectar se a cor é clara e precisa de texto escuro
function isLightColor(hex: string): boolean {
    // Remove o # se existir
    const color = hex.replace('#', '');

    // Converte para RGB
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);

    // Calcula a luminosidade (fórmula YIQ)
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

    // Se luminosidade > 128, é uma cor clara
    return yiq >= 128;
}

// Retorna a cor do texto baseada na cor de fundo
function getTextColor(bgColor: string): string {
    // Amarelo do BB e cores claras usam azul escuro
    if (bgColor.toLowerCase() === '#ffcc00' || isLightColor(bgColor)) {
        return '#003087'; // Azul escuro do BB
    }
    return '#ffffff'; // Branco para cores escuras
}

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
            try {
                // Tenta usar IA (Groq)
                const aiInsight = await generateCreditCardInsight(
                    card.name,
                    card.limit_amount,
                    card.available_limit || card.limit_amount,
                    usedPercentage
                )

                if (aiInsight) {
                    setInsight(aiInsight)
                    return
                }
            } catch (error) {
                console.log('IA não disponível, usando regras')
            }

            // Fallback: usa regras
            const ruleInsight = generateRuleBasedCreditCardInsight(
                card.limit_amount,
                card.available_limit || card.limit_amount,
                usedPercentage
            )
            setInsight(ruleInsight)
        }

        loadInsight()
    }, [card.available_limit, card.limit_amount, usedPercentage, card.name])

    const [showDeleteDialog, setShowDeleteDialog] = useState(false)

    function handleDeleteClick(e: React.MouseEvent) {
        e.preventDefault()
        e.stopPropagation()
        setShowDeleteDialog(true)
    }

    async function handleConfirmDelete() {
        setIsDeleting(true)
        try {
            console.log('Iniciando exclusão do cartão:', card.id)
            await deleteCreditCard(card.id)
            console.log('Exclusão finalizada com sucesso (frontend)')
        } catch (e: any) {
            console.error('Erro no frontend ao excluir:', e)
            alert(`Erro ao excluir: ${e.message}`)
        } finally {
            setIsDeleting(false)
            setShowDeleteDialog(false)
        }
    }

    return (
        <div className="relative group">
            {/* Menu de Ações - Posicionado no canto superior direito */}
            <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white border border-white/20"
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {!isLocked && (
                            <DropdownMenuItem onClick={() => setShowEdit(true)} className="cursor-pointer">
                                <Edit2 className="mr-2 h-4 w-4" />
                                Editar
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem asChild className="cursor-pointer">
                            <Link href={`/compromissos/cards/${card.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Faturas
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-red-600 focus:text-red-600 cursor-pointer"
                            onClick={handleDeleteClick}
                            disabled={isDeleting}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Cartão de Crédito */}
            <Link href={`/compromissos/cards/${card.id}`}>
                {/* ... conteúdo do cartão ... */}
                <div
                    className={cn(
                        "relative w-full aspect-[1.586/1] rounded-xl shadow-lg transform transition-all hover:scale-[1.02] hover:shadow-2xl overflow-hidden cursor-pointer",
                        isLocked && "grayscale opacity-90 hover:scale-100 hover:shadow-lg cursor-default"
                    )}
                    style={{
                        backgroundColor: card.color,
                        background: `linear-gradient(135deg, ${card.color} 0%, ${adjustBrightness(card.color, -30)} 100%)`,
                        color: getTextColor(card.color)
                    }}
                >
                    {/* Texture Overlay */}
                    <div className="absolute inset-0 opacity-20"
                        style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>

                    <div className="absolute inset-0 p-5 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                                {/* Chip Simulado */}
                                <div className="w-10 h-8 bg-yellow-200/80 rounded-md border border-yellow-400/50 flex items-center justify-center overflow-hidden relative">
                                    <div className="absolute inset-x-0 top-1/2 h-px bg-yellow-600/30"></div>
                                    <div className="absolute inset-y-0 left-1/3 w-px bg-yellow-600/30"></div>
                                    <div className="absolute inset-y-0 right-1/3 w-px bg-yellow-600/30"></div>
                                </div>
                                {/* Contactless Icon */}
                                <span className="opacity-50 text-xl">)))</span>
                            </div>
                            <span className="font-mono text-sm uppercase tracking-widest opacity-80">{card.brand}</span>
                        </div>

                        <div className="space-y-1">
                            <p className="text-xs opacity-70 uppercase tracking-widest">Limite Disponível</p>
                            <p className="text-xl font-bold tracking-tight">
                                {card.available_limit !== undefined
                                    ? formatCurrency(card.available_limit)
                                    : formatCurrency(card.limit_amount)}
                            </p>
                            <p className="text-[10px] opacity-60">de {formatCurrency(card.limit_amount)}</p>
                        </div>

                        <div className="flex justify-between items-end">
                            <div>
                                <p className="font-medium tracking-wide shadow-black drop-shadow-md">{card.name}</p>
                                <p className="font-mono text-sm opacity-80">•••• {card.last_4_digits}</p>
                            </div>
                            <div className="text-[10px] text-right opacity-80 leading-tight">
                                <p>FECHA DIA {card.closing_day}</p>
                                <p>VENCE DIA {card.due_day}</p>
                            </div>
                        </div>
                    </div>

                    {/* Badge de Alerta (sobreposto no cartão) */}
                    {isCriticalUsage && (
                        <div className="absolute bottom-3 left-3 right-3 bg-red-500/90 backdrop-blur-sm text-white px-2 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-lg">
                            <AlertCircle className="w-3 h-3" />
                            Limite quase esgotado ({usedPercentage.toFixed(0)}%)
                        </div>
                    )}

                    {isHighUsage && !isCriticalUsage && (
                        <div className="absolute bottom-3 left-3 right-3 bg-amber-500/90 backdrop-blur-sm text-white px-2 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-lg">
                            <TrendingDown className="w-3 h-3" />
                            Atenção ao limite ({usedPercentage.toFixed(0)}%)
                        </div>
                    )}

                    {isLocked && (
                        <div className="absolute inset-0 z-20 bg-slate-900/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-white rounded-xl transition-all">
                            <div className="bg-slate-950/90 p-3 rounded-full mb-2 shadow-xl border border-slate-800">
                                <Lock className="w-5 h-5 text-slate-400" />
                            </div>
                            <span className="font-bold text-xs tracking-widest uppercase text-slate-200">Cartão Inativo</span>
                            <span className="text-[10px] text-slate-400 mt-1 font-medium bg-slate-950/50 px-2 py-0.5 rounded-full">Excedente do Plano Gratuito</span>
                        </div>
                    )}
                </div>
            </Link>

            {/* Insight IA/Regras (abaixo do cartão) */}
            {insight && (
                <div className="mt-3">
                    <InlineInsight insight={insight} size="sm" />
                </div>
            )}

            {/* Dialog de Edição */}
            <EditCardDialog card={card} open={showEdit} onOpenChange={setShowEdit} />

            {/* Dialog de Confirmação de Exclusão */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir cartão "{card.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza absoluta? Esta ação excluirá permanentemente o cartão,
                            todas as suas faturas e todas as transações associadas.
                            Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault()
                                handleConfirmDelete()
                            }}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            {isDeleting ? "Excluindo..." : "Confirmar Exclusão"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
