import { Heart } from "lucide-react"
import { cn } from "@/lib/utils"

interface LogoProps {
    className?: string
    size?: "sm" | "md" | "lg" | "xl"
}

export function Logo({ className, size = "md" }: LogoProps) {
    const sizeClasses = {
        sm: "text-lg",
        md: "text-xl",
        lg: "text-2xl",
        xl: "text-3xl"
    }

    const iconSizes = {
        sm: "w-4 h-4",
        md: "w-5 h-5",
        lg: "w-6 h-6",
        xl: "w-8 h-8",
    }

    return (
        <div className={cn("flex items-center font-bold text-slate-900 dark:text-white tracking-tight select-none group", sizeClasses[size], className)}>
            <span>FINC</span>
            <div className="relative flex items-center justify-center mx-[1px]">
                <Heart
                    className={cn(
                        "fill-rose-500 text-rose-600 dark:text-rose-500 transition-all duration-300 group-hover:scale-110",
                        iconSizes[size]
                    )}
                    strokeWidth={2.5}
                />
            </div>
            <span>RE</span>
        </div>
    )
}
