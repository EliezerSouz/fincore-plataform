import { Metadata } from "next"
import { PaymentMethodsView } from "./payment-methods-view"

export const metadata: Metadata = {
    title: "Modalidades de Pagamento | Sistema",
    description: "Gerencie suas modalidades de pagamento",
}

export default function PaymentMethodsPage() {
    return <PaymentMethodsView />
}
