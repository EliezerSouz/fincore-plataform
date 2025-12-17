import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { forwardRef } from "react"

interface CreateButtonProps extends React.ComponentProps<typeof Button> {
    label: string
    icon?: React.ElementType
}

export const CreateButton = forwardRef<HTMLButtonElement, CreateButtonProps>(
    ({ label, icon: Icon = Plus, className, ...props }, ref) => {
        return (
            <Button
                ref={ref}
                size="sm"
                className={cn(
                    "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm gap-2 font-medium transition-all hover:scale-[1.02] active:scale-95",
                    className
                )}
                {...props}
            >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">Novo</span>
            </Button>
        )
    }
)
CreateButton.displayName = "CreateButton"
