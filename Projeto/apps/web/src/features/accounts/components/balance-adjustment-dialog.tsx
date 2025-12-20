'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
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
import { cn } from '@/lib/utils'
import { createBalanceAdjustment, updateBalanceAdjustment } from '@/app/(protected)/caixa/accounts/balance-adjustments-actions'
import type { BalanceAdjustment, BalanceAdjustmentType } from '@/lib/types/balance-adjustments'
import { DatePicker } from '@/components/ui/date-picker'

const formSchema = z.object({
    adjustment_date: z.date({
        required_error: 'Data do ajuste é obrigatória',
    }),
    balance: z.string().min(1, 'Saldo é obrigatório'),
    type: z.enum(['initial', 'reconciliation', 'correction'] as const),
    notes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface BalanceAdjustmentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    accountId: string
    accountName: string
    adjustment?: BalanceAdjustment
    onSuccess?: () => void
}

const adjustmentTypeLabels: Record<BalanceAdjustmentType, string> = {
    initial: 'Saldo Inicial',
    reconciliation: 'Conciliação/Retomada',
    correction: 'Correção Manual',
}

const adjustmentTypeDescriptions: Record<BalanceAdjustmentType, string> = {
    initial: 'Define o saldo inicial da conta ao começar a usar o sistema',
    reconciliation: 'Ajuste ao retomar o uso após um período sem controle',
    correction: 'Correção manual para ajustar divergências',
}

export function BalanceAdjustmentDialog({
    open,
    onOpenChange,
    accountId,
    accountName,
    adjustment,
    onSuccess,
}: BalanceAdjustmentDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            adjustment_date: adjustment ? new Date(adjustment.adjustment_date) : new Date(),
            balance: adjustment ? adjustment.balance.toString() : '',
            type: adjustment?.type || 'initial',
            notes: adjustment?.notes || '',
        },
    })

    const selectedType = form.watch('type')

    async function onSubmit(values: FormValues) {
        setIsSubmitting(true)
        try {
            const balanceValue = parseFloat(values.balance.replace(',', '.'))

            if (isNaN(balanceValue)) {
                form.setError('balance', { message: 'Valor inválido' })
                return
            }

            const input = {
                account_id: accountId,
                adjustment_date: format(values.adjustment_date, 'yyyy-MM-dd'),
                balance: balanceValue,
                type: values.type,
                notes: values.notes,
            }

            if (adjustment) {
                await updateBalanceAdjustment(adjustment.id, input)
            } else {
                await createBalanceAdjustment(input)
            }

            onSuccess?.()
            onOpenChange(false)
            form.reset()
        } catch (error) {
            console.error('Error saving balance adjustment:', error)
            form.setError('root', {
                message: error instanceof Error ? error.message : 'Erro ao salvar ajuste de saldo. Tente novamente.',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {adjustment ? 'Editar Ajuste de Saldo' : 'Ajustar Saldo da Conta'}
                    </DialogTitle>
                    <DialogDescription>
                        {accountName}
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
                                    <FormLabel>Saldo Real (conforme banco)</FormLabel>
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
                                                onChange={(e) => {
                                                    // Format as currency
                                                    let value = e.target.value.replace(/[^\d,.-]/g, '')
                                                    field.onChange(value)
                                                }}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormDescription>
                                        Informe o saldo real da conta nesta data
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
                                            placeholder="Ex: Retomando uso após 3 meses sem controle..."
                                            rows={3}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                <strong>Atenção:</strong> Transações anteriores a esta data não afetarão o
                                saldo atual. Apenas transações posteriores serão consideradas no cálculo.
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
                                className="h-11"
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="h-11">
                                {isSubmitting ? 'Salvando...' : adjustment ? 'Atualizar' : 'Confirmar Ajuste'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
