"use client"

import { usePermission } from "@/hooks/use-permission"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Lock, AlertTriangle } from "lucide-react"

interface LimitAlertProps {
    count: number
    limit: number
    entityName: string
    isLegacy?: boolean // Se true, o aviso é sobre itens "herdados" do Premium
}

export function FreeLimitAlert({ count, limit, entityName, isLegacy }: LimitAlertProps) {
    const { can, isLoading } = usePermission()

    if (isLoading) return null

    // Lógica: Mostrar alerta se usuário for Free (checagem via permissão)
    // Para cartões: limit = 1. Se count > 1, mostra aviso de legado.
    // Para contas: limit = 5. Se count >= 5, mostra aviso de limite atingido.

    // Verifica se a permissão relevante está ausente
    // Como é genérico, assumimos que quem chama sabe que é num contexto restrito.
    // Mas podemos refinar:
    const isFree = !can('unlimited_cards') && !can('unlimited_accounts'); // Aproximação ou checagem específica?
    // Melhor: O componente deve ser agnóstico. Ele só mostra se count > limit e se isFree.
    // Mas 'isFree' não é exposto diretamente. Podemos inferir por uma permissão "chave" ou passar como prop.
    // Vamos usar !can('advanced_reports') como proxy de Free, ou melhor, adicionar isPremium no hook.

    // O hook usePermission retorna 'isPremium'.
    const { isPremium } = usePermission()

    if (isPremium) return null

    if (count > limit) {
        return (
            <Alert className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                <AlertTitle className="text-amber-800 dark:text-amber-400 font-semibold flex items-center gap-2">
                    Limite do Plano Gratuito Excedido
                </AlertTitle>
                <AlertDescription className="text-amber-700 dark:text-amber-500 text-xs mt-1">
                    Você tem <strong>{count} {entityName}</strong> ativos, mas seu plano permite apenas {limit}.
                    {isLegacy
                        ? " Os itens excedentes criados anteriormente estão disponíveis apenas para leitura."
                        : " Você não poderá criar novos itens."
                    } Faça upgrade para remover limites.
                </AlertDescription>
            </Alert>
        )
    }

    if (count === limit) {
        return (
            <Alert className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-950/20">
                <Lock className="h-4 w-4 text-blue-600 dark:text-blue-500" />
                <AlertTitle className="text-blue-800 dark:text-blue-400 font-semibold flex items-center gap-2">
                    Limite Atingido
                </AlertTitle>
                <AlertDescription className="text-blue-700 dark:text-blue-500 text-xs mt-1">
                    Você atingiu o limite de {limit} {entityName} do plano Gratuito.
                </AlertDescription>
            </Alert>
        )
    }

    return null
}
