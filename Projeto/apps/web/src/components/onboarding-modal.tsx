"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { BaseModal } from "@/components/ui/base-modal"
import { PartyPopper, CheckCircle2, Shield, Star, ArrowRight, Gift, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUser } from "@/providers/user-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { validatePromoCode } from "@/app/actions/promo"
import { toast } from "sonner"

export function OnboardingModal() {
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState<'welcome' | 'promo'>('welcome')
    const [promoCode, setPromoCode] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    
    const searchParams = useSearchParams()
    const router = useRouter()
    const { user, refreshUser } = useUser()

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

    const handlePromoSubmit = async () => {
        if (!promoCode.trim()) {
            setError("Digite um código válido")
            return
        }
        
        setIsLoading(true)
        setError(null)
        
        try {
            const result = await validatePromoCode(promoCode)
            
            if (result.error) {
                setError(result.error)
                setIsLoading(false)
                return
            }
            
            if (result.success) {
                toast.success(`Código aplicado! Plano ${result.plan} ativado por ${result.days} dias.`)
                
                // 1. Atualizar contexto do usuário (Client-side)
                await refreshUser()
                
                // 2. Atualizar dados da página (Server-side)
                router.refresh()
                
                // 3. Fechar modal
                handleClose()
            }
        } catch (e) {
            setError("Erro ao validar código. Tente novamente.")
            setIsLoading(false)
        }
    }

    // Conteúdo da etapa 'welcome'
    const renderWelcomeContent = () => (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="flex items-start gap-3">
                    <div className="mt-1 bg-green-100 dark:bg-green-900/30 p-1.5 rounded-full">
                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm text-foreground">Controle Total</h4>
                        <p className="text-xs text-muted-foreground">Gerencie contas, cartões e despesas em um só lugar.</p>
                    </div>
                </div>
                
                <div className="flex items-start gap-3">
                    <div className="mt-1 bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-full">
                        <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm text-foreground">Segurança Garantida</h4>
                        <p className="text-xs text-muted-foreground">Seus dados são criptografados e protegidos.</p>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <div className="mt-1 bg-amber-100 dark:bg-amber-900/30 p-1.5 rounded-full">
                        <Star className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm text-foreground">Recursos Premium</h4>
                        <p className="text-xs text-muted-foreground">Inteligência Artificial, relatórios avançados e muito mais.</p>
                    </div>
                </div>
            </div>

            <div className="pt-4 flex flex-col gap-3">
                {/* Opção 1: Continuar Free */}
                <Button 
                    variant="outline" 
                    onClick={handleClose}
                    className="w-full justify-between h-auto py-3 px-4 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                    <span className="flex flex-col items-start">
                        <span className="font-semibold text-sm">Continuar no Plano Gratuito</span>
                        <span className="text-xs text-muted-foreground font-normal">Recursos essenciais para começar</span>
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                </Button>

                {/* Opção 2: Conhecer Premium */}
                <Button 
                    onClick={() => window.open('/premium', '_blank')}
                    className="w-full justify-between h-auto py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/20 border-0"
                >
                    <span className="flex flex-col items-start">
                        <span className="font-semibold text-sm flex items-center gap-2">
                            Conhecer Planos Premium
                            <Star className="w-3 h-3 fill-current text-yellow-300" />
                        </span>
                        <span className="text-xs text-blue-100 font-normal">Desbloqueie todo o potencial do FinCore</span>
                    </span>
                    <ArrowRight className="w-4 h-4 text-blue-200" />
                </Button>

                {/* Opção 3: Código Promocional */}
                <Button 
                    variant="ghost" 
                    onClick={() => setStep('promo')}
                    className="w-full text-xs text-muted-foreground hover:text-foreground mt-1"
                >
                    <Gift className="w-3 h-3 mr-2" />
                    Tenho um código promocional
                </Button>
            </div>
        </div>
    )

    // Conteúdo da etapa 'promo'
    const renderPromoContent = () => (
        <div className="space-y-6 pt-2">
            <div className="space-y-3">
                <Label htmlFor="promo-code">Código de Acesso</Label>
                <Input
                    id="promo-code"
                    placeholder="Ex: PROMO2025"
                    value={promoCode}
                    onChange={(e) => {
                        setPromoCode(e.target.value.toUpperCase())
                        setError(null)
                    }}
                    className={cn(
                        "uppercase text-center text-lg tracking-widest font-mono",
                        error && "border-red-500 focus-visible:ring-red-500"
                    )}
                />
                {error && (
                    <p className="text-sm text-red-500 font-medium flex items-center gap-1 justify-center animate-in fade-in slide-in-from-top-1">
                        {error}
                    </p>
                )}
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg text-xs text-muted-foreground text-center border border-slate-100 dark:border-slate-800">
                <p>Ao ativar um código, seu plano será atualizado imediatamente.</p>
            </div>
        </div>
    )

    const isWelcome = step === 'welcome'

    return (
        <BaseModal
            open={open}
            onOpenChange={handleClose}
            title={
                <div className="flex items-center gap-2">
                    {isWelcome ? (
                        <>
                            <PartyPopper className="w-5 h-5 text-blue-500" />
                            <span>Bem-vindo ao FinCore</span>
                        </>
                    ) : (
                        <>
                            <Gift className="w-5 h-5 text-purple-500" />
                            <span>Resgatar Código</span>
                        </>
                    )}
                </div>
            }
            description={isWelcome 
                ? "Sua jornada para a liberdade financeira começa agora. Escolha como deseja prosseguir."
                : "Insira seu código promocional para liberar acesso exclusivo."
            }
            // Botões dinâmicos baseados na etapa
            primaryButton={!isWelcome ? {
                label: "Validar e Ativar",
                onClick: handlePromoSubmit,
                isLoading: isLoading,
                className: "w-full bg-purple-600 hover:bg-purple-700"
            } : undefined}
            secondaryButton={!isWelcome ? {
                label: "Voltar",
                onClick: () => {
                    setStep('welcome')
                    setError(null)
                },
                className: "w-full"
            } : undefined}
        >
            {isWelcome ? renderWelcomeContent() : renderPromoContent()}
        </BaseModal>
    )
}
