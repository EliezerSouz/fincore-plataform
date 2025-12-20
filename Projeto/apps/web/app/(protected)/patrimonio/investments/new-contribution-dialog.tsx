"use client"

import { useState } from "react"
import { BaseModal } from "@/components/ui/base-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAccounts } from "@/hooks/use-accounts"
import { createTransfer, createTransaction } from "@/app/(protected)/caixa/transactions/actions"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"

export function NewContributionDialog() {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const { accounts } = useAccounts()
    const router = useRouter()
    
    // Form State
    const [amount, setAmount] = useState("")
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [assetId, setAssetId] = useState("")
    const [originId, setOriginId] = useState("")

    // Filter accounts
    const investmentAccounts = accounts.filter((a: any) => a.type === 'investimento' && a.is_active !== false)
    const sourceAccounts = accounts.filter((a: any) => a.type !== 'investimento' && a.is_active !== false)

    async function handleSubmit() {
        if (!amount || !assetId || !date) {
            toast.error("Preencha os campos obrigatórios.")
            return
        }

        setIsLoading(true)
        try {
            const formData = new FormData()
            formData.append('amount', amount)
            formData.append('date', date)
            
            if (originId && originId !== 'external') {
                // Transferência
                formData.append('type', 'transferencia')
                formData.append('sourceAccountId', originId)
                formData.append('targetAccountId', assetId)
                formData.append('description', 'Aporte em Investimento')
                
                await createTransfer(formData)
            } else {
                // Aporte Externo (Receita)
                formData.append('type', 'receita')
                formData.append('accountId', assetId)
                formData.append('description', 'Aporte (Externo)')
                // Optional: Category could be added here if needed
                
                await createTransaction(formData)
            }

            toast.success("Aporte registrado com sucesso!")
            setOpen(false)
            setAmount("")
            router.refresh()
        } catch (error) {
            console.error(error)
            toast.error("Erro ao registrar aporte.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <Button className="gap-2" onClick={() => setOpen(true)}>
                <Plus className="w-4 h-4" /> Novo Aporte
            </Button>

            <BaseModal
                open={open}
                onOpenChange={setOpen}
                title={
                    <div className="flex items-center gap-2">
                        <Plus className="w-5 h-5 text-emerald-600" />
                        <span>Novo Aporte</span>
                    </div>
                }
                description="Adicione fundos aos seus investimentos."
                primaryButton={{
                    label: "Confirmar Aporte",
                    onClick: handleSubmit,
                    isLoading: isLoading
                }}
                secondaryButton={{
                    label: "Cancelar",
                    onClick: () => setOpen(false)
                }}
            >
                <div className="space-y-4">
                     <div className="space-y-2">
                        <Label>Destino (Ativo)</Label>
                        <Select value={assetId} onValueChange={setAssetId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o investimento..." />
                            </SelectTrigger>
                            <SelectContent>
                                {investmentAccounts.map((acc: any) => (
                                    <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                                ))}
                                {investmentAccounts.length === 0 && (
                                    <div className="p-2 text-sm text-muted-foreground text-center">Nenhum ativo cadastrado.</div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label>Valor (R$)</Label>
                            <Input 
                                type="number" 
                                step="0.01" 
                                placeholder="0,00" 
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Data</Label>
                            <Input 
                                type="date" 
                                value={date}
                                onChange={e => setDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Origem do Recurso</Label>
                        <Select value={originId} onValueChange={setOriginId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione a origem..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="external">Depósito Externo (Não debitar)</SelectItem>
                                {sourceAccounts.map((acc: any) => (
                                    <SelectItem key={acc.id} value={acc.id}>{acc.name} ({new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(acc.balance)})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </BaseModal>
        </>
    )
}
