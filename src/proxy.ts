import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Rotas que não exigem sessão. Lista de permissão explícita (em vez de
// bloqueio explícito) de propósito: uma rota nova esquecida aqui fica
// protegida por padrão, não exposta por padrão.
const PUBLIC_PATH_PATTERNS: RegExp[] = [
  /^\/login(\/.*)?$/,
  /^\/api\/invites\/validate$/,
  /^\/guest(\/.*)?$/,
  /^\/convite$/,
  /^\/entrar-no-grupo$/,
  /^\/[^/]+\/convite$/,
  /^\/[^/]+\/entrar-no-grupo$/,
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATH_PATTERNS.some((pattern) => pattern.test(pathname));
}

/**
 * Renova a sessão do Supabase a cada request (padrão @supabase/ssr para o
 * App Router) e bloqueia rotas protegidas sem sessão, redirecionando para
 * /login. Isto é só a primeira linha de defesa / UX — a autorização real
 * (RLS + requireWorkspaceRole nas rotas /api/admin/*) continua sendo
 * verificada em cada camada abaixo, nunca só aqui.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublicPath(pathname)) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
