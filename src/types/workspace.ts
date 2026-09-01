import type { UserRole } from '@/types';

/** Papel no novo modelo multitenant, guardado em `workspace_members.role`. */
export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  voice: string;
  is_media_team: boolean;
  is_active: boolean;
  created_at?: string;
}

/** Registro combinado usado pelo hub `/workspaces` (join workspace_members × workspaces). */
export interface WorkspaceMembership {
  role: WorkspaceRole;
  is_active: boolean;
  workspace: {
    id: string;
    slug: string;
    name: string;
    primary_color: string;
    logo_url: string | null;
  };
}

export type { UserRole };
