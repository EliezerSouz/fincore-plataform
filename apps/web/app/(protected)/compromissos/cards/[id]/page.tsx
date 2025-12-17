import { notFound } from "next/navigation"
import { getCreditCardById, getCardInvoices } from "../actions"
import { InvoiceList } from "./invoice-list"
import { TransactionForm } from "./transaction-form"
import { ArrowLeft, CreditCard } from "lucide-react"
import Link from "next/link"
import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { getAccounts } from "@/app/(protected)/caixa/accounts/actions"
import { getPaymentMethods } from "@/app/(protected)/caixa/transactions/actions"

interface Props {
    params: Promise<{ id: string }>
}

export default async function CardDetailsPage({ params }: Props) {
    const { id } = await params

    // Buscar dados em paralelo para performance
    const [card, invoices, accounts, paymentMethods] = await Promise.all([
        getCreditCardById(id),
        getCardInvoices(id),
        getAccounts(true), // Fetch active accounts
        getPaymentMethods()
    ])

    if (!card) {
        return notFound()
    }

    // Garantir que as invoices sejam um array (mesmo que vazio) e serializável
    const safeInvoices = Array.isArray(invoices) ? JSON.parse(JSON.stringify(invoices)) : []
    const safeAccounts = Array.isArray(accounts) ? JSON.parse(JSON.stringify(accounts)) : [] // Serialize dates if needed
    const safePaymentMethods = Array.isArray(paymentMethods) ? JSON.parse(JSON.stringify(paymentMethods)) : []

    const description = `Final •••• ${card.last_4_digits || '????'} | ${card.brand.toUpperCase()} | Fecha dia ${card.closing_day} | Vence dia ${card.due_day}`

    return (
        <PageLayout
            title={card.name}
            description={description}
            icon={CreditCard}
            action={
                <div className="flex items-center gap-2">
                    <Button variant="ghost" asChild className="gap-2 text-muted-foreground hover:text-foreground">
                        <Link href="/compromissos/cards">
                            <ArrowLeft className="w-4 h-4" /> Voltar
                        </Link>
                    </Button>
                    <TransactionForm cardId={card.id} cardName={card.name} />
                </div>
            }
        >
            {/* Invoices Section */}
            <InvoiceList
                invoices={safeInvoices}
                cardId={id}
                accounts={safeAccounts}
                cardName={card.name}
                cardColor={card.color}
                cardBrand={card.brand}
                paymentMethods={safePaymentMethods}
            />
        </PageLayout>
    )
}
