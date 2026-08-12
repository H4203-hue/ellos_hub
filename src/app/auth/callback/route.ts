import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || anonKey;

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;
  const next = requestUrl.searchParams.get('next') ?? '/';

  if (code) {
    try {
      const cookieStore = await cookies();
      
      // 🟢 Supabase SSR Server Client (para ler cookies PKCE e trocar o code por sessão)
      const supabase = createServerClient(supabaseUrl, anonKey, {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Chamado em Server Component/Route Handler
            }
          },
        },
      });

      const { data: authData, error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error && authData?.user) {
        const user = authData.user;
        const userEmail = user.email || '';
        const userName = user.user_metadata?.full_name || user.user_metadata?.name || userEmail || 'Integrante';

        // 🟢 Supabase Admin Client (para upsert/insert em public.profiles)
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });

        const { data: existingProfile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();

        if (!existingProfile) {
          await supabaseAdmin.from('profiles').insert([{
            id: user.id,
            name: userName,
            email: userEmail,
            role: 'MEMBER',
            voice: 'Geral',
            is_active: true,
          }]);
        }

        const redirectUrl = new URL(next, origin);
        redirectUrl.searchParams.set('login', 'success');
        return NextResponse.redirect(redirectUrl.toString());
      } else if (error) {
        console.warn('Erro ao trocar code por sessão via SSR:', error.message);
      }
    } catch (err) {
      console.error('Erro de execução no callback OAuth:', err);
    }
  }

  // Se redirecionado com hash ou em caso de fallback, redirecionar para a home ou login sem travar
  const redirectUrl = new URL(next, origin);
  redirectUrl.searchParams.set('login', 'success');
  return NextResponse.redirect(redirectUrl.toString());
}
