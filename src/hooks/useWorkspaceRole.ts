'use client';

import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mapWorkspaceRoleToLegacy } from '@/lib/rbac';
import type { UserRole } from '@/types';
import type { WorkspaceRole } from '@/types/workspace';

interface UseWorkspaceRoleResult {
  /** Papel já traduzido pro enum legado (MEMBER/MEDIA/ADM/DEV) que a UI espera. */
  role: UserRole | null;
  /** Papel bruto do novo modelo (OWNER/ADMIN/MEMBER), caso algum componente precise dele diretamente. */
  workspaceRole: WorkspaceRole | null;
  isLoading: boolean;
}

/**
 * Resolve o papel do usuário logado dentro de um workspace específico,
 * lendo `workspace_members` (fonte de verdade do RBAC multitenant) e
 * traduzindo pro enum legado via mapWorkspaceRoleToLegacy — nenhum
 * componente de UI existente precisa mudar sua lógica de comparação.
 *
 * `role` fica `null` enquanto carrega ou se o usuário não é membro ativo
 * do workspace — o caller decide o fallback (ex.: 'MEMBER').
 */
export function useWorkspaceRole(workspaceId: string | undefined, userId: string | undefined): UseWorkspaceRoleResult {
  const [role, setRole] = useState<UserRole | null>(null);
  const [workspaceRole, setWorkspaceRole] = useState<WorkspaceRole | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!workspaceId || !userId || !supabase || !isSupabaseConfigured) {
        setRole(null);
        setWorkspaceRole(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const { data, error } = await supabase
        .from('workspace_members')
        .select('role, is_media_team')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (cancelled) return;

      if (error || !data) {
        setRole(null);
        setWorkspaceRole(null);
        setIsLoading(false);
        return;
      }

      const wsRole = data.role as WorkspaceRole;
      setWorkspaceRole(wsRole);
      setRole(mapWorkspaceRoleToLegacy(wsRole, Boolean(data.is_media_team)));
      setIsLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [workspaceId, userId]);

  return { role, workspaceRole, isLoading };
}
