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
                className="inline-flex items-center justify-center w-5 h-5 rounded-full hover:opacity-80 transition-opacity mr-2"
                style={{
                    backgroundColor: bgColor,
                    color: iconColor
                }}
                title="Ver fatura vinculada"
            >
                <IconComponent className="w-3 h-3" />
            </button>

            <InvoiceDetailsModal
                invoiceId={invoiceId}
                open={modalOpen}
                onOpenChange={setModalOpen}
            />
        </>
    )
}
