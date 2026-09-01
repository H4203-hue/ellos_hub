import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Cliente Supabase para Server Components e Route Handlers, ligado à sessão
 * do cookie da requisição atual (via @supabase/ssr). Ao contrário do cliente
 * de service-role usado nas rotas /api/admin/*, este roda com a sessão do
 * próprio usuário e respeita RLS normalmente.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // `set` fora de uma Server Function/Route Handler (ex.: durante
          // render de Server Component) lança — é seguro ignorar aqui,
          // o refresh de sessão nesse caso já é tratado pelo proxy.ts.
        }
      },
    },
  });
}
