"use server"

import { cookies } from "next/headers"

export async function getGroqTransactionInsight(transactions: any[]) {
    try {
        const cookieStore = await cookies()
        // Supabase default auth cookie usually contains the token. However, for a generic authorized request,
        // we might need to rely on how the frontend stores it. 
        // Assuming the backend verifies the Supabase token which is passed as Bearer.
        // We might need to get the session from supabase auth helpers if available, or try to find the cookie.
        // Typically Next.js Supabase auth stores it in `sb-[project-ref]-auth-token`.
        // For now, let's try to get the 'token' or 'access_token' if stored, or rely on the user session.
        // Strategy: Since this is a server action called from the client, we might not have the raw token easily if it's httpOnly.
        // BUT, we are in a server action.

        // Let's use the createServerClient to get the token properly if we were using supabase-ssr.
        // Since we don't have the full auth setup context here, let's look for standard cookies.
        // Actually, the previous code didn't use auth, it was just an API call.
        // The Go backend requires AuthMiddleware.
        // The simplest way to forward auth in a Server Action is if the client passes the token, OR if we extract it from cookies.

        // SIMPLIFICATION:
        // The Supabase Auth cookie is complicated to parse manually. 
        // Let's assume the user has a valid session.
        // To make this robust, we should probably let the CLIENT call the backend directly via a Route Handler or just pass the token.

        // WAIT. The Go backend middleware verifies the token.
        // If we are server-side Next.js, we need to pass that token to the Go backend.

        // Alternative: Using `createServerClient` from `@supabase/ssr` (which is likely in the project based on package.json/structure) would be best.
        // checking imports...

        // Let's try to find the `sb-access-token` or similar.
        // If not found, return "User not authenticated".

        // Hack for now: The cookie name depends on the project ID.
        // Let's iterate cookies to find one starting with 'sb-' and ending with '-auth-token'.

        let token = ""
        const allCookies = cookieStore.getAll()
        const authCookie = allCookies.find(c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'))

        if (authCookie) {
            try {
                let cookieValue = authCookie.value
                if (cookieValue.startsWith('base64-')) {
                    cookieValue = Buffer.from(cookieValue.substring(7), 'base64').toString('utf-8')
                }
                const sessionData = JSON.parse(cookieValue)
                token = sessionData.access_token || sessionData[0]
            } catch (e) {
                console.error("Failed to parse auth cookie", e)
            }
        }

        if (!token) {
            // Fallback: Check if there is a 'token' cookie set manually (some setups do this)
            const simpleToken = cookieStore.get('token')
            if (simpleToken) token = simpleToken.value
        }

        if (!token) {
            return {
                title: "Autenticação Necessária",
                message: "Não foi possível identificar sua sessão. Faça login novamente.",
                type: "warning"
            }
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

        const response = await fetch(`${apiUrl}/api/ai/insight`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                transactions: transactions.slice(0, 5000).map((tx: any) => ({
                    date: tx.date,
                    description: tx.description,
                    amount: tx.amount,
                    type: tx.type,
                    category: tx.category?.name || tx.category,
                    account: tx.account?.name || tx.account
                }))
            })
        })

        if (!response.ok) {
            const errorText = await response.text()
            let errorMessage = `Erro ${response.status}`

            try {
                const jsonErr = JSON.parse(errorText)
                if (jsonErr.error) {
                    errorMessage = jsonErr.error
                } else if (typeof jsonErr === 'string') {
                    errorMessage = jsonErr
                } else {
                    errorMessage = errorText
                }
            } catch (e) {
                errorMessage = errorText
                if (errorMessage.length > 100) errorMessage = errorMessage.substring(0, 100) + "..."
            }

            console.error("Backend Error:", response.status, errorText)
            throw new Error(errorMessage)
        }

        const data = await response.json()
        return data

    } catch (error: any) {
        console.error("Erro ao gerar insight:", error)
        return {
            title: "Não foi possível gerar insight",
            message: error.message || "Ocorreu um erro desconhecido ao comunicar com o servidor.",
            type: "warning"
        }
    }
}
