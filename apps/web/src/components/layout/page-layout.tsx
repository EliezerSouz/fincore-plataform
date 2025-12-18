import { ReactNode } from "react"
import { LucideIcon } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { PageWatermark } from "@/components/page-watermark"
import { PageHeader } from "@/components/ui/page-header"

interface PageLayoutProps {
    // Header
    title: string
    description: string
    action?: ReactNode

    // Summary Cards (opcional)
    summaryCards?: ReactNode

    // Conteúdo principal
    children: ReactNode

    // Watermark
    icon: LucideIcon

    // Customização
    className?: string

    // Filter Bar (New Standard)
    filterBar?: ReactNode
}

export function PageLayout({
    title,
    description,
    action,
    summaryCards,
    filterBar,
    children,
    icon: Icon,
    className = ""
}: PageLayoutProps) {
    return (
        <div className={`flex-1 space-y-8 p-8 pt-6 animate-in fade-in duration-500 relative overflow-hidden ${className}`}>
            {/* Standard Header */}
            <PageHeader
                title={title}
                description={description}
                action={action}
                className="relative z-10"
            />

            {/* Filter Bar */}
            {filterBar && (
                <div className="relative z-10 w-full">
                    {filterBar}
                </div>
            )}

            {/* Summary Cards (se fornecidos) */}
            {summaryCards && (
                <>
                    <div className="relative z-10">
                        {summaryCards}
                    </div>
                    {/* Only show separator if no filterBar, because FilterBar has its own separator/spacing usually, or we keep it? 
                        The FilterBar component has "border-b" and "mb-6".
                        The Separator here might be redundant if FilterBar is present.
                        Let's keep it for safety but typically FilterBar visual replaces the separator. 
                    */}
                    {!filterBar && <Separator className="my-6 relative z-10" />}
                </>
            )}

            {/* Conteúdo Principal */}
            <div className="relative z-10">
                {children}
            </div>

            {/* Watermark de Fundo */}
            <PageWatermark>
                <Icon className="w-[600px] h-[600px]" strokeWidth={0.5} />
            </PageWatermark>
        </div>
    )
}
