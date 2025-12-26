"use client"

import { ParentAccount } from "@/types/pockets"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { PocketRow } from "./pocket-row"
import { Building2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ParentAccountCard({ account }: { account: ParentAccount }) {
    // Cores baseadas na instituição (placeholder)
    const getInstitutionColor = (name: string) => {
        const n = name.toLowerCase()
        if (n.includes('nubank')) return '#820ad1'
        if (n.includes('inter')) return '#ff7a00'
        if (n.includes('mercado')) return '#009ee3'
        if (n.includes('itau')) return '#ec7000'
        if (n.includes('bradesco')) return '#cc092f'
        return '#64748b'
    }

    const color = account.color || getInstitutionColor(account.institution_name)

    return (
        <Card className="overflow-hidden border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow">
            <div className="h-1 w-full" style={{ backgroundColor: color }} />

            <CardHeader className="flex flex-row items-center justify-between pb-2 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
                        <Building2 className="w-5 h-5" style={{ color }} />
                    </div>
                    <div>
                        <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                            {account.institution_name}
                        </CardTitle>
                        <div className="text-xs text-slate-500 font-medium">
                            {account.pockets?.length || 0} subcontas
                        </div>
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-xs text-slate-500 uppercase font-semibold">Saldo Total</div>
                    <div className="text-lg font-bold text-slate-900 dark:text-gray-100">
                        {formatCurrency(account.total_balance)}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                {account.pockets && account.pockets.length > 0 ? (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {account.pockets.map(pocket => (
                            <PocketRow key={pocket.id} pocket={pocket} />
                        ))}
                    </div>
                ) : (
                    <div className="p-4 text-center text-sm text-slate-500">
                        Nenhuma subconta criada
                    </div>
                )}

                <div className="p-2 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800 flex justify-center">
                    <Button variant="ghost" size="sm" className="text-xs text-slate-500 hover:text-slate-700">
                        <Plus className="w-3 h-3 mr-1" />
                        Adicionar Pocket
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
