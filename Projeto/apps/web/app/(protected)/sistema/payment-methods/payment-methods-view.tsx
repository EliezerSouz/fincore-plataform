"use client"

import { useState, useEffect } from "react"
import { getPaymentMethods, deletePaymentMethod, PaymentMethod } from "./actions"
import { PaymentMethodDialog } from "./payment-method-dialog"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Check, X, ArrowUpCircle, ArrowDownCircle, ArrowLeftRight, CreditCard, FileText, GitBranch, Wallet } from "lucide-react"
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
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { PageLayout } from "@/components/layout/page-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function PaymentMethodsView() {
    const [methods, setMethods] = useState<PaymentMethod[]>([])
    const [loading, setLoading] = useState(true)
    const [deleteId, setDeleteId] = useState<string | null>(null)

    useEffect(() => {
        loadMethods()
    }, [])

    async function loadMethods() {
        setLoading(true)
        const data = await getPaymentMethods()
        setMethods(data)
        setLoading(false)
    }

    async function handleDelete(id: string) {
        try {
            await deletePaymentMethod(id)
            setDeleteId(null)
            loadMethods()
            toast.success("Modalidade excluída com sucesso!")
        } catch (error: any) {
            toast.error(error.message || "Erro ao excluir modalidade")
        }
    }

    const Badge = ({ active, label, icon: Icon, color }: any) => (
        <div className={cn(
            "inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium",
            active
                ? `${color} text-white`
                : "bg-slate-100 dark:bg-slate-800 text-slate-400"
        )}>
            <Icon className="w-3 h-3" />
            {active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
        </div>
    )

    return (
        <PageLayout
            title="Modalidades de Pagamento"
            description="Configure onde e como cada forma de pagamento pode ser utilizada"
            icon={CreditCard}
            action={<PaymentMethodDialog onSuccess={loadMethods} />}
        >
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : methods.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 relative z-10">
                    <p className="text-slate-500 dark:text-slate-400">Nenhuma modalidade cadastrada</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Clique em "Nova Modalidade" para começar</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {methods.map((method) => (
                        <Card key={method.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{method.name}</h3>
                                            <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-400">
                                                {method.slug}
                                            </code>
                                            {method.is_active ? (
                                                <span className="inline-flex px-2 py-1 bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 rounded text-xs font-medium">
                                                    Ativo
                                                </span>
                                            ) : (
                                                <span className="inline-flex px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded text-xs font-medium">
                                                    Inativo
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <PaymentMethodDialog
                                            method={method}
                                            onSuccess={loadMethods}
                                            trigger={
                                                <Button variant="ghost" size="icon" className="h-11 w-11 text-slate-500 hover:text-blue-600">
                                                    <Edit className="w-5 h-5" />
                                                </Button>
                                            }
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-11 w-11 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                                            onClick={() => setDeleteId(method.id)}
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* CONTEXTOS DE USO */}
                                    <div>
                                        <h4 className="text-xs font-semibold uppercase text-slate-500 mb-3">Contextos de Uso</h4>
                                        <div className="flex flex-wrap gap-2">
                                            <Badge
                                                active={method.allows_income}
                                                label="Receitas"
                                                icon={ArrowUpCircle}
                                                color="bg-emerald-600"
                                            />
                                            <Badge
                                                active={method.allows_expense}
                                                label="Despesas"
                                                icon={ArrowDownCircle}
                                                color="bg-red-600"
                                            />
                                            <Badge
                                                active={method.allows_transfer}
                                                label="Transferências"
                                                icon={ArrowLeftRight}
                                                color="bg-blue-600"
                                            />
                                            <Badge
                                                active={method.affects_credit_card}
                                                label="Cartão"
                                                icon={CreditCard}
                                                color="bg-purple-600"
                                            />
                                            <Badge
                                                active={method.affects_invoice}
                                                label="Faturas"
                                                icon={FileText}
                                                color="bg-amber-600"
                                            />
                                            <Badge
                                                active={method.is_internal}
                                                label="Interno"
                                                icon={GitBranch}
                                                color="bg-slate-600"
                                            />
                                        </div>
                                    </div>

                                    {/* COMPORTAMENTO */}
                                    <div>
                                        <h4 className="text-xs font-semibold uppercase text-slate-500 mb-3">Comportamento</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Wallet className={cn("w-4 h-4", method.affects_balance ? "text-green-600" : "text-slate-400")} />
                                                <span className={cn(method.affects_balance ? "text-slate-700 dark:text-slate-300" : "text-slate-400")}>
                                                    {method.affects_balance ? "Afeta saldo imediatamente" : "Não afeta saldo"}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Wallet className={cn("w-4 h-4", method.requires_bank_account ? "text-indigo-600" : "text-slate-400")} />
                                                <span className={cn(method.requires_bank_account ? "text-slate-700 dark:text-slate-300" : "text-slate-400")}>
                                                    {method.requires_bank_account ? "Requer conta bancária" : "Não requer conta"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir esta modalidade de pagamento? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteId && handleDelete(deleteId)}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </PageLayout>
    )
}
