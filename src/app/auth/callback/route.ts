import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    try {
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      // 🔄 Troca do Código OAuth por Sessão Ativa
      const { data: authData, error } = await supabaseAdmin.auth.exchangeCodeForSession(code);

      if (!error && authData?.user) {
        const user = authData.user;
        const userEmail = user.email || '';
        const userName = user.user_metadata?.full_name || user.user_metadata?.name || userEmail || 'Integrante';

        // 🔍 Sincronização Automática: Inserir em public.profiles se o integrante não existir
        const { data: existingProfile } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!existingProfile) {
          await supabaseAdmin.from('profiles').upsert({
            id: user.id,
            email: userEmail,
            name: userName,
            voice: 'Geral',
            role: 'MEMBER',
            is_active: true,
          });
        }

        // Redirecionar para / com parâmetro de sucesso para feedback visual
        const redirectUrl = new URL(next, origin);
        redirectUrl.searchParams.set('login', 'success');
        return NextResponse.redirect(redirectUrl.toString());
      }
    } catch (err) {
      console.error('Erro no callback do Google OAuth:', err);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=google_auth_failed`);
}
