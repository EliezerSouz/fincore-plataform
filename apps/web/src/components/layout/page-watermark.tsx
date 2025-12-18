"use client"

export function PageWatermark({ children }: { children: React.ReactNode }) {
    return (
        <div className="fixed -bottom-20 -right-20 z-0 pointer-events-none opacity-[0.03] dark:opacity-[0.02] select-none text-slate-900 dark:text-white" aria-hidden="true">
            {children}
        </div>
    )
}
