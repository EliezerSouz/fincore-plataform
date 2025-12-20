"use client"
import { useEffect, useState } from "react"
import { useUser } from "@/providers/user-provider"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Loader2, Check, Zap, Lock, Sparkles, XCircle, ArrowRight, CalendarDays, RefreshCw, CreditCard, Rocket } from "lucide-react"
import { updateProfile } from "./actions"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { AvatarUpload } from "@/components/ui/avatar-upload"

// Feature constants definitions
const PLAN_FEATURES = {
    free: [
        "Controle Financeiro Completo",
        "Dashboard Interativo",
        "Categorias Padrão",
        "Até 1 Conta Financeira",
        "Até 1 Cartão de Crédito",
        "Planejamento Básico"
    ],
    premium: [
        "Tudo do FINCORE Free",
        "Categorias Personalizadas",
        "Contas Financeiras Ilimitadas",
        "Cartões de Crédito Ilimitados",
        "Parcelamento Inteligente",
        "Relatórios Avançados",
        "Planejamento Financeiro Completo",
        "Histórico Financeiro Estendido"
    ],
    premium_ia: [
        "Tudo do FINCORE Premium",
        "Análises Inteligentes de Gastos",
        "Alertas Preditivos de Orçamento",
        "Sugestões de Economia Personalizadas",
        "Recomendações Financeiras com IA",
        "Planejamento Financeiro Assistido por IA",
        "Relatórios Inteligentes com Insights",
        "Análise de Comportamento Financeiro"
    ]
}

const UPSELL_FEATURES = {
    free: [
        "Categorias Personalizadas",
        "Contas Financeiras Ilimitadas",
        "Cartões de Crédito Ilimitados",
        "Parcelamento Inteligente",
        "Relatórios Avançados",
        "Planejamento Financeiro Completo",
        "Histórico Financeiro Estendido"
    ],
    premium: [
        "Análises Inteligentes de Gastos",
        "Alertas Preditivos de Orçamento",
        "Sugestões de Economia Personalizadas",
        "Recomendações Financeiras Automáticas",
        "Planejamento Financeiro Assistido por IA",
        "Relatórios Interpretados com Insights",
        "Análise de Comportamento Financeiro"
    ]
}

export default function AccountPage() {
    const { user, isLoading, refreshUser } = useUser()
    const [isSaving, setIsSaving] = useState(false)
    const [formData, setFormData] = useState({
        full_name: "",
        phone: ""
    })

    useEffect(() => {
        if (user) {
            setFormData({
                full_name: user?.name || "",
                phone: user?.phone || ""
            })
        }
    }, [user])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        try {
            const result = await updateProfile(formData)

            if (result.error) {
                alert(`Erro ao salvar: ${result.error}`)
            } else {
                await refreshUser() // Atualiza contexto global
                alert("Perfil atualizado com sucesso!")
            }
        } catch (error) {
            console.error("Erro ao salvar:", error)
            alert("Erro inesperado. Tente novamente.")
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Minha Conta</h2>
            </div>

            <Separator />

            <div className="grid gap-6 md:grid-cols-2">
                {/* Dados do Perfil */}
                <Card>
                    <CardHeader>
                        <CardTitle>Perfil</CardTitle>
                        <CardDescription>
                            Gerencie suas informações pessoais.
                        </CardDescription>
                    </CardHeader>
                    <div className="flex justify-center pb-2">
                        <AvatarUpload
                            avatarUrl={user?.avatarUrl || null}
                            initials={user?.initials || "U"}
                            onAvatarUpdate={async (url) => {
                                await updateProfile({ avatar_url: url })
                                await refreshUser()
                            }}
                        />
                    </div>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    value={user?.email || ""}
                                    disabled
                                    className="bg-muted text-muted-foreground"
                                />
                                <p className="text-[0.8rem] text-muted-foreground">
                                    O email não pode ser alterado.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name">Nome Completo</Label>
                                <Input
                                    id="name"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Celular / WhatsApp</Label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-between items-end pt-4">
                                <div className="text-xs text-muted-foreground space-y-1">
                                    <p className="flex items-center gap-1.5">
                                        <Rocket className="w-3 h-3 text-indigo-500" />
                                        Você organiza sua vida financeira no FINCORE desde
                                    </p>
                                    <p className="font-medium text-slate-700 dark:text-slate-300 pl-5">
                                        {user?.createdAt ? format(new Date(user.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : '...'}
                                    </p>
                                </div>
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Salvar Alterações
                                </Button>
                            </div>
                        </CardContent>
                    </form>
                </Card>

                {/* Dados da Assinatura */}
                <Card>
                    <CardHeader>
                        <CardTitle>Assinatura & Plano</CardTitle>
                        <CardDescription>
                            Gerencie sua assinatura do FINCORE.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* 1. Header do Plano com Status Visual */}
                        <div className="flex flex-col gap-4 rounded-xl border bg-slate-50/50 p-4 dark:bg-slate-900/50">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <div className="text-sm font-medium text-muted-foreground">Plano Atual</div>
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "text-2xl font-bold",
                                            user?.plan === 'premium_ia' ? "text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600" : "text-slate-900 dark:text-slate-100"
                                        )}>
                                            {user?.planLabel || "Gratuito"}
                                        </div>
                                        {user?.plan === 'premium_ia' && (
                                            <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
                                                <Sparkles className="mr-1 h-3 w-3" /> IA
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <Badge variant={user?.isInTrial ? "secondary" : "default"} className={
                                    user?.isInTrial
                                        ? "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400"
                                        : (user?.plan === 'premium_ia'
                                            ? "bg-purple-100 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300"
                                            : "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300")
                                }>
                                    {user?.isInTrial ? "TRIAL" : "ATIVO"}
                                </Badge>
                            </div>

                            <Separator className="bg-slate-200 dark:bg-slate-700" />

                            {/* Detalhes de Status */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <CalendarDays className="w-3 h-3" />
                                        {user?.isInTrial ? "Teste até" : "Renovação"}
                                    </span>
                                    <p className="font-medium text-slate-700 dark:text-slate-200">
                                        {user?.isInTrial
                                            ? (user.tempAccessExpiresAt ? format(new Date(user.tempAccessExpiresAt), "dd/MM/yyyy") : '-')
                                            : (user?.nextBillingDate ? format(new Date(user.nextBillingDate), "dd/MM/yyyy") : '-')
                                        }
                                    </p>
                                </div>

                                {/* Mostrar Renovação Apenas se NÃO for Trial e NÃO for Free (se bem que Free não tem renovação, mas ok) */}
                                {!user?.isInTrial && user?.plan !== 'free' && (
                                    <div className="space-y-1">
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <RefreshCw className="w-3 h-3" />
                                            Renovação Auto
                                        </span>
                                        <p className="font-medium text-slate-700 dark:text-slate-200">
                                            Sim
                                        </p>
                                    </div>
                                )}

                                {/* Se for Trial, mostrar quando começou o teste ou algo do tipo? 
                                    Ou mostrar "Membro desde" sempre.
                                    Vamos substituir o bloco da direita por "Membro Desde" se for Trial ou Free padrão.
                                */}
                                {/* Se for Trial, mostrar quando começou o teste? Não, manter limpo conforme pedido. */}
                            </div>

                            {/* Botão de Renovação */}
                            {user?.plan !== 'free' && (
                                <div className="pt-2">
                                    <Button
                                        className={cn(
                                            "w-full gap-2 shadow-sm font-semibold",
                                            user?.isInTrial
                                                ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0"
                                                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                                        )}
                                        variant={user?.isInTrial ? "default" : "outline"}
                                    >
                                        <CreditCard className="w-4 h-4" />
                                        {user?.isInTrial ? "Assinar Agora e Garantir Oferta" : "Renovar Assinatura"}
                                    </Button>
                                    {user?.isInTrial && (
                                        <p className="text-[10px] text-center text-muted-foreground mt-2">
                                            Continue com todos os recursos avançados do FINCORE.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Removido Banner de Membro daqui - movido para Perfil */}

                        {/* 2. Lista de Recursos (O que eu tenho) */}
                        <div className="space-y-3">
                            <div className="text-sm font-medium flex items-center gap-2">
                                <Check className="w-4 h-4 text-emerald-500" />
                                Recursos Ativos ({user?.planLabel || "Free"})
                            </div>
                            <ul className="grid gap-2 pl-2">
                                {(PLAN_FEATURES[(user?.plan as keyof typeof PLAN_FEATURES) || 'free'] || PLAN_FEATURES.free).map((feature, idx) => (
                                    <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* 3. O que eu ganho se subir (Upsell) */}
                        {/* 3. O que eu ganho se subir (Upsell) */}
                        {user?.plan === 'free' && (
                            <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/30 dark:bg-blue-900/10">
                                <div className="mb-3 flex items-center gap-2 font-semibold text-blue-700 dark:text-blue-300">
                                    <Lock className="h-4 w-4" />
                                    Desbloqueie com Premium
                                </div>
                                <ul className="space-y-2">
                                    {UPSELL_FEATURES.free.map((item) => (
                                        <li key={item} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                            <XCircle className="h-3.5 w-3.5 text-slate-400" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                                <Button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm" size="sm">
                                    Conhecer o Premium <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        )}

                        {user?.plan === 'premium' && (
                            <div className="rounded-lg border border-purple-100 bg-purple-50/50 p-4 dark:border-purple-900/30 dark:bg-purple-900/10">
                                <div className="mb-3 flex items-center gap-2 font-semibold text-purple-700 dark:text-purple-300">
                                    <Sparkles className="h-4 w-4" />
                                    Evolua para Premium IA
                                </div>
                                <ul className="space-y-2">
                                    {UPSELL_FEATURES.premium.map((item) => (
                                        <li key={item} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                            <Zap className="h-3.5 w-3.5 text-purple-500" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                                <Button className="mt-4 w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-md border-0" size="sm">
                                    Conhecer o Premium IA <Sparkles className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        )}

                        {(user?.plan === 'premium_ia' || user?.plan === 'enterprise') && (
                            <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20 text-center">
                                <p className="text-sm text-green-800 dark:text-green-300 font-medium flex items-center justify-center gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    Plano Completo Ativo
                                </p>
                            </div>
                        )}

                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
