import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireWorkspaceRole, AuthError } from '@/lib/auth/requireWorkspaceRole';
import { mapLegacyRoleToWorkspace } from '@/lib/rbac';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

const getAdminClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    // Falhar alto e cedo: um fallback silencioso pra anon key aqui já
    // causou incidente (rotas "funcionando" sem privilégio real, ou
    // falhando de forma confusa depois que RLS for ligada).
    throw new Error('SUPABASE_SERVICE_ROLE_KEY não está configurada no ambiente do servidor.');
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// GET: Listar os integrantes (workspace_members + profiles) do workspace informado
export async function GET(req: Request) {
  try {
    const { workspaceId } = await requireWorkspaceRole(req, ['OWNER', 'ADMIN']);
    const supabaseAdmin = getAdminClient();
    const { data: members, error } = await supabaseAdmin
      .from('workspace_members')
      .select('role, is_media_team, voice, is_active, profiles(*)')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ users: members || [] });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const errorMessage = err instanceof Error ? err.message : 'Erro interno do servidor';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// POST: Criar novo usuário no Auth + public.profiles + workspace_members
export async function POST(req: Request) {
  try {
    const { workspaceId } = await requireWorkspaceRole(req, ['OWNER', 'ADMIN']);
    const body = await req.json();
    const { email, name, voice, role, password, phone } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando: e-mail e nome.' },
        { status: 400 }
      );
    }

    const emailClean = String(email).trim().toLowerCase();
    const userPassword = password || 'Ellos@2026';
    const supabaseAdmin = getAdminClient();

    // 1. Criar no Supabase Auth Admin
    const { data: authData, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
      email: emailClean,
      password: userPassword,
      email_confirm: true,
      user_metadata: { name, voice, role, phone },
    });

    // Nunca cair para um id sintético (`prof-...`): isso cria um perfil que nunca
    // vai bater com nenhum session.user.id real e reproduz o bug do badge/"Perfil não encontrado".
    if (authCreateError || !authData?.user?.id) {
      return NextResponse.json(
        {
          error:
            authCreateError?.message ||
            'Falha ao criar o usuário no Supabase Auth. Verifique se o e-mail já existe ou se SUPABASE_SERVICE_ROLE_KEY está configurada corretamente.',
        },
        { status: 400 }
      );
    }

    const newUserId = authData.user.id;

    // 2. Inserir em public.profiles (identidade global)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: newUserId,
        email: emailClean,
        name: String(name).trim(),
        voice: voice || 'Soprano',
        role: role || 'MEMBER',
        phone: phone || null,
        is_active: true,
      })
      .select()
      .single();

    // 3. Vincular ao workspace via workspace_members (fonte de verdade do RBAC)
    const { role: wsRole, is_media_team } = mapLegacyRoleToWorkspace(role || 'MEMBER');
    const { error: memberError } = await supabaseAdmin
      .from('workspace_members')
      .upsert(
        {
          workspace_id: workspaceId,
          user_id: newUserId,
          role: wsRole,
          is_media_team,
          voice: voice || 'Soprano',
          is_active: true,
        },
        { onConflict: 'workspace_id,user_id' }
      );

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      user: profile || { id: newUserId, email: emailClean, name, voice, role, phone, isActive: true },
      tempPassword: userPassword,
    });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const errorMessage = err instanceof Error ? err.message : 'Erro interno ao criar usuário';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// PUT: Editar dados do integrante (Perfil, Papel no Workspace & Supabase Auth)
export async function PUT(req: Request) {
  try {
    const { workspaceId } = await requireWorkspaceRole(req, ['OWNER', 'ADMIN']);
    const body = await req.json();
    const { id, email, name, voice, role, phone, isActive, password } = body;

    if (!id && !email) {
      return NextResponse.json(
        { error: 'ID ou e-mail do integrante é obrigatório para edição.' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getAdminClient();

    let targetId = id;
    const emailClean = email ? String(email).trim().toLowerCase() : undefined;

    if (!targetId && emailClean) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', emailClean)
        .single();
      if (profile) targetId = profile.id;
    }

    if (!targetId) {
      return NextResponse.json({ error: 'Integrante não encontrado.' }, { status: 404 });
    }

    // 1. Atualizar em public.profiles (identidade global)
    const updatePayload: Record<string, unknown> = {};
    if (name !== undefined) updatePayload.name = String(name).trim();
    if (emailClean !== undefined) updatePayload.email = emailClean;
    if (voice !== undefined) updatePayload.voice = voice;
    if (phone !== undefined) updatePayload.phone = phone;
    if (isActive !== undefined) updatePayload.is_active = Boolean(isActive);

    await supabaseAdmin.from('profiles').update(updatePayload).eq('id', targetId);

    // 2. Atualizar papel/naipe em workspace_members (só afeta este workspace)
    if (role !== undefined || voice !== undefined || isActive !== undefined) {
      const memberUpdate: Record<string, unknown> = {};
      if (role !== undefined) {
        const { role: wsRole, is_media_team } = mapLegacyRoleToWorkspace(role);
        memberUpdate.role = wsRole;
        memberUpdate.is_media_team = is_media_team;
      }
      if (voice !== undefined) memberUpdate.voice = voice;
      if (isActive !== undefined) memberUpdate.is_active = Boolean(isActive);

      const { error: memberError } = await supabaseAdmin
        .from('workspace_members')
        .update(memberUpdate)
        .eq('workspace_id', workspaceId)
        .eq('user_id', targetId);

      if (memberError) {
        return NextResponse.json({ error: memberError.message }, { status: 400 });
      }
    }

    // 3. Atualizar Metadata e Senha no Supabase Auth se fornecida
    const authUpdatePayload: Record<string, unknown> = {
      email: emailClean,
      user_metadata: { name, voice, role, phone },
    };
    if (password && String(password).trim()) {
      authUpdatePayload.password = String(password).trim();
    }

    await supabaseAdmin.auth.admin.updateUserById(targetId, authUpdatePayload)
      .catch((e) => console.warn('Auth update metadata warning:', e));

    return NextResponse.json({
      success: true,
      message: '✨ Dados do integrante atualizados com sucesso!',
      updated: { id: targetId, email: emailClean, name, voice, role, phone, isActive },
    });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar dados do integrante';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE: Remover o integrante DESTE workspace (não apaga a conta global —
// a mesma pessoa pode pertencer a outros workspaces; apagar auth.users/
// profiles aqui destruiria o acesso dela em todos eles).
export async function DELETE(req: Request) {
  try {
    const { workspaceId } = await requireWorkspaceRole(req, ['OWNER', 'ADMIN']);
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id');
    const email = searchParams.get('email');

    if (!userId && !email) {
      return NextResponse.json(
        { error: 'Especifique o ID ou e-mail do usuário para exclusão.' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getAdminClient();

    let targetId = userId;
    if (!targetId && email) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', String(email).trim().toLowerCase())
        .single();
      targetId = profile?.id || null;
    }

    if (!targetId) {
      return NextResponse.json({ error: 'Integrante não encontrado.' }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin
      .from('workspace_members')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('user_id', targetId)
      .select();

    if (error || !data || data.length === 0) {
      return NextResponse.json(
        { error: error?.message || 'Não foi possível remover o integrante deste workspace.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: 'Integrante removido deste workspace com sucesso.' });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const errorMessage = err instanceof Error ? err.message : 'Erro interno ao remover integrante';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
