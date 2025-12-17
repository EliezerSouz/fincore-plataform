import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
    // return await updateSession(request)

    // Atualiza a sessão
    const response = await updateSession(request);

    // Cria o cliente Supabase para verificar a sessão no middleware
    // Note: updateSession já lida com a resposta, mas aqui precisamos ler o cookie atualizado para lógica de roteamento
    // Como simplificação, vamos assumir que se updateSession retornou sucesso, a sessão está OK ou sendo renovada.
    // Mas para roteamento preciso, o ideal é checar o getUser novamente ou confiar nos cookies se estiverem presentes.
    // O padrão do Supabase sugere checar user no updateSession ou logo após.

    // Vamos adicionar uma verificação simples de rota protegida baseada na presença do cookie de auth
    // (Isso é uma verificação 'leve', a segurança real está no RLS no banco e no getUser nas Server Actions/Components)

    const { pathname } = request.nextUrl;

    // Se quiser ser mais estrito, precisamos chamar getUser aqui, mas createServerClient do middleware é diferente.
    // Vamos confiar no comportamento padrão de redirecionamento das páginas/layouts se não houver dados também.
    // Mas para UX (redirecionar antes de renderizar), podemos checar cookies.

    // PROTEÇÃO DE ROTA SIMPLIFICADA (UX)
    // Se tentar acessar dashboard sem cookie de auth -> Login
    // Se tentar acessar login com cookie de auth -> Dashboard

    const hasAuthCookie = request.cookies.getAll().some(c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'));

    // Rotas protegidas (precisa de login)
    const protectedPrefixes = ['/dashboard', '/caixa', '/compromissos', '/patrimonio', '/sistema'];

    if (protectedPrefixes.some(prefix => pathname.startsWith(prefix))) {
        if (!hasAuthCookie) {
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }
    }

    // Rotas de Auth (se já logado, redireciona para dentro)
    if (pathname === '/login' || pathname === '/signup' || pathname === '/') {
        if (hasAuthCookie) {
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }
    }

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
