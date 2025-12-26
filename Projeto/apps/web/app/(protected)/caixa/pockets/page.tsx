import { Suspense } from "react"
import { getParentAccounts, getParentAccountWithPockets } from "@/features/pockets/actions"
import { ParentAccountList } from "@/features/pockets/components/parent-account-list"
import { Skeleton } from "@/components/ui/skeleton"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Pockets (Beta) | FinCore",
    description: "Novo modelo de contas financeiras",
}

export default async function PocketsPage() {
    // Buscar todas as contas
    const accounts = await getParentAccounts(true)

    // Buscar pockets para cada conta (idealmente faríamos isso numa única query no backend)
    const accountsWithPockets = await Promise.all(
        accounts.map(async (acc) => {
            const fullAccount = await getParentAccountWithPockets(acc.id)
            return fullAccount || acc
        })
    )

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Minhas Contas (Pockets)
                    </h1>
                    <p className="text-slate-500 text-sm">
                        Novo modelo de visualização por instituição e finalidade.
                    </p>
                </div>
            </div>

            <Suspense fallback={<PocketsSkeleton />}>
                <ParentAccountList accounts={accountsWithPockets} />
            </Suspense>
        </div>
    )
}

function PocketsSkeleton() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-slate-100 rounded-lg animate-pulse" />
            ))}
        </div>
    )
}
