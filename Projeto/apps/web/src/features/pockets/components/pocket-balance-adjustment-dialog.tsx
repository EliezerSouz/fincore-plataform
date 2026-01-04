'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Info } from 'lucide-react'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DatePicker } from '@/components/ui/date-picker'
import { createPocketBalanceAdjustment } from '@/app/(protected)/caixa/pockets/pocket-balance-adjustments-actions'
import { toast } from 'sonner'

const formSchema = z.object({
    adjustment_date: z.date(),
    balance: z.string().min(1, 'Saldo é obrigatório'),
    type: z.enum(['initial', 'reconciliation', 'correction'] as const),
    notes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface PocketBalanceAdjustmentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    pocketId: string
    pocketName: string
    onSuccess?: () => void
}

const adjustmentTypeLabels = {
    initial: 'Saldo Inicial',
    reconciliation: 'Conciliação/Retomada',
    correction: 'Correção Manual',
} as const

const adjustmentTypeDescriptions = {
    initial: 'Define o saldo inicial do pocket',
    reconciliation: 'Ajuste ao retomar o uso ou corrigir histórico',
    correction: 'Correção manual para ajustar divergências',
} as const

export function PocketBalanceAdjustmentDialog({
    open,
    onOpenChange,
    pocketId,
    pocketName,
    onSuccess,
}: PocketBalanceAdjustmentDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            adjustment_date: new Date(),
            balance: '',
            type: 'initial',
            notes: '',
        },
    })

    const selectedType = form.watch('type')

    async function onSubmit(values: FormValues) {
        setIsSubmitting(true)
        try {
            // Parse currency string to float
            // Assuming format like "1.234,56" or "1234.56"
            // Simple replace ',' with '.' if it looks like pt-BR decimal
            let balanceStr = values.balance.replace(/[^\d.,]/g, '')
            // If it has comma, replace with dot
            if (balanceStr.includes(',')) {
                balanceStr = balanceStr.replace(/\./g, '').replace(',', '.')
            }

            const balanceValue = parseFloat(balanceStr)

            if (isNaN(balanceValue)) {
                form.setError('balance', { message: 'Valor inválido' })
                return
            }

            await createPocketBalanceAdjustment({
                pocket_id: pocketId,
                adjustment_date: values.adjustment_date.toISOString(),
                balance: balanceValue,
                type: values.type,
                notes: values.notes,
            })

            toast.success('Saldo ajustado com sucesso!')
            onSuccess?.()
            onOpenChange(false)
            form.reset()

            // Reload page to update balances visually
            window.location.reload()

        } catch (error: any) {
            console.error('Error saving pocket adjustment:', error)

            const errorMessage = error instanceof Error ? error.message : 'Erro ao ajustar saldo'

            // Show toast with description if it's a specific validation error
            if (errorMessage.includes("data retroativa") || errorMessage.includes("movimentações")) {
                toast.error("Bloqueio de Segurança", {
                    description: errorMessage,
                    duration: 5000
                })
            } else {
                toast.error(errorMessage)
            }

            form.setError('root', {
                message: errorMessage,
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Ajustar Saldo do Pocket</DialogTitle>
                    <DialogDescription>
                        {pocketName}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="adjustment_date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Data do Ajuste</FormLabel>
                                    <FormControl>
                                        <DatePicker
                                            date={field.value}
                                            setDate={field.onChange}
                                            required
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="balance"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Saldo Real na Data</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                                R$
                                            </span>
                                            <Input
                                                {...field}
                                                type="text"
                                                placeholder="0,00"
                                                className="pl-10 h-11"
                                                autoComplete="off"
                                                onChange={(e) => {
                                                    // Allow digits, comma, dot, minus
                                                    let value = e.target.value
                                                    field.onChange(value)
                                                }}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormDescription>
                                        Informe o saldo exato que o pocket tinha nesta data.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo de Ajuste</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-11">
                                                <SelectValue placeholder="Selecione o tipo" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {Object.entries(adjustmentTypeLabels).map(([value, label]) => (
                                                <SelectItem key={value} value={value}>
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        {adjustmentTypeDescriptions[selectedType]}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Observações (opcional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            placeholder="Ex: Saldo inicial importado do banco..."
                                            rows={2}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                Transações lançadas com data <strong>anterior</strong> a este ajuste serão consideradas Históricas e <strong>não afetarão</strong> o saldo atual.
                            </AlertDescription>
                        </Alert>

                        {form.formState.errors.root && (
                            <Alert variant="destructive">
                                <AlertDescription>
                                    {form.formState.errors.root.message}
                                </AlertDescription>
                            </Alert>
                        )}

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Salvando...' : 'Confirmar Ajuste'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
