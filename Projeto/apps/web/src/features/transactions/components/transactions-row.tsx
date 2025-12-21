'use client'

import { StatusBadge } from "@/components/ui/status-badge"
import {
    ArrowDownCircle, ArrowUpCircle, ArrowRightLeft, CreditCard,
    CircleDashed, Wallet, PiggyBank, TrendingUp, Smartphone,
    Landmark, Globe, Utensils, Home, Car, ShoppingBag,
    Banknote, Zap, HeartPulse, Gamepad2, GraduationCap
} from "lucide-react"
import * as LucideIcons from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { InvoiceLinkIcon } from "@/features/cards/components/invoice-link-icon"
import { PayableLinkIcon } from "@/features/payables/components/payable-link-icon"
import { TransactionActions } from "./transaction-actions"

// Mapeamento simples de ícones de categoria
const categoryIcons: Record<string, any> = {
    alimentacao: Utensils,
    moradia: Home,
    transporte: Car,
    compras: ShoppingBag,
    salario: Banknote,
    contas: Zap,
    saude: HeartPulse,
    internet: Globe,
    lazer: Gamepad2,
    educacao: GraduationCap,
}

const getAccountIcon = (type: string) => {
    const normalized = type?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() || '';

    if (normalized.includes('carteira')) return Wallet;
    if (normalized.includes('poupanca')) return PiggyBank;
    if (normalized.includes('reserva_emergencia') || normalized.includes('reserva')) return PiggyBank;
    if (normalized.includes('investimento')) return TrendingUp;
    if (normalized.includes('digital')) return Smartphone;
    if (normalized.includes('corrente')) return Landmark;
    if (normalized.includes('internacional')) return Globe;
    if (normalized.includes('alimentacao') || normalized.includes('refeicao')) return Utensils;

    return CreditCard;
}

// Converter kebab-case para PascalCase
const kebabToPascal = (str: string): string => {
    return str
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('')
}

// Helper para resolver ícones dinamicamente
const getCategoryIcon = (iconName?: string, categoryName?: string) => {
    if (iconName) {
        const pascalName = kebabToPascal(iconName)
        if ((LucideIcons as any)[pascalName]) {
            return (LucideIcons as any)[pascalName]
        }
    }

    if (categoryName) {
        const normalized = categoryName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
        if (categoryIcons[normalized]) {
            return categoryIcons[normalized]
        }
    }

    return CircleDashed
}

export function TransactionRow({ tx }: { tx: any }) {
    const CategoryIcon = getCategoryIcon(tx.category?.icon, tx.category?.name)
    const categoryColor = tx.category?.color || '#94a3b8'

    let TypeIcon = ArrowRightLeft
    let typeColor = "text-slate-500 bg-slate-100 dark:bg-slate-800"

    if (tx.type === 'receita') {
        TypeIcon = ArrowUpCircle
        typeColor = "text-emerald-600 bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400"
    } else if (tx.type === 'despesa') {
        TypeIcon = ArrowDownCircle
        typeColor = "text-rose-600 bg-rose-100 dark:bg-rose-950/30 dark:text-rose-400"
    } else if (tx.type === 'transferencia') {
        TypeIcon = ArrowRightLeft
        if (tx.amount < 0) {
            typeColor = "text-rose-600 bg-rose-100 dark:bg-rose-950/30 dark:text-rose-400"
        } else {
            typeColor = "text-emerald-600 bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400"
        }
    }

    // Tratamento de Data
    const dateObj = new Date(tx.date);
    const displayDate = dateObj;
    const year = dateObj.getFullYear();

    const AccountIcon = tx.credit_card ? CreditCard : getAccountIcon(tx.account?.type)

    return (
        <tr className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
            <td className="p-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${typeColor}`}>
                    <TypeIcon className="w-4 h-4" />
                </div>
            </td>

            <td className="p-3">
                <div className="flex flex-col">
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                        {(() => {
                            const d = new Date(tx.date)
                            const utcDate = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
                            return format(utcDate, 'dd/MM/yyyy', { locale: ptBR })
                        })()}
                    </span>
                </div>
            </td>

            <td className="p-3">
                <div className="flex flex-col gap-1">
                    <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-tight flex items-center">
                        {(tx.invoice_id || tx.credit_card_invoice_id) && (
                            <InvoiceLinkIcon
                                invoiceId={tx.invoice_id || tx.credit_card_invoice_id}
                                description={tx.description}
                                categoryIcon={tx.category?.icon}
                                categoryColor={tx.category?.color}
                            />
                        )}
                        {tx.payable_id && (
                            <PayableLinkIcon
                                payableId={tx.payable_id}
                                description={tx.description}
                                categoryIcon={tx.category?.icon}
                                categoryColor={tx.category?.color}
                            />
                        )}
                        {tx.description}
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Subcategoria MOBILE ONLY */}
                        {tx.subcategory && (
                            <span className="md:hidden text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-slate-400" />
                                {tx.subcategory.name}
                            </span>
                        )}
                        {tx.is_paid === false && (
                            <StatusBadge variant="warning" className="h-5 px-1.5 text-[9px]">
                                Pendente
                            </StatusBadge>
                        )}
                        {(tx.installment_number && tx.total_installments) && (
                            <StatusBadge variant="info" className="h-5 px-1.5 text-[9px]">
                                {tx.installment_number}/{tx.total_installments}
                            </StatusBadge>
                        )}
                    </div>
                </div>
            </td>

            <td className="p-3 hidden md:table-cell">
                {tx.category ? (
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shadow-sm" style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}>
                            <CategoryIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-medium text-xs text-slate-700 dark:text-slate-300 leading-tight">
                                {tx.category.name}
                            </span>
                            {/* Subcategoria DESKTOP ONLY */}
                            {tx.subcategory && (
                                <span className="text-[10px] text-slate-400">
                                    {tx.subcategory.name}
                                </span>
                            )}
                        </div>
                    </div>
                ) : (
                    <span className="text-slate-400 text-xs italic">Sem categoria</span>
                )}
            </td>

            <td className="p-3 hidden md:table-cell">
                <div className="flex flex-col">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <AccountIcon className="w-3 h-3 text-slate-400" />
                        {tx.account?.name || tx.credit_card?.name || 'Carteira'}
                    </span>
                    <span className="text-[10px] text-slate-500 capitalize">
                        {tx.payment_method?.name || (tx.credit_card ? 'Cartão de Crédito' : 'Outros')}
                    </span>
                </div>
            </td>

            <td className="p-3 text-right">
                <div className={`font-bold text-base tracking-tight ${tx.type === 'receita' ? 'text-emerald-600 dark:text-emerald-400' :
                    tx.type === 'despesa' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'
                    }`}>
                    {tx.type === 'despesa' && '- '}{formatCurrency(tx.amount)}
                </div>
            </td>

            <td className="p-3 text-right">
                <TransactionActions transaction={tx} />
            </td>
        </tr>
    )
}
