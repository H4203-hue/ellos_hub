import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { requireWorkspaceRole, AuthError } from '@/lib/auth/requireWorkspaceRole';
import { mapLegacyRoleToWorkspace } from '@/lib/rbac';
import { assertTrustedOrigin } from '@/lib/security/app-url';
import { isValidEmail, normalizeEmail, sanitizeShortText, validatePassword } from '@/lib/security/input-validation';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// GET: Listar os integrantes (workspace_members + profiles) do workspace informado
export async function GET(req: Request) {
  try {
    const { workspaceId } = await requireWorkspaceRole(req, ['OWNER', 'ADMIN']);
    const supabaseAdmin = createSupabaseAdminClient();
    const { data: members, error } = await supabaseAdmin
      .from('workspace_members')
      .select('role, is_media_team, voice, is_active, profiles(*)')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('admin_users_list_failed', error.code || 'database_error');
      return NextResponse.json({ error: 'Não foi possível listar os integrantes.' }, { status: 500 });
    }

    return NextResponse.json({ users: members || [] });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('admin_users_list_failed', err instanceof Error ? err.name : 'unknown_error');
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

// POST: Criar novo usuário no Auth + public.profiles + workspace_members
export async function POST(req: Request) {
  try {
    assertTrustedOrigin(req);
    const { workspaceId, role: callerRole } = await requireWorkspaceRole(req, ['OWNER', 'ADMIN']);
    const body = await req.json();
    const { email, name, voice, role, password, phone } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando: e-mail e nome.' },
        { status: 400 }
      );
    }

    const workspaceRoleMapping = mapLegacyRoleToWorkspace(role || 'MEMBER');
    if (workspaceRoleMapping.role !== 'MEMBER' && callerRole !== 'OWNER') {
      return NextResponse.json(
        { error: 'Somente o proprietário pode criar administradores ou proprietários.' },
        { status: 403 }
      );
    }

    const emailClean = normalizeEmail(email);
    const nameClean = sanitizeShortText(name, 120);
    if (!isValidEmail(emailClean) || nameClean.length < 2) {
      return NextResponse.json({ error: 'Informe um nome e um e-mail válidos.' }, { status: 400 });
    }

    const userPassword = password || `${crypto.randomBytes(18).toString('base64url')}Aa1!`;
    const passwordError = validatePassword(userPassword);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdminClient();

    // 1. Criar no Supabase Auth Admin
    const { data: authData, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
      email: emailClean,
      password: userPassword,
      email_confirm: true,
      user_metadata: { name: nameClean, phone: phone || null },
    });

    // Nunca cair para um id sintético (`prof-...`): isso cria um perfil que nunca
    // vai bater com nenhum session.user.id real e reproduz o bug do badge/"Perfil não encontrado".
    if (authCreateError || !authData?.user?.id) {
      return NextResponse.json(
        {
          error:
            authCreateError?.message === 'User already registered'
              ? 'Este e-mail já possui uma conta.'
              : 'Não foi possível criar a conta de autenticação.',
        },
        { status: 400 }
      );
    }

    const newUserId = authData.user.id;

    // 2. Inserir em public.profiles (identidade global)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: newUserId,
        email: emailClean,
        name: nameClean,
        voice: voice || 'Soprano',
        role: role || 'MEMBER',
        phone: phone || null,
        is_active: true,
      })
      .select()
      .single();

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return NextResponse.json({ error: 'Não foi possível criar o perfil do usuário.' }, { status: 500 });
    }

    // 3. Vincular ao workspace via workspace_members (fonte de verdade do RBAC)
    const { role: wsRole, is_media_team } = workspaceRoleMapping;
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
      await supabaseAdmin.from('profiles').delete().eq('id', newUserId);
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return NextResponse.json({ error: 'Não foi possível vincular o usuário ao workspace.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      user: profile || { id: newUserId, email: emailClean, name: nameClean, voice, role, phone, isActive: true },
      tempPassword: userPassword,
    });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('admin_user_create_failed', err instanceof Error ? err.name : 'unknown_error');
    return NextResponse.json({ error: 'Erro interno ao criar usuário.' }, { status: 500 });
  }
}

// PUT: Editar dados do integrante (Perfil, Papel no Workspace & Supabase Auth)
export async function PUT(req: Request) {
  try {
    assertTrustedOrigin(req);
    const { workspaceId, role: callerRole } = await requireWorkspaceRole(req, ['OWNER', 'ADMIN']);
    const body = await req.json();
    const { id, email, name, voice, role, phone, isActive, password } = body;

    if (password !== undefined) {
      return NextResponse.json(
        { error: 'Use o fluxo de recuperação por e-mail para alterar senhas.' },
        { status: 400 }
      );
    }

    if (!id && !email) {
      return NextResponse.json(
        { error: 'ID ou e-mail do integrante é obrigatório para edição.' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createSupabaseAdminClient();

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

    const { data: targetMembership } = await supabaseAdmin
      .from('workspace_members')
      .select('user_id, role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', targetId)
      .maybeSingle();

    if (!targetMembership) {
      return NextResponse.json({ error: 'Integrante não encontrado neste workspace.' }, { status: 404 });
    }

    if (targetMembership.role === 'OWNER' && callerRole !== 'OWNER') {
      return NextResponse.json({ error: 'Somente um proprietário pode editar outro proprietário.' }, { status: 403 });
    }

    if (role !== undefined) {
      const requestedWorkspaceRole = mapLegacyRoleToWorkspace(role).role;
      if (requestedWorkspaceRole !== 'MEMBER' && callerRole !== 'OWNER') {
        return NextResponse.json(
          { error: 'Somente o proprietário pode conceder papel administrativo.' },
          { status: 403 }
        );
      }
    }

    const requestedWorkspaceRole = role !== undefined
      ? mapLegacyRoleToWorkspace(role).role
      : targetMembership.role;
    const wouldRemoveActiveOwner = targetMembership.role === 'OWNER'
      && (requestedWorkspaceRole !== 'OWNER' || isActive === false);

    if (wouldRemoveActiveOwner) {
      const { count: ownerCount } = await supabaseAdmin
        .from('workspace_members')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('role', 'OWNER')
        .eq('is_active', true);

      if ((ownerCount || 0) <= 1) {
        return NextResponse.json(
          { error: 'O último proprietário ativo não pode ser removido ou rebaixado.' },
          { status: 400 }
        );
      }
    }


    // 1. Atualizar em public.profiles (identidade global)
    const updatePayload: Record<string, unknown> = {};
    if (name !== undefined) updatePayload.name = String(name).trim();
    if (emailClean !== undefined) updatePayload.email = emailClean;
    if (voice !== undefined) updatePayload.voice = voice;
    if (phone !== undefined) updatePayload.phone = phone;
    if (isActive !== undefined) updatePayload.is_active = Boolean(isActive);

    if (Object.keys(updatePayload).length > 0) {
      const { error: profileUpdateError } = await supabaseAdmin.from('profiles').update(updatePayload).eq('id', targetId);
      if (profileUpdateError) {
        return NextResponse.json({ error: 'Não foi possível atualizar o perfil.' }, { status: 400 });
      }
    }

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
    const authUpdatePayload: Record<string, unknown> = {};
    if (emailClean !== undefined) authUpdatePayload.email = emailClean;
    const metadata: Record<string, unknown> = {};
    if (name !== undefined) metadata.name = String(name).trim();
    if (phone !== undefined) metadata.phone = phone;
    if (Object.keys(metadata).length > 0) authUpdatePayload.user_metadata = metadata;

    if (Object.keys(authUpdatePayload).length > 0) {
      const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(targetId, authUpdatePayload);
      if (authUpdateError) {
        return NextResponse.json({ error: 'Não foi possível atualizar a conta de autenticação.' }, { status: 400 });
      }
    }

    return NextResponse.json({
      success: true,
      message: '✨ Dados do integrante atualizados com sucesso!',
      updated: { id: targetId, email: emailClean, name, voice, role, phone, isActive },
    });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('admin_user_update_failed', err instanceof Error ? err.name : 'unknown_error');
    return NextResponse.json({ error: 'Erro ao atualizar dados do integrante.' }, { status: 500 });
  }
}

// DELETE: Remover o integrante DESTE workspace (não apaga a conta global —
// a mesma pessoa pode pertencer a outros workspaces; apagar auth.users/
// profiles aqui destruiria o acesso dela em todos eles).
export async function DELETE(req: Request) {
  try {
    assertTrustedOrigin(req);
    const { user, workspaceId, role: callerRole } = await requireWorkspaceRole(req, ['OWNER', 'ADMIN']);
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id');
    const email = searchParams.get('email');

    if (!userId && !email) {
      return NextResponse.json(
        { error: 'Especifique o ID ou e-mail do usuário para exclusão.' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createSupabaseAdminClient();

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

    if (targetId === user.id) {
      return NextResponse.json({ error: 'Você não pode remover a própria associação.' }, { status: 400 });
    }

    const { data: targetMembership } = await supabaseAdmin
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', targetId)
      .maybeSingle();

    if (targetMembership?.role === 'OWNER') {
      if (callerRole !== 'OWNER') {
        return NextResponse.json({ error: 'Somente um proprietário pode remover outro proprietário.' }, { status: 403 });
      }

      const { count: ownerCount } = await supabaseAdmin
        .from('workspace_members')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('role', 'OWNER')
        .eq('is_active', true);

      if ((ownerCount || 0) <= 1) {
        return NextResponse.json({ error: 'O último proprietário do workspace não pode ser removido.' }, { status: 400 });
      }
    }

    const { data, error } = await supabaseAdmin
      .from('workspace_members')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('user_id', targetId)
      .select();

    if (error || !data || data.length === 0) {
      return NextResponse.json(
        { error: 'Não foi possível remover o integrante deste workspace.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: 'Integrante removido deste workspace com sucesso.' });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('admin_user_delete_failed', err instanceof Error ? err.name : 'unknown_error');
    return NextResponse.json({ error: 'Erro interno ao remover integrante.' }, { status: 500 });
  }
}
