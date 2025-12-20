import { getUserData } from "@/lib/get-user-data"
import { redirect } from "next/navigation"
import { DashboardClient } from "./dashboard-client"

export default async function DashboardPage() {
    // Buscar dados do usuário no servidor (usa cookies sem problema)
    const userData = await getUserData()

    // Se não tiver usuário, redirecionar para login
    if (!userData) {
        redirect('/login')
    }

    // Passar dados como props para o client component
    return <DashboardClient userData={userData} />
}
