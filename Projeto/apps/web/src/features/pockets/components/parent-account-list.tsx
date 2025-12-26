"use client"

import { ParentAccount } from "@/types/pockets"
import { ParentAccountCard } from "./parent-account-card"

export function ParentAccountList({ accounts }: { accounts: ParentAccount[] }) {
    if (!accounts || accounts.length === 0) {
        return (
            <div className="text-center py-10">
                <h3 className="text-lg font-medium text-slate-600">Nenhuma conta encontrada</h3>
                <p className="text-slate-500">Comece adicionando uma instituição financeira.</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {accounts.map(account => (
                <ParentAccountCard key={account.id} account={account} />
            ))}
        </div>
    )
}
