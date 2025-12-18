"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PartyPopper, CheckCircle2, Shield, Star, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUser } from "@/providers/user-provider"

export function OnboardingModal() {
    const [open, setOpen] = useState(false)
    const searchParams = useSearchParams()
    const router = useRouter()
    const { user } = useUser()

    // Check if promo was applied via URL param or assume from context if needed
    // But since backend might take a ms to sync, URL param is safer for immediate feedback
    const promoApplied = searchParams.get("promo_applied") === "true"
    const isPremiumIA = user?.plan === 'premium_ia' || user?.plan === 'enterprise'

    useEffect(() => {
        // Verifica se é o primeiro acesso pós-cadastro
        if (searchParams.get("welcome") === "true") {
            setOpen(true)
        }
    }, [searchParams])

    const handleClose = () => {
        setOpen(false)
        // Remove o parâmetro da URL sem recarregar a página para evitar que o modal volte no F5
        const params = new URLSearchParams(searchParams.toString())
        params.delete("welcome")
        params.delete("promo_applied")
        router.replace(`/dashboard?${params.toString()}`)
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden gap-0 border-none shadow-2xl">
                {/* Header Visual */}
                <div className={cn(
                    "p-8 text-center text-white relative overflow-hidden",
                    promoApplied ? "bg-gradient-to-br from-indigo-600 to-purple-700" : "bg-gradient-to-br from-blue-600 to-indigo-700"
                )}>
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <PartyPopper className="w-48 h-48 rotate-12" />
                    </div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 shadow-lg ring-1 ring-white/30">
                            {promoApplied ? <Star className="w-8 h-8 text-yellow-300 fill-current" /> : <PartyPopper className="w-8 h-8 text-white" />}
                        </div>
                        <DialogTitle className="text-2xl font-bold tracking-tight mb-2 text-white">
                            {promoApplied
                                ? (isPremiumIA ? "FINCORE IA Liberado!" : "FINCORE Premium Ativado!")
                                : "Seja bem-vindo ao FINCORE."}
                        </DialogTitle>
                        <DialogDescription className="text-blue-100 text-base max-w-sm mx-auto">
                            {promoApplied
                                ? (isPremiumIA
                                    ? "Você desbloqueou o poder do FINCORE IA e todos os recursos Premium para testar."
                                    : "Você liberou acesso exclusivo aos recursos Premium para testar.")
                                : "Aqui começa o controle consciente da sua vida financeira."}
                        </DialogDescription>
                    </div>
                </div>

                {/* Conteúdo Informativo */}
                <div className="p-6 md:p-8 bg-white dark:bg-slate-950 space-y-6">
                    <div className="space-y-4">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <div className="relative">
                                {promoApplied
                                    ? <Star className="w-5 h-5 text-yellow-500 fill-current" />
                                    : (
                                        <>
                                            <Shield className="w-5 h-5 text-blue-500" />
                                            <Star className="w-2.5 h-2.5 text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[45%] fill-current" />
                                        </>
                                    )
                                }
                            </div>
                            {promoApplied ? "Seu plano temporário está ativo" : "Você está no Plano FINCORE Free"}
                        </h3>

                        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800 space-y-3">
                            {promoApplied ? (
                                <>
                                    <div className="flex gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Inteligência Artificial Financeira</p>
                                            <p className="text-xs text-slate-500">Insights automáticos sobre seus gastos e receitas.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Gestão Inteligente</p>
                                            <p className="text-xs text-slate-500">Controle total de categorias e gestão de recorrências.</p>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Lançamentos Ilimitados</p>
                                            <p className="text-xs text-slate-500">Registre todas as suas receitas e despesas livremente.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Uso Diário Completo</p>
                                            <p className="text-xs text-slate-500">Acesse dashboards, categorias e controle de contas.</p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 italic text-center px-4">
                            {promoApplied
                                ? "Aproveite para explorar todo o potencial da inteligência artificial nas suas finanças."
                                : "\"O plano FINCORE Free é perfeito para o dia a dia. Recursos de IA são exclusivos do FINCORE Premium e estarão lá quando você precisar.\""
                            }
                        </p>
                    </div>
                </div>

                {/* Footer Ações */}
                <DialogFooter className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 w-full">
                        {!promoApplied && (
                            <Button variant="ghost" className="w-full sm:w-auto text-slate-500" onClick={() => window.open('/premium', '_blank')}>
                                Conhecer o FINCORE Premium
                            </Button>
                        )}
                        <Button className="w-full sm:w-auto flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleClose}>
                            Começar a usar
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                    {!promoApplied && (
                        <p className="text-center text-[11px] text-slate-400 font-medium">
                            Você pode continuar no Free pelo tempo que quiser.
                        </p>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
