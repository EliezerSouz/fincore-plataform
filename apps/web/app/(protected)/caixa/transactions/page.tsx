import { getCategories, getTransactions } from "./actions"
import { getAccounts } from "../accounts/actions"
import { TransactionsView } from "./transactions-view"

export default async function TransactionsPage() {
    // Default default period (current month) logic matches TransactionsView
    const now = new Date()
    // const year = now.getFullYear().toString()
    // const month = now.getMonth().toString() 

    const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

    const [accounts, categories, transactions] = await Promise.all([
        getAccounts(),
        getCategories(),
        getTransactions({
            limit: 100,
            from: defaultFrom,
            to: defaultTo
        })
    ])

    return (
        <TransactionsView
            accounts={accounts}
            categories={categories}
            initialInsights={[]}
        />
    )
}
