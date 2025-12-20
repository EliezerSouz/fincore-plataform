"use client"

import { useState } from "react"
import { Link2 } from "lucide-react"
import { InvoiceDetailsModal } from "./invoice-details-modal"

interface InvoiceLinkIconProps {
    invoiceId: string
    description: string
    categoryIcon?: string
    categoryColor?: string
}

export function InvoiceLinkIcon({ invoiceId, description, categoryIcon, categoryColor }: InvoiceLinkIconProps) {
    const [modalOpen, setModalOpen] = useState(false)

    // Sempre usar Link2 para o ícone de link
    const IconComponent = Link2

    // Usar cor da categoria ou azul como fallback
    const iconColor = categoryColor || '#3b82f6'
    const bgColor = `${iconColor}20` // 20 = 12.5% opacity

    return (
        <>
            <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mr-1"
                style={{
                    color: iconColor
                }}
                title="Ver fatura vinculada"
            >
                <div className="flex items-center justify-center w-5 h-5 rounded-full" style={{ backgroundColor: bgColor }}>
                    <IconComponent className="w-3 h-3" />
                </div>
            </button>

            <InvoiceDetailsModal
                invoiceId={invoiceId}
                open={modalOpen}
                onOpenChange={setModalOpen}
            />
        </>
    )
}
