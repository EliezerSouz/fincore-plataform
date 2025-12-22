import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
    // Atualiza a sessão e obtém o usuário validado
    // updateSession já lida com refresh de token se necessário
    const { response, user } = await updateSession(request);

    const { pathname } = request.nextUrl;

    // PROTEÇÃO DE ROTA (UX + Segurança)
    
    // Lista de prefixos protegidos
    const protectedPrefixes = ['/dashboard', '/caixa', '/compromissos', '/patrimonio', '/sistema'];
    const isProtectedRoute = protectedPrefixes.some(prefix => pathname.startsWith(prefix));
    
    // Rotas de Autenticação (onde usuário logado não deve estar)
    const isAuthRoute = pathname === '/login' || pathname === '/signup' || pathname === '/';

    // 1. Redirecionar para Login se tentar acessar rota protegida sem usuário
    if (isProtectedRoute && !user) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        const redirectResponse = NextResponse.redirect(url)
        
        // CRÍTICO: Copiar cookies da resposta do Supabase.
        // Se updateSession tentou limpar cookies inválidos/expirados, precisamos passar isso adiante.
        response.cookies.getAll().forEach(c => {
            redirectResponse.cookies.set(c.name, c.value, c)
        })
        
        return redirectResponse
    }

    // 2. Redirecionar para Dashboard se usuário logado tentar acessar login/signup/home
    if (isAuthRoute && user) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        const redirectResponse = NextResponse.redirect(url)
        
        // CRÍTICO: Copiar cookies da resposta do Supabase.
        // Se updateSession fez refresh do token, precisamos passar o novo token adiante.
        response.cookies.getAll().forEach(c => {
            redirectResponse.cookies.set(c.name, c.value, c)
        })
        
        return redirectResponse
    }

    // Se não houve redirecionamento, retorna a resposta original do updateSession
    // que contém os cookies atualizados (refresh token, etc)
    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
