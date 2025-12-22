import { Heart } from "lucide-react"
import { cn } from "@/lib/utils"

interface HeartbeatBackgroundProps {
    className?: string
    opacity?: number
}

export function HeartbeatBackground({ className, opacity = 0.05 }: HeartbeatBackgroundProps) {
    return (
        <div className={cn("absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden select-none", className)}>
            <div className="relative animate-heartbeat-slow">
                <Heart
                    className={cn(
                        "w-40 h-40 text-rose-500 fill-rose-500",
                        "dark:text-rose-500 dark:fill-rose-500"
                    )}
                    style={{ opacity }}
                    strokeWidth={0}
                />
            </div>
        </div>
    )
}
