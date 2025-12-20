import { Metadata } from "next"
import { InvestmentsView } from "./investments-view"

export const metadata: Metadata = {
  title: "Investimentos | FinCore",
  description: "Gerencie seu patrimônio e acompanhe seus rendimentos.",
}

export default async function InvestmentsPage() {
  return <InvestmentsView />
}
