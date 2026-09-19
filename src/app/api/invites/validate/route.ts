import { NextResponse } from 'next/server';

import {
  isValidEmail,
  isValidInviteToken,
  normalizeEmail,
  sanitizeShortText,
  validatePassword,
} from '@/lib/security/input-validation';
import { assertTrustedOrigin } from '@/lib/security/app-url';
import { hashInviteToken } from '@/lib/security/invite-token';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { WorkspaceRole } from '@/types/workspace';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ALLOWED_VOICES = new Set(['Soprano', 'Contralto', 'Tenor', 'Baixo', 'Geral']);
const ALLOWED_INVITE_ROLES = new Set<WorkspaceRole>(['ADMIN', 'MEMBER']);

function isValidSlug(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 63 && SLUG_PATTERN.test(value);
}

async function releaseInvite(
  supabaseAdmin: ReturnType<typeof createSupabaseAdminClient>,
  inviteId: string,
  email: string
) {
  const { error } = await supabaseAdmin
    .from('invite_tokens')
    .update({ is_used: false, used_by_email: null })
    .eq('id', inviteId)
    .eq('used_by_email', email);

  if (error) {
    console.error('invite_release_failed', error.code || 'database_error');
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const workspaceSlug = searchParams.get('workspace_slug');

    if (!isValidInviteToken(token) || !isValidSlug(workspaceSlug)) {
      return NextResponse.json({ valid: false, reason: 'not_found' });
    }

    const supabaseAdmin = createSupabaseAdminClient();
    const { data: workspace, error: workspaceError } = await supabaseAdmin
      .from('workspaces')
      .select('id')
      .eq('slug', workspaceSlug)
      .maybeSingle();

    if (workspaceError || !workspace) {
      return NextResponse.json({ valid: false, reason: 'not_found' });
    }

    const { data: invite, error } = await supabaseAdmin
      .from('invite_tokens')
      .select('role, expires_at, is_used')
      .eq('workspace_id', workspace.id)
      .eq('token', hashInviteToken(token))
      .maybeSingle();

    if (error || !invite) {
      return NextResponse.json({ valid: false, reason: 'not_found' });
    }

    if (invite.is_used) {
      return NextResponse.json({ valid: false, reason: 'already_used' });
    }

    if (!invite.expires_at || new Date(invite.expires_at).getTime() <= Date.now()) {
      return NextResponse.json({ valid: false, reason: 'expired' });
    }

    return NextResponse.json({
      valid: true,
      role: ALLOWED_INVITE_ROLES.has(invite.role as WorkspaceRole) ? invite.role : 'MEMBER',
      expiresAt: invite.expires_at,
    });
  } catch (err: unknown) {
    console.error('invite_validation_failed', err instanceof Error ? err.name : 'unknown_error');
    return NextResponse.json({ valid: false, reason: 'not_found' });
  }
}

export async function POST(req: Request) {
  try {
    assertTrustedOrigin(req);
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Requisição inválida.' }, { status: 400 });
    }

    const token = body.token;
    const workspaceSlug = body.workspace_slug;
    const name = sanitizeShortText(body.name, 120);
    const email = normalizeEmail(body.email);
    const phone = sanitizeShortText(body.phone, 30);
    const voice = ALLOWED_VOICES.has(body.voice) ? body.voice : 'Geral';
    const passwordError = validatePassword(body.password);

    if (!isValidInviteToken(token) || !isValidSlug(workspaceSlug)) {
      return NextResponse.json({ error: 'Convite inválido ou expirado.' }, { status: 400 });
    }

    if (name.length < 2 || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Informe um nome e um e-mail válidos.' }, { status: 400 });
    }

    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdminClient();
    const { data: workspace, error: workspaceError } = await supabaseAdmin
      .from('workspaces')
      .select('id')
      .eq('slug', workspaceSlug)
      .maybeSingle();

    if (workspaceError || !workspace) {
      return NextResponse.json({ error: 'Convite inválido ou expirado.' }, { status: 400 });
    }

    const { data: tokenRecord, error: tokenError } = await supabaseAdmin
      .from('invite_tokens')
      .select('id, workspace_id, role, expires_at, is_used')
      .eq('workspace_id', workspace.id)
      .eq('token', hashInviteToken(token))
      .maybeSingle();

    if (tokenError || !tokenRecord || tokenRecord.is_used) {
      return NextResponse.json({ error: 'Convite inválido ou já utilizado.' }, { status: 400 });
    }

    if (!tokenRecord.expires_at || new Date(tokenRecord.expires_at).getTime() <= Date.now()) {
      return NextResponse.json({ error: 'Este convite expirou.' }, { status: 400 });
    }

    // Reserva o convite antes de criar a conta. O filtro is_used=false evita
    // que duas requisições concorrentes usem o mesmo token.
    const { data: reservation, error: reservationError } = await supabaseAdmin
      .from('invite_tokens')
      .update({ is_used: true, used_by_email: email })
      .eq('id', tokenRecord.id)
      .eq('workspace_id', workspace.id)
      .eq('is_used', false)
      .select('id')
      .maybeSingle();

    if (reservationError || !reservation) {
      return NextResponse.json({ error: 'Este convite já foi utilizado.' }, { status: 409 });
    }

    const role = ALLOWED_INVITE_ROLES.has(tokenRecord.role as WorkspaceRole)
      ? (tokenRecord.role as WorkspaceRole)
      : 'MEMBER';
    const legacyRole = role === 'ADMIN' ? 'ADM' : 'MEMBER';

    const { data: authData, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: body.password,
      email_confirm: true,
      user_metadata: { name, phone },
    });

    if (authCreateError || !authData.user?.id) {
      await releaseInvite(supabaseAdmin, tokenRecord.id, email);
      const message = authCreateError?.message === 'User already registered'
        ? 'Este e-mail já possui uma conta. Faça login ou solicite um novo convite para a conta existente.'
        : 'Não foi possível criar a conta.';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const userId = authData.user.id;
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      id: userId,
      email,
      name,
      voice,
      role: legacyRole,
      phone: phone || null,
      is_active: true,
    });

    const { error: membershipError } = profileError
      ? { error: profileError }
      : await supabaseAdmin.from('workspace_members').upsert(
          {
            workspace_id: workspace.id,
            user_id: userId,
            role,
            is_media_team: false,
            voice,
            is_active: true,
          },
          { onConflict: 'workspace_id,user_id' }
        );

    if (profileError || membershipError) {
      await supabaseAdmin.from('workspace_members').delete().eq('workspace_id', workspace.id).eq('user_id', userId);
      await supabaseAdmin.from('profiles').delete().eq('id', userId);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      await releaseInvite(supabaseAdmin, tokenRecord.id, email);
      console.error('invite_registration_rollback', profileError?.code || membershipError?.code || 'database_error');
      return NextResponse.json({ error: 'Não foi possível concluir o cadastro.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Cadastro realizado com sucesso.',
      user: { id: userId, name, email, voice, role: legacyRole },
    });
  } catch (err: unknown) {
    console.error('invite_registration_failed', err instanceof Error ? err.name : 'unknown_error');
    return NextResponse.json({ error: 'Não foi possível processar o cadastro.' }, { status: 500 });
  }
}
