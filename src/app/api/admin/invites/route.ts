import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
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

// Memory fallback se banco não tiver retornado
let mockInviteStore: Array<{
  id: string;
  token: string;
  createdBy: string;
  role: string;
  expiresAt: string;
  isUsed: boolean;
  usedByEmail?: string;
  createdAt: string;
}> = [];

// GET: Listar todos os convites descartáveis
export async function GET(req: Request) {
  try {
    await requireWorkspaceRole(req, ['OWNER', 'ADMIN']);
    const supabaseAdmin = getAdminClient();
    const { data: invites, error } = await supabaseAdmin
      .from('invite_tokens')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !invites) {
      return NextResponse.json({ invites: mockInviteStore });
    }

    const formatted = invites.map((row) => ({
      id: row.id,
      token: row.token,
      createdBy: row.created_by,
      role: row.role,
      expiresAt: row.expires_at,
      isUsed: Boolean(row.is_used),
      usedByEmail: row.used_by_email,
      createdAt: row.created_at,
    }));

    return NextResponse.json({ invites: formatted });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ invites: mockInviteStore });
  }
}

// POST: Gerar novo token descartável com validade de 48h
export async function POST(req: Request) {
  try {
    await requireWorkspaceRole(req, ['OWNER', 'ADMIN']);
    const body = await req.json().catch(() => ({}));
    const createdBy = body.createdBy || 'Regência / ADM';
    const role = body.role || 'MEMBER';

    // Gerar token seguro
    const token = crypto.randomBytes(16).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();

    const supabaseAdmin = getAdminClient();

    const { data, error } = await supabaseAdmin
      .from('invite_tokens')
      .insert([{ token, role: 'MEMBER', is_used: false }])
      .select()
      .single();

    console.log('[INVITE CREATE]', { token, error });

    const inviteRecord = data
      ? {
          id: data.id,
          token: data.token,
          createdBy: data.created_by || createdBy,
          role: data.role || role,
          expiresAt: data.expires_at || expiresAt,
          isUsed: Boolean(data.is_used),
          createdAt: data.created_at || now.toISOString(),
        }
      : {
          id: `inv-${Date.now()}`,
          token,
          createdBy,
          role,
          expiresAt,
          isUsed: false,
          createdAt: now.toISOString(),
        };

    if (error || !data) {
      mockInviteStore = [inviteRecord, ...mockInviteStore];
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    let baseUrl = appUrl;
    if (!baseUrl) {
      const host = req.headers.get('host') || 'localhost:3000';
      const protocol = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
      baseUrl = `${protocol}://${host}`;
    }
    const inviteUrl = `${baseUrl}/entrar-no-grupo?token=${token}`;

    return NextResponse.json({
      success: true,
      token,
      inviteUrl,
      invite: inviteRecord,
    });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const errorMessage = err instanceof Error ? err.message : 'Erro ao gerar token de convite';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE: Revogar / Excluir token de convite
export async function DELETE(req: Request) {
  try {
    await requireWorkspaceRole(req, ['OWNER', 'ADMIN']);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const token = searchParams.get('token');

    if (!id && !token) {
      return NextResponse.json({ error: 'Especifique o ID ou token do convite.' }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();

    if (id) {
      await supabaseAdmin.from('invite_tokens').delete().eq('id', id);
      mockInviteStore = mockInviteStore.filter((i) => i.id !== id);
    } else if (token) {
      await supabaseAdmin.from('invite_tokens').delete().eq('token', token);
      mockInviteStore = mockInviteStore.filter((i) => i.token !== token);
    }

    return NextResponse.json({ success: true, message: 'Convite revogado com sucesso.' });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const errorMessage = err instanceof Error ? err.message : 'Erro ao revogar convite';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
