import { Badge } from "@/components/ui/badge"
import { PocketType } from "@/types/pockets"
import { Wallet, TrendingUp, PiggyBank } from "lucide-react"

export function PocketTypeBadge({ type }: { type: PocketType }) {
    switch (type) {
        case 'CAIXA':
            return (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800 flex items-center gap-1">
                    <Wallet className="w-3 h-3" />
                    Caixa
                </Badge>
            )
        case 'RESERVA_CDI':
            return (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 flex items-center gap-1">
                    <PiggyBank className="w-3 h-3" />
                    Reserva
                </Badge>
            )
        case 'INVESTIMENTO':
            return (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Invest
                </Badge>
            )
        default:
            return <Badge variant="secondary">{type}</Badge>
    }
}
