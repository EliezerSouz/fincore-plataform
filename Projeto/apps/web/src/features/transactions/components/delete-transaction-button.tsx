"use client"

import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { deleteTransaction } from "@/app/(protected)/caixa/transactions/actions"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function DeleteTransactionButton({ id }: { id: string }) {
    const router = useRouter()
    const [isDeleting, setIsDeleting] = useState(false)

    async function handleDelete() {
        if (!confirm("Excluir esta transação? O saldo da conta será revertido.")) return

        setIsDeleting(true)
        try {
            await deleteTransaction(id)
            router.refresh()
        } catch (error) {
            alert("Erro ao excluir")
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={handleDelete}
            disabled={isDeleting}
        >
            <Trash2 className="w-4 h-4" />
        </Button>
    )
}
