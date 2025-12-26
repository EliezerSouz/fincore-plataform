"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { ParentAccount, Pocket } from "@/types/pockets"
import { getParentAccounts, movePocket } from "../actions"
import { toast } from "sonner"
import { Loader2, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"

interface MovePocketModalProps {
    pocket: Pocket
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function MovePocketModal({ pocket, open, onOpenChange }: MovePocketModalProps) {
    const [targetAccountId, setTargetAccountId] = useState<string>("")
    const [accounts, setAccounts] = useState<ParentAccount[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const router = useRouter()

    // Carregar contas disponíveis ao abrir
    useEffect(() => {
        if (open) {
            setIsLoading(true)
            getParentAccounts(false)
                .then(data => {
                    // Filtrar a conta atual para não mover para ela mesma
                    setAccounts(data.filter(a => a.id !== pocket.parent_account_id))
                    setIsLoading(false)
                })
                .catch(() => {
                    toast.error("Erro ao carregar instituições")
                    setIsLoading(false)
                })
        }
    }, [open, pocket.parent_account_id])

    const handleMove = async () => {
        if (!targetAccountId) return

        setIsSaving(true)
        try {
            await movePocket(pocket.id, targetAccountId)
            toast.success("Pocket movido com sucesso!")
            onOpenChange(false)
            router.refresh()
        } catch (error) {
            toast.error("Erro ao mover pocket")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Mover Pocket</DialogTitle>
                    <DialogDescription>
                        Mover <strong>{pocket.name}</strong> para outra instituição financeira.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center p-4">
                            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                        </div>
                    ) : accounts.length === 0 ? (
                        <div className="text-center text-sm text-slate-500 py-4">
                            Nenhuma outra instituição encontrada para destino.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Selecione a Instituição de Destino
                            </label>
                            <Select value={targetAccountId} onValueChange={setTargetAccountId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {accounts.map(acc => (
                                        <SelectItem key={acc.id} value={acc.id}>
                                            {acc.institution_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleMove}
                        disabled={!targetAccountId || isSaving}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Movendo...
                            </>
                        ) : (
                            <>
                                Mover
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
