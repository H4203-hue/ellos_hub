import crypto from 'crypto';
import { NextResponse } from 'next/server';

import { AuthError, requireWorkspaceRole } from '@/lib/auth/requireWorkspaceRole';
import { assertTrustedOrigin, getTrustedAppBaseUrl, UntrustedOriginError } from '@/lib/security/app-url';
import { sanitizeShortText } from '@/lib/security/input-validation';
import { hashInviteToken } from '@/lib/security/invite-token';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { WorkspaceRole } from '@/types/workspace';

const INVITE_LIFETIME_MS = 48 * 60 * 60 * 1000;
const INVITABLE_ROLES: WorkspaceRole[] = ['ADMIN', 'MEMBER'];

function errorResponse(err: unknown, fallback: string) {
  if (err instanceof UntrustedOriginError) {
    return NextResponse.json({ error: 'Origem da requisição não autorizada.' }, { status: 403 });
  }

  if (err instanceof AuthError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }

  console.error(fallback, err instanceof Error ? err.message : 'unknown_error');
  return NextResponse.json({ error: fallback }, { status: 500 });
}

export async function GET(req: Request) {
  try {
    const { workspaceId } = await requireWorkspaceRole(req, ['OWNER', 'ADMIN']);
    const supabaseAdmin = createSupabaseAdminClient();
    const { data: invites, error } = await supabaseAdmin
      .from('invite_tokens')
      .select('id, created_by, role, expires_at, is_used, used_by_email, created_at')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`invite_list_failed:${error.code || 'database_error'}`);
    }

    return NextResponse.json({
      invites: (invites || []).map((row) => ({
        id: row.id,
        createdBy: row.created_by,
        role: row.role,
        expiresAt: row.expires_at,
        isUsed: Boolean(row.is_used),
        usedByEmail: row.used_by_email,
        createdAt: row.created_at,
      })),
    });
  } catch (err: unknown) {
    return errorResponse(err, 'Não foi possível listar os convites.');
  }
}

export async function POST(req: Request) {
  try {
    assertTrustedOrigin(req);
    const { user, workspaceId, role: callerRole } = await requireWorkspaceRole(req, ['OWNER', 'ADMIN']);
    const body = await req.json().catch(() => ({}));
    const requestedRole = body.role as WorkspaceRole;
    const inviteRole = INVITABLE_ROLES.includes(requestedRole) ? requestedRole : 'MEMBER';

    if (inviteRole === 'ADMIN' && callerRole !== 'OWNER') {
      return NextResponse.json(
        { error: 'Somente o proprietário pode convidar outro administrador.' },
        { status: 403 }
      );
    }

    const token = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + INVITE_LIFETIME_MS).toISOString();
    const createdBy = sanitizeShortText(body.createdBy, 120) || user.id;
    const supabaseAdmin = createSupabaseAdminClient();

    const [{ data: workspace, error: workspaceError }, { data, error }] = await Promise.all([
      supabaseAdmin.from('workspaces').select('slug').eq('id', workspaceId).single(),
      supabaseAdmin
        .from('invite_tokens')
        .insert({
          workspace_id: workspaceId,
          token: hashInviteToken(token),
          created_by: createdBy,
          role: inviteRole,
          is_used: false,
          expires_at: expiresAt,
        })
        .select('id, created_by, role, expires_at, is_used, created_at')
        .single(),
    ]);

    if (workspaceError || !workspace?.slug) {
      if (data?.id) {
        await supabaseAdmin.from('invite_tokens').delete().eq('id', data.id).eq('workspace_id', workspaceId);
      }
      throw new Error(`workspace_lookup_failed:${workspaceError?.code || 'not_found'}`);
    }

    if (error || !data) {
      throw new Error(`invite_create_failed:${error?.code || 'database_error'}`);
    }

    let baseUrl: string;
    try {
      baseUrl = getTrustedAppBaseUrl(req);
    } catch (error) {
      await supabaseAdmin.from('invite_tokens').delete().eq('id', data.id).eq('workspace_id', workspaceId);
      throw error;
    }

    const inviteUrl = `${baseUrl}/${encodeURIComponent(workspace.slug)}/entrar-no-grupo?token=${token}`;

    return NextResponse.json({
      success: true,
      inviteUrl,
      invite: {
        id: data.id,
        createdBy: data.created_by,
        role: data.role,
        expiresAt: data.expires_at,
        isUsed: Boolean(data.is_used),
        createdAt: data.created_at,
      },
    });
  } catch (err: unknown) {
    return errorResponse(err, 'Não foi possível gerar o convite.');
  }
}

export async function DELETE(req: Request) {
  try {
    assertTrustedOrigin(req);
    const { workspaceId } = await requireWorkspaceRole(req, ['OWNER', 'ADMIN']);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'O ID do convite é obrigatório.' }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdminClient();
    const { data, error } = await supabaseAdmin
      .from('invite_tokens')
      .delete()
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .select('id');

    if (error) {
      throw new Error(`invite_delete_failed:${error.code || 'database_error'}`);
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Convite não encontrado neste workspace.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Convite revogado com sucesso.' });
  } catch (err: unknown) {
    return errorResponse(err, 'Não foi possível revogar o convite.');
  }
}
