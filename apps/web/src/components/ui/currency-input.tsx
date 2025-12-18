"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface CurrencyInputProps extends Omit<React.ComponentProps<"input">, "onChange" | "value" | "type"> {
    value: number
    onChange: (value: number) => void
    label?: string
    required?: boolean
    min?: number
    max?: number
    error?: string
}

/**
 * CurrencyInput - Input especializado para valores monetários
 * 
 * Características:
 * - Inicia sempre com "0,00"
 * - Aceita apenas números
 * - Formata automaticamente (1.234,56)
 * - Retorna valor numérico para o backend
 * - Segue padrão bancário brasileiro
 * 
 * @example
 * ```tsx
 * const [amount, setAmount] = useState(0);
 * 
 * <CurrencyInput
 *   label="Valor"
 *   value={amount}
 *   onChange={setAmount}
 *   required
 * />
 * ```
 */
export function CurrencyInput({
    value,
    onChange,
    label,
    required = false,
    min = 0.01,
    max = 999999999.99,
    error,
    className,
    disabled,
    ...props
}: CurrencyInputProps) {
    const [displayValue, setDisplayValue] = React.useState("")

    // Formata valor numérico para exibição
    const formatCurrency = (num: number): string => {
        return new Intl.NumberFormat("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(num)
    }

    // Inicializa e atualiza display quando value muda
    React.useEffect(() => {
        setDisplayValue(formatCurrency(value))
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Remove tudo exceto números
        const numbers = e.target.value.replace(/\D/g, "")

        // Converte para centavos
        const cents = parseInt(numbers || "0", 10)
        const numericValue = cents / 100

        // Valida limites
        if (numericValue > max) {
            return
        }

        // Atualiza display
        setDisplayValue(formatCurrency(numericValue))

        // Notifica mudança
        onChange(numericValue)
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        e.target.select()
    }

    return (
        <div className="space-y-2">
            {label && (
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {label}
                    {required && <span className="text-destructive ml-1">*</span>}
                </label>
            )}
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                    R$
                </span>
                <input
                    type="text"
                    inputMode="numeric"
                    value={displayValue}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    disabled={disabled}
                    aria-label={label}
                    aria-invalid={!!error}
                    aria-required={required}
                    className={cn(
                        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent pl-10 pr-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
                        "text-right tabular-nums font-medium",
                        className
                    )}
                    {...props}
                />
            </div>
            {error && (
                <p className="text-sm text-destructive">{error}</p>
            )}
        </div>
    )
}
