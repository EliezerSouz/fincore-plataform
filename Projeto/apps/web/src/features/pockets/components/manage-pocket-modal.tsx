"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Pocket, ParentAccount } from "@/types/pockets"
import { createPocket, updatePocket } from "../actions"

// Schema de validação
const formSchema = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    pocket_type: z.enum(["CAIXA", "RESERVA_CDI", "INVESTIMENTO"]),
    description: z.string().optional(),
    yield_enabled: z.boolean().default(false),
    yield_cdi_rate: z.coerce.number().min(0).optional(),
    parent_account_id: z.string().min(1, "Instituição é obrigatória"),
})

interface ManagePocketModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    pocket?: Pocket // Se passado, é modo de edição
    parentAccount?: ParentAccount // Para pré-selecionar ao criar
}

export function ManagePocketModal({ open, onOpenChange, pocket, parentAccount }: ManagePocketModalProps) {
    const router = useRouter()
    const isEditing = !!pocket

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            pocket_type: "CAIXA",
            description: "",
            yield_enabled: false,
            yield_cdi_rate: 100,
            parent_account_id: parentAccount?.id || "",
        },
    })

    const pocketType = form.watch("pocket_type")
    const yieldEnabled = form.watch("yield_enabled")

    // Reset form logic
    useEffect(() => {
        if (open) {
            form.reset({
                name: pocket?.name || "",
                pocket_type: (pocket?.pocket_type as any) || "CAIXA",
                description: pocket?.description || "",
                yield_enabled: pocket?.yield_enabled || false,
                yield_cdi_rate: pocket?.yield_cdi_rate || 100,
                parent_account_id: pocket?.parent_account_id || parentAccount?.id || "",
            })
        }
    }, [open, pocket, parentAccount, form])

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            // Ajustes finos: se yield desabilitado, rate = 0 (ou manter para histórico, mas API pode validar)
            // Nossa API relaxou a validação, então podemos mandar.

            if (isEditing && pocket) {
                await updatePocket(pocket.id, values)
                toast.success("Pocket atualizado com sucesso")
            } else {
                await createPocket({
                    ...values,
                    parent_account_id: values.parent_account_id, // Garantir string
                })
                toast.success("Pocket criado com sucesso")
            }
            onOpenChange(false)
            router.refresh()
        } catch (error) {
            toast.error(isEditing ? "Erro ao atualizar pocket" : "Erro ao criar pocket")
            console.error(error)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar Pocket" : "Novo Pocket"}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Altere os detalhes do pocket."
                            : `Adicione um novo pocket em ${parentAccount?.institution_name || 'uma instituição'}.`}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome do Pocket</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Viagem, Reforma, Salário" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="pocket_type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo de Bolso</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione o tipo" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="CAIXA">Caixa (Conta Corrente/Uso Diário)</SelectItem>
                                            <SelectItem value="RESERVA_CDI">Reserva (Poupança/CDB/Yield)</SelectItem>
                                            {/* <SelectItem value="INVESTIMENTO">Investimento</SelectItem> */}
                                            {/* Simplificando: Investimento talvez seja tratado em outro módulo */}
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        Define como o dinheiro deste pocket é tratado no Pulso Financeiro.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Configuração de Rendimento */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg space-y-4 border border-slate-100 dark:border-slate-800">
                            <FormField
                                control={form.control}
                                name="yield_enabled"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg p-0 space-y-0">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">Possui Rendimento Automático?</FormLabel>
                                            <FormDescription>
                                                Ative se o saldo rende automaticamente (ex: Nubank, MP).
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            {yieldEnabled && (
                                <FormField
                                    control={form.control}
                                    name="yield_cdi_rate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Rentabilidade (% do CDI)</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input type="number" step="0.01" {...field} />
                                                    <span className="absolute right-3 top-2.5 text-xs text-slate-500">% CDI</span>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditing ? "Salvar Alterações" : "Criar Pocket"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
