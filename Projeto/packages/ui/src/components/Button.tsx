import * as React from "react";
import { Text, Pressable, View } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const buttonVariants = cva(
    "flex-row items-center justify-center rounded-md gap-2 ",
    {
        variants: {
            variant: {
                default: "bg-blue-600 active:bg-blue-700",
                destructive: "bg-red-500 active:bg-red-600",
                outline: "border border-input bg-transparent active:bg-accent",
                secondary: "bg-secondary active:bg-secondary/80",
                ghost: "web:hover:bg-accent web:hover:text-accent-foreground active:bg-accent/50",
                link: "text-primary web:underline-offset-4 web:hover:underline",
                success: "bg-emerald-600 text-white web:hover:bg-emerald-700 active:bg-emerald-700",
                warning: "bg-amber-500 text-white web:hover:bg-amber-600 active:bg-amber-600",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-md px-3",
                lg: "h-11 rounded-md px-8",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

const buttonTextVariants = cva("text-sm font-medium", {
    variants: {
        variant: {
            default: "text-white",
            destructive: "text-white",
            outline: "text-black dark:text-white",
            secondary: "text-black dark:text-white",
            ghost: "text-black dark:text-white",
            link: "text-blue-600 underline",
            success: "text-white",
            warning: "text-white",
        },
        size: {
            default: "",
            sm: "",
            lg: "",
            icon: "",
        },
    },
    defaultVariants: {
        variant: "default",
        size: "default",
    },
});

export interface ButtonProps
    extends React.ComponentPropsWithoutRef<typeof Pressable>,
    VariantProps<typeof buttonVariants> {
    label?: string; // Optional label prop if children is just text
    className?: string; // Explicit addition
}

function Button({
    className,
    variant,
    size,
    children,
    label,
    ...props
}: ButtonProps) {
    return (
        <Pressable
            // @ts-ignore: NativeWind types augmentation is finicky in monorepos
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
        >
            {label ? (
                <Text className={cn(buttonTextVariants({ variant: variant as any, size: size as any }))}>
                    {label}
                </Text>
            ) : (
                // Check if children is a string, if so wrap in Text, otherwise render as is
                // Note: In RN, you can't render raw strings outside Text.
                // This simple check might not be enough for complex children, 
                // but for a shared button it's a start.
                typeof children === "string" ? (
                    <Text className={cn(buttonTextVariants({ variant: variant as any, size: size as any }))}>
                        {children}
                    </Text>
                ) : children
            )}
        </Pressable>
    );
}

export { Button, buttonVariants };
