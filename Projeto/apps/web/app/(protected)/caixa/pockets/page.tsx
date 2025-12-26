import { Suspense } from "react"
import { getParentAccounts, getParentAccountWithPockets } from "@/features/pockets/actions"
import { PocketsView } from "@/features/pockets/components/pockets-view"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Minhas Contas | FinCore",
    description: "Gerencie saldos, instituições e pockets.",
}

export default async function PocketsPage() {
    // Buscar todas as contas
    const accounts = await getParentAccounts(true)

    // Buscar pockets detalhes (N+1 query, idealmente otimizar no backend)
    const accountsWithPockets = await Promise.all(
        accounts.map(async (acc) => {
            const fullAccount = await getParentAccountWithPockets(acc.id)
            return fullAccount || acc
        })
    )

    return (
        <Suspense fallback={<div className="p-8 text-center">Carregando contas...</div>}>
            <PocketsView accounts={accountsWithPockets} />
        </Suspense>
    )
}
