import type { User } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { WorkspaceRole } from '@/types/workspace';

export class AuthError extends Error {
  status: 401 | 403;
  constructor(status: 401 | 403, message: string) {
    super(message);
    this.status = status;
  }
}

interface RequireWorkspaceRoleResult {
  user: User;
  workspaceId: string;
  role: WorkspaceRole;
}

/**
 * Blindagem padrão para as rotas /api/admin/*: exige uma sessão válida
 * (via cookie, checada pelo cliente server-side do Supabase) e confirma que
 * o usuário tem um dos papéis permitidos no workspace informado. Lança
 * AuthError (401/403) em vez de retornar `null` para forçar o caller a
 * tratar o erro explicitamente — não é opcional.
 *
 * Contrato: toda rota /api/admin/* passa a exigir `workspace_id` no corpo
 * (POST/PUT) ou na querystring (GET/DELETE) de toda chamada.
 */
export async function requireWorkspaceRole(
  req: Request,
  allowedRoles: WorkspaceRole[]
): Promise<RequireWorkspaceRoleResult> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new AuthError(401, 'Sessão inválida ou expirada. Faça login novamente.');
  }

  const workspaceId = await resolveWorkspaceId(req);
  if (!workspaceId) {
    throw new AuthError(403, 'workspace_id é obrigatório nesta requisição.');
  }

  const { data: membership, error: membershipError } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (membershipError || !membership) {
    throw new AuthError(403, 'Você não é membro ativo deste workspace.');
  }

  const role = membership.role as WorkspaceRole;
  if (!allowedRoles.includes(role)) {
    throw new AuthError(403, 'Seu papel neste workspace não tem permissão para esta ação.');
  }

  return { user, workspaceId, role };
}

/**
 * Extrai `workspace_id` do body (POST/PUT/DELETE com corpo) ou da
 * querystring (GET/DELETE). Faz uma cópia do request via `.clone()` porque
 * o body de um `Request` só pode ser lido uma vez, e o handler que chama
 * este helper ainda precisa ler o body original depois.
 */
async function resolveWorkspaceId(req: Request): Promise<string | null> {
  const { searchParams } = new URL(req.url);
  const fromQuery = searchParams.get('workspace_id');
  if (fromQuery) return fromQuery;

  try {
    const cloned = req.clone();
    const body = await cloned.json();
    if (body && typeof body.workspace_id === 'string') {
      return body.workspace_id;
    }
  } catch {
    // corpo vazio ou não-JSON (ex.: GET/DELETE sem body) — segue sem workspace_id da query
  }

  return null;
}
