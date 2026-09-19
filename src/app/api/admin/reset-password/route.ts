import { NextResponse } from 'next/server';

import { AuthError, requireWorkspaceRole } from '@/lib/auth/requireWorkspaceRole';
import { assertTrustedOrigin, getTrustedAppBaseUrl, UntrustedOriginError } from '@/lib/security/app-url';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    assertTrustedOrigin(req);
    const { workspaceId } = await requireWorkspaceRole(req, ['OWNER', 'ADMIN']);
    const body = await req.json().catch(() => ({}));
    const userId = typeof body.userId === 'string' ? body.userId : '';

    if (!userId) {
      return NextResponse.json({ error: 'O ID do integrante é obrigatório.' }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdminClient();
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('workspace_members')
      .select('user_id, profiles(email)')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .maybeSingle();

    if (membershipError) {
      throw new Error(`membership_lookup_failed:${membershipError.code || 'database_error'}`);
    }

    const profile = Array.isArray(membership?.profiles) ? membership.profiles[0] : membership?.profiles;
    const email = profile?.email;
    if (!membership || !email) {
      return NextResponse.json({ error: 'Integrante não encontrado neste workspace.' }, { status: 404 });
    }

    const baseUrl = getTrustedAppBaseUrl(req);

    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${baseUrl}/atualizar-senha`,
    });

    if (error) {
      throw new Error(`password_recovery_failed:${error.status || 'provider_error'}`);
    }

    return NextResponse.json({
      success: true,
      message: 'As instruções de recuperação foram enviadas para o e-mail do integrante.',
    });
  } catch (err: unknown) {
    if (err instanceof UntrustedOriginError) {
      return NextResponse.json({ error: 'Origem da requisição não autorizada.' }, { status: 403 });
    }

    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }

    console.error('admin_password_recovery_failed', err instanceof Error ? err.message : 'unknown_error');
    return NextResponse.json(
      { error: 'Não foi possível iniciar a recuperação de senha.' },
      { status: 500 }
    );
  }
}
