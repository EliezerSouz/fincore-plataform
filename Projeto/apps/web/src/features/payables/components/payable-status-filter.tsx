"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function PayableStatusFilter({ initialStatus }: { initialStatus: string }) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const onValueChange = (val: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (val === 'all') params.delete('status')
        else params.set('status', val)
        router.push(`?${params.toString()}`)
    }

    return (
        <Select defaultValue={initialStatus} onValueChange={onValueChange}>
            <SelectTrigger className="w-[150px] h-11 bg-card">
                <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Status: Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
            </SelectContent>
        </Select>
    )
}
