"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Building2 } from "lucide-react"
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
import { ParentAccount } from "@/types/pockets"
import { createParentAccount, updateParentAccount } from "../actions"

// Schema de validação
const formSchema = z.object({
    institution_name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    institution_type: z.string().min(1, "Selecione um tipo"),
    color: z.string().optional(),
    logo_url: z.string().optional(),
    initial_balance: z.coerce.number().optional().default(0),
})

interface ManageParentAccountModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    account?: ParentAccount // Se passado, é modo de edição
}

const INSTITUTION_TYPES = [
    { value: "digital_bank", label: "Banco Digital" },
    { value: "traditional_bank", label: "Banco Tradicional" },
    { value: "fintech", label: "Fintech / Carteira" },
    { value: "broker", label: "Corretora" },
    { value: "other", label: "Outro" },
]

export function ManageParentAccountModal({ open, onOpenChange, account }: ManageParentAccountModalProps) {
    const router = useRouter()
    const isEditing = !!account

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            institution_name: "",
            institution_type: "digital_bank",
            color: "#000000",
            logo_url: "",
            initial_balance: 0,
        },
    })

    // Reset form when opening/closing or changing account
    useEffect(() => {
        if (open) {
            form.reset({
                institution_name: account?.institution_name || "",
                institution_type: account?.institution_type || "digital_bank",
                color: account?.color || "#000000",
                logo_url: account?.logo_url || "",
                initial_balance: 0,
            })
        }
    }, [open, account, form])

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            // Conversão segura de tipos
            const payload = {
                ...values,
                institution_type: values.institution_type as any // Cast para compatibilidade com InstitutionType
            }

            if (isEditing && account) {
                // Remover initial_balance na edição
                const { initial_balance, ...editPayload } = payload
                await updateParentAccount(account.id, editPayload)
                toast.success("Instituição atualizada com sucesso")
            } else {
                await createParentAccount(payload)
                toast.success("Instituição criada com sucesso")
            }
            onOpenChange(false)
            router.refresh()
        } catch (error) {
            toast.error(isEditing ? "Erro ao atualizar instituição" : "Erro ao criar instituição")
            console.error(error)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar Instituição" : "Nova Instituição"}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Altere os dados da instituição financeira."
                            : "Adicione uma nova instituição para agrupar seus pockets."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="institution_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome da Instituição</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Nubank, Banco do Brasil..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="institution_type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione o tipo" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {INSTITUTION_TYPES.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {!isEditing && (
                            <FormField
                                control={form.control}
                                name="initial_balance"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Saldo Inicial (Conta Corrente)</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2.5 text-slate-500">R$</span>
                                                <Input
                                                    type="number"
                                                    placeholder="0,00"
                                                    step="0.01"
                                                    className="pl-9"
                                                    {...field}
                                                />
                                            </div>
                                        </FormControl>
                                        <p className="text-[10px] text-slate-500">
                                            Será criado um pocket "Conta Corrente" com este saldo.
                                        </p>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="color"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cor (Hex)</FormLabel>
                                        <div className="flex gap-2">
                                            <Input type="color" className="w-12 p-1 cursor-pointer" {...field} />
                                            <Input placeholder="#000000" {...field} />
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditing ? "Salvar Alterações" : "Criar Instituição"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
