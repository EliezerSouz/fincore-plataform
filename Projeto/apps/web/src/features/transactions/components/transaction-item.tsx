import {
    ArrowDownCircle, ArrowUpCircle, ArrowRightLeft, CreditCard,
    CircleDashed, Wallet, PiggyBank, TrendingUp, Smartphone,
    Landmark, Globe, Utensils, Home, Car, ShoppingBag,
    Banknote, Zap, HeartPulse, Gamepad2, GraduationCap,
    Calendar,
    Tag
} from "lucide-react"
import * as LucideIcons from "lucide-react"
import { StatusBadge } from "@/components/ui/status-badge"
import { formatCurrency, cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { InvoiceLinkIcon } from "@/features/cards/components/invoice-link-icon"
import { PayableLinkIcon } from "@/features/payables/components/payable-link-icon"
import { TransactionActions } from "./transaction-actions"

// Mapeamento simples de ícones de categoria (duplicado de transaction-row para manter independência ou poderia ser extraído)
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

export function TransactionItem({ tx }: { tx: any }) {
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

    const AccountIcon = tx.credit_card ? CreditCard : getAccountIcon(tx.account?.type)

    return (
        <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-white dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
            {/* Ícone à esquerda (Categoria ou Tipo) */}
            <div className="shrink-0 relative">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-sm ${typeColor}`}>
                    <TypeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                {/* Pequeno badge com o ícone da categoria */}
                {tx.category && (
                    <div 
                        className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shadow-sm border border-white dark:border-slate-950"
                        style={{ backgroundColor: categoryColor, color: '#fff' }}
                    >
                        <CategoryIcon className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                    </div>
                )}
            </div>

            {/* Detalhes no centro */}
            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">
                        {tx.description}
                    </span>
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
                </div>

                <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1 shrink-0">
                        <Calendar className="w-3 h-3" />
                        {(() => {
                            const d = new Date(tx.date)
                            const utcDate = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
                            return format(utcDate, 'dd/MM', { locale: ptBR })
                        })()}
                    </span>
                    
                    {tx.category && (
                        <>
                            <span className="w-0.5 h-3 bg-slate-300 dark:bg-slate-700 rounded-full shrink-0" />
                            <span className="truncate max-w-[80px] md:max-w-none">
                                {tx.category.name}
                            </span>
                        </>
                    )}
                    
                    {tx.subcategory && (
                        <>
                            <span className="w-0.5 h-3 bg-slate-300 dark:bg-slate-700 rounded-full shrink-0" />
                            <span className="truncate max-w-[80px] md:max-w-none text-slate-400">
                                {tx.subcategory.name}
                            </span>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-slate-400 mt-0.5">
                    <AccountIcon className="w-3 h-3 shrink-0" />
                    <span className="truncate">
                        {tx.account?.name || tx.credit_card?.name || 'Carteira'}
                    </span>
                    {tx.payment_method && (
                        <>
                            <span>•</span>
                            <span className="capitalize truncate">{tx.payment_method.name}</span>
                        </>
                    )}
                </div>
            </div>

            {/* Valor e Ações à direita */}
            <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={`font-bold text-sm sm:text-base ${
                    tx.type === 'receita' ? 'text-emerald-600 dark:text-emerald-400' :
                    tx.type === 'despesa' ? 'text-rose-600 dark:text-rose-400' : 
                    'text-slate-600 dark:text-slate-400'
                }`}>
                    {tx.type === 'despesa' && '- '}{formatCurrency(tx.amount)}
                </span>
                
                {/* Status Badges Compactos */}
                <div className="flex items-center gap-1">
                    {tx.is_paid === false && (
                        <StatusBadge variant="warning" className="h-3.5 sm:h-4 px-1 text-[8px] sm:text-[9px]">Pendente</StatusBadge>
                    )}
                    {(tx.installment_number && tx.total_installments) && (
                        <StatusBadge variant="info" className="h-3.5 sm:h-4 px-1 text-[8px] sm:text-[9px]">
                            {tx.installment_number}/{tx.total_installments}
                        </StatusBadge>
                    )}
                </div>
            </div>
        </div>
    )
}
