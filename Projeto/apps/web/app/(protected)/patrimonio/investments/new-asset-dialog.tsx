"use client"

import { useState } from "react"
import { BaseModal } from "@/components/ui/base-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createAccount } from "@/app/(protected)/caixa/accounts/actions"
import { toast } from "sonner"
import { TrendingUp, Plus } from "lucide-react"
import { useRouter } from "next/navigation"

export function NewAssetDialog() {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)

        try {
            const formData = new FormData(e.currentTarget)
            formData.append('type', 'investimento')
            // Default color for investments
            formData.append('color', '#8b5cf6') // Violet
            
            await createAccount(formData)
            
            toast.success("Ativo criado com sucesso!")
            setOpen(false)
            router.refresh()
        } catch (error) {
            toast.error("Erro ao criar ativo.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <Button variant="outline" className="gap-2" onClick={() => setOpen(true)}>
                <Plus className="w-4 h-4" /> Novo Ativo
            </Button>

            <BaseModal
                open={open}
                onOpenChange={setOpen}
                title={
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-purple-600" />
                        <span>Novo Ativo</span>
                    </div>
                }
                description="Cadastre um novo investimento para acompanhar."
                primaryButton={{
                    label: "Criar Ativo",
                    isLoading: isLoading,
                    form: "create-asset-form",
                    type: "submit"
                }}
                secondaryButton={{
                    label: "Cancelar",
                    onClick: () => setOpen(false)
                }}
            >
                <form id="create-asset-form" onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome do Ativo</Label>
                        <Input id="name" name="name" placeholder="Ex: CDB Nubank, PETR4, Bitcoin" required />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="balance">Saldo Atual (R$)</Label>
                            <Input id="balance" name="balance" type="number" step="0.01" placeholder="0,00" defaultValue="0" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="yield_rate">Rentabilidade (% a.m)</Label>
                            <Input id="yield_rate" name="yield_rate" type="number" step="0.01" placeholder="Ex: 1.0" />
                        </div>
                    </div>
                </form>
            </BaseModal>
        </>
    )
}
