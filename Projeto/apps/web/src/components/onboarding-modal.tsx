"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { BaseModal } from "@/components/ui/base-modal"
import { PartyPopper, CheckCircle2, Shield, Star, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUser } from "@/providers/user-provider"

export function OnboardingModal() {
    const [open, setOpen] = useState(false)
    const searchParams = useSearchParams()
    const router = useRouter()
    const { user } = useUser()

    const promoApplied = searchParams.get("promo_applied") === "true"
    const isPremiumIA = user?.plan === 'premium_ia' || user?.plan === 'enterprise'

    useEffect(() => {
        if (searchParams.get("welcome") === "true") {
            setOpen(true)
        }
    }, [searchParams])

    const handleClose = () => {
        setOpen(false)
        const params = new URLSearchParams(searchParams.toString())
        params.delete("welcome")
        params.delete("promo_applied")
        router.replace(`/dashboard?${params.toString()}`)
    }

    const title = promoApplied
        ? (isPremiumIA ? "FINCORE IA Liberado!" : "FINCORE Premium Ativado!")
        : "Seja bem-vindo ao FINCORE."

    const description = promoApplied
        ? (isPremiumIA
            ? "Você desbloqueou o poder do FINCORE IA e todos os recursos Premium para testar."
            : "Você liberou acesso exclusivo aos recursos Premium para testar.")
        : "Aqui começa o controle consciente da sua vida financeira."

    return (
        <BaseModal
            open={open}
            onOpenChange={handleClose}
            title={
                <div className="flex items-center gap-2">
                    {promoApplied ? <Star className="w-5 h-5 text-yellow-500 fill-current" /> : <PartyPopper className="w-5 h-5 text-blue-500" />}
                    {title}
                </div>
            }
            description={description}
            primaryButton={{
                label: "Começar a usar",
                onClick: handleClose,
                className: "bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
            }}
            secondaryButton={!promoApplied ? {
                label: "Conhecer Premium",
                onClick: () => window.open('/premium', '_blank'),
                variant: "ghost"
            } : undefined}
        >
            <div className="space-y-6">
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

                {!promoApplied && (
                    <p className="text-center text-[11px] text-slate-400 font-medium">
                        Você pode continuar no Free pelo tempo que quiser.
                    </p>
                )}
            </div>
        </BaseModal>
    )
}
