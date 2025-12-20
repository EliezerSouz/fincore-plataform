"use client"

import { Label } from "@/components/ui/label"
import { AlertCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePaymentMethods } from "@/hooks/use-payment-methods"
import { PaymentMethodSelectorProps, CONTEXT_LABELS } from "@/types/payment-method"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

/**
 * COMPONENTE CENTRAL ÚNICO
 * 
 * PaymentMethodSelector - Seletor de Forma de Pagamento
 * 
 * REGRA DE OURO:
 * Este é o ÚNICO componente autorizado a exibir formas de pagamento.
 * Nenhuma tela deve criar seu próprio seletor.
 * 
 * A configuração da tabela payment_methods é a FONTE ABSOLUTA DE VERDADE.
 */
export function PaymentMethodSelector({
    context,
    value,
    onChange,
    required = false,
    label,
    placeholder = "Selecione...",
    className,
}: PaymentMethodSelectorProps) {
    const {
        validMethods,
        loading,
        error,
        getUnavailableReason,
        getMethodWarnings,
    } = usePaymentMethods(context)

    const selectedMethod = validMethods.find(m => m.id === value)
    const warnings = value ? getMethodWarnings(value) : []

    // Label padrão baseado no contexto
    const displayLabel = label || CONTEXT_LABELS[context]

    if (loading) {
        return (
            <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase text-slate-500">
                    {displayLabel}
                </Label>
                <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase text-slate-500">
                    {displayLabel}
                </Label>
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/30 rounded-md text-sm text-red-700 dark:text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                </div>
            </div>
        )
    }

    if (validMethods.length === 0) {
        return (
            <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase text-slate-500">
                    {displayLabel}
                </Label>
                <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/30 rounded-md text-sm text-amber-700 dark:text-amber-400">
                    <Info className="w-4 h-4" />
                    <span>Nenhuma forma de pagamento disponível para este tipo de operação.</span>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-slate-500">
                {displayLabel}
                {required && <span className="text-red-500 ml-1">*</span>}
            </Label>

            <select
                className={cn(
                    "flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    "dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950",
                    "dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300",
                    "shadow-sm transition-colors",
                    className
                )}
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                required={required}
            >
                <option value="">{placeholder}</option>
                {validMethods.map((method) => (
                    <option key={method.id} value={method.id}>
                        {method.name}
                    </option>
                ))}
            </select>

            {/* AVISOS AUTOMÁTICOS */}
            {warnings.length > 0 && (
                <div className="space-y-1">
                    {warnings.map((warning, index) => (
                        <div
                            key={index}
                            className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/30 rounded text-xs text-blue-700 dark:text-blue-400"
                        >
                            <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span>{warning}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* INFORMAÇÃO CONTEXTUAL */}
            {selectedMethod && !selectedMethod.affects_balance && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="inline-flex items-center gap-1 text-xs text-slate-500 cursor-help">
                                <AlertCircle className="w-3 h-3" />
                                <span>Por que não afeta o saldo?</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="max-w-xs text-xs">
                                Esta forma de pagamento não altera o saldo da conta porque representa
                                um compromisso futuro ou um movimento que não impacta o caixa imediatamente.
                            </p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
        </div>
    )
}

/**
 * Variante Inline (para uso em grids)
 */
export function PaymentMethodSelectorInline(props: PaymentMethodSelectorProps) {
    return <PaymentMethodSelector {...props} className={cn("h-10", props.className)} />
}
