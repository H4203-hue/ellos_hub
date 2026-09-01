import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireWorkspaceRole, AuthError } from '@/lib/auth/requireWorkspaceRole';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

const getAdminClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY não está configurada no ambiente do servidor.');
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export async function POST(req: Request) {
  try {
    await requireWorkspaceRole(req, ['OWNER', 'ADMIN']);
    const body = await req.json();
    const { userId, email, newPassword } = body;

    if (!userId && !email) {
      return NextResponse.json(
        { error: 'Informe o ID ou e-mail do integrante para resetar a senha.' },
        { status: 400 }
      );
    }

    const tempPassword = newPassword || `Ellos#${Math.floor(1000 + Math.random() * 9000)}`;
    const supabaseAdmin = getAdminClient();

    let targetUserId = userId;

    if (!targetUserId && email) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', String(email).trim().toLowerCase())
        .single();
      if (profile) {
        targetUserId = profile.id;
      }
    }

    if (targetUserId) {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        targetUserId,
        { password: tempPassword }
      );

      if (updateError) {
        console.warn('Aviso ao atualizar senha no Supabase Auth:', updateError.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Senha redefinida com sucesso!',
      tempPassword,
    });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const errorMessage = err instanceof Error ? err.message : 'Erro ao resetar senha';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
