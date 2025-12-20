"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "./input"

interface TextInputProps extends Omit<React.ComponentProps<"input">, "type"> {
    label?: string
    required?: boolean
    error?: string
    maxLength?: number
    helperText?: string
}

/**
 * TextInput - Input para texto livre que preserva a entrada do usuário
 * 
 * Características:
 * - NÃO força UPPERCASE
 * - NÃO altera capitalização
 * - Preserva exatamente como digitado
 * - Ideal para: descrições, nomes, observações
 * 
 * @example
 * ```tsx
 * const [description, setDescription] = useState("");
 * 
 * <TextInput
 *   label="Descrição"
 *   value={description}
 *   onChange={(e) => setDescription(e.target.value)}
 *   placeholder="Digite a descrição da transação"
 *   required
 * />
 * ```
 */
export function TextInput({
    label,
    required = false,
    error,
    maxLength,
    helperText,
    className,
    ...props
}: TextInputProps) {
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
                maxLength={maxLength}
                aria-label={label}
                aria-invalid={!!error}
                aria-required={required}
                className={cn(
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
            {maxLength && props.value && (
                <p className="text-xs text-muted-foreground text-right">
                    {String(props.value).length}/{maxLength}
                </p>
            )}
        </div>
    )
}
