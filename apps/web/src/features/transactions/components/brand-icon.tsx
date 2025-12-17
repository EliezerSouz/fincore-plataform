import { CreditCard } from "lucide-react"

export function BrandIcon({ brand, className }: { brand: string, className?: string }) {
    if (!brand) return <CreditCard className={className} />

    // Normalize brand name
    const b = brand.toLowerCase().replace(/[^a-z0-9]/g, '')

    // Visa - Abstract Swoosh/Wing
    if (b.includes('visa')) {
        return (
            <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
                <path d="M2.5 12c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.5" />
                <path d="M12 20c4.418 0 8-3.582 8-8" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.7" />
                <path d="M4 12c0 2.5 1.5 5 4 6" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.3" />
            </svg>
        )
    }

    // Mastercard - Geometric Intersecting Circles
    if (b.includes('master')) {
        return (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
                <circle cx="8" cy="12" r="6" stroke="currentColor" strokeWidth="2.5" opacity="0.6" />
                <circle cx="16" cy="12" r="6" stroke="currentColor" strokeWidth="2.5" opacity="0.6" />
                <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.2" />
            </svg>
        )
    }

    // Amex - Geometric Square Pattern
    if (b.includes('amex') || b.includes('american')) {
        return (
            <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
                <mask id="grid-mask">
                    <rect width="24" height="24" fill="white" />
                    <circle cx="12" cy="12" r="8" fill="black" />
                </mask>
                <rect x="2" y="2" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
                <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="1" />
                <rect x="8" y="8" width="8" height="8" fill="currentColor" opacity="0.3" />
            </svg>
        )
    }

    // Default - Geometric Chip/Circuit Style
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
            <circle cx="12" cy="12" r="8" strokeWidth="1" opacity="0.2" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" strokeWidth="2" opacity="0.5" />
            <rect x="8" y="8" width="8" height="8" rx="2" strokeWidth="2" />
        </svg>
    )
}
