"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "./input"

interface CodeInputProps extends Omit<React.ComponentProps<"input">, "type"> {
    label?: string
    required?: boolean
    error?: string
    helperText?: string
}

/**
 * CodeInput - Input para códigos e identificadores técnicos
 * 
 * Características:
 * - Força UPPERCASE automaticamente
 * - Ideal para: PIX, TED, DOC, CPF, CNPJ, códigos
 * - Remove espaços automaticamente
 * 
 * @example
 * ```tsx
 * const [pixKey, setPixKey] = useState("");
 * 
 * <CodeInput
 *   label="Chave PIX"
 *   value={pixKey}
 *   onChange={(e) => setPixKey(e.target.value)}
 *   placeholder="Digite a chave PIX"
 * />
 * ```
 */
export function CodeInput({
    label,
    required = false,
    error,
    helperText,
    className,
    onChange,
    ...props
}: CodeInputProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Força UPPERCASE e remove espaços
        const value = e.target.value.toUpperCase().trim()

        // Cria novo evento com valor transformado
        const newEvent = {
            ...e,
            target: {
                ...e.target,
                value,
            },
            currentTarget: {
                ...e.currentTarget,
                value,
            },
        } as React.ChangeEvent<HTMLInputElement>

        onChange?.(newEvent)
    }

    return (
        <div className="space-y-2">
            {label && (
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {label}
                    {required && <span className="text-destructive ml-1">*</span>}
                </label>
            )}
            <Input
                type="text"
                onChange={handleChange}
                aria-label={label}
                aria-invalid={!!error}
                aria-required={required}
                className={cn(
                    "uppercase font-mono tracking-wide",
                    error && "border-destructive",
                    className
                )}
                {...props}
            />
            {helperText && !error && (
                <p className="text-sm text-muted-foreground">{helperText}</p>
            )}
            {error && (
                <p className="text-sm text-destructive">{error}</p>
            )}
        </div>
    )
}
