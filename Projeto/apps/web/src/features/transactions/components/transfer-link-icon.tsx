"use client"

import { useState } from "react"
import { ArrowRightLeft } from "lucide-react"
import { TransferDetailsDialog } from "./transfer-details-dialog"

interface TransferLinkIconProps {
    transaction: any
}

export function TransferLinkIcon({ transaction }: TransferLinkIconProps) {
    const [dialogOpen, setDialogOpen] = useState(false)

    // Ícone de transferência
    const IconComponent = ArrowRightLeft

    // Forçar cor roxa/azul para parecer link, ou usar cor da categoria
    const iconColor = '#0ea5e9' // Sky-500 (azul claro similar ao link)
    const bgColor = `${iconColor}20` // 20 = 12.5% opacity

    // Renderizar apenas o botão de abrir o dialog. 
    // O TransferDetailsDialog deve ser controlado externamente ou modificado para aceitar 'open' e 'onOpenChange'
    // Mas o TransferDetailsDialog atual é um Trigger+Content, não um Modal controlado.
    // Vamos ajustar para chamar o dialog.

    // Na verdade, o TransferDetailsDialog atual já tem o trigger dentro dele.
    // Vamos fazer um wrapper simples.

    return (
        <div className="inline-flex mr-1">
            <TransferDetailsDialog
                transaction={transaction}
                trigger={
                    <button
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        style={{ color: iconColor }}
                        title="Ver detalhes da transferência"
                    >
                        <div className="flex items-center justify-center w-5 h-5 rounded-full" style={{ backgroundColor: bgColor }}>
                            <IconComponent className="w-3 h-3" />
                        </div>
                    </button>
                }
            />
        </div>
    )
}
