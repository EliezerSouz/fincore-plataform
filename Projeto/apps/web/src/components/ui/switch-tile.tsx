import * as React from "react"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface SwitchTileProps {
    checked: boolean
    onCheckedChange: (checked: boolean) => void
    label: string
    description?: string
    icon?: LucideIcon
    iconClassName?: string
    className?: string
    disabled?: boolean
}

export function SwitchTile({
    checked,
    onCheckedChange,
    label,
    description,
    icon: Icon,
    iconClassName,
    className,
    disabled
}: SwitchTileProps) {
    return (
        <div
            onClick={() => !disabled && onCheckedChange(!checked)}
            className={cn(
                "flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer select-none",
                "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800",
                "hover:border-slate-300 dark:hover:border-slate-700 active:scale-[0.99]",
                disabled && "opacity-50 cursor-not-allowed active:scale-100",
                className
            )}
        >
            <div className="flex items-center gap-3 flex-1 min-w-0">
                {Icon && (
                    <div className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                        checked 
                            ? (iconClassName || "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400") 
                            : "bg-slate-200 text-slate-400 dark:bg-slate-800"
                    )}>
                        <Icon className="w-4 h-4" />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                        {label}
                    </p>
                    {description && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {description}
                        </p>
                    )}
                </div>
            </div>
            
            <div className="pl-2">
                <Switch 
                    checked={checked} 
                    onCheckedChange={onCheckedChange} 
                    disabled={disabled}
                    className="data-[state=checked]:bg-blue-600"
                />
            </div>
        </div>
    )
}
