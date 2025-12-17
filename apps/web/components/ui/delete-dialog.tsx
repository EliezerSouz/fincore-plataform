"use client"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DeleteDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void | Promise<void>
    title?: string
    description?: React.ReactNode
    isDeleting?: boolean
    confirmText?: string
}

export function DeleteDialog({
    open,
    onOpenChange,
    onConfirm,
    title = "Excluir item",
    description = "Esta ação não pode ser desfeita. Isso excluirá permanentemente o item selecionado.",
    isDeleting = false,
    confirmText = "Sim, excluir"
}: DeleteDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault()
                            onConfirm()
                        }}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600"
                    >
                        {isDeleting ? "Excluindo..." : confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
