import type { UserRole } from '@/types';
import type { WorkspaceRole } from '@/types/workspace';

/**
 * Traduz o papel do novo modelo multitenant (`workspace_members.role`,
 * OWNER/ADMIN/MEMBER) para o enum legado que toda a UI já espera
 * (`UserRole`, MEMBER/MEDIA/ADM/DEV). Mantém os componentes existentes
 * intactos enquanto a fonte de verdade migra para `workspace_members`.
 */
export function mapWorkspaceRoleToLegacy(role: WorkspaceRole, isMediaTeam: boolean): UserRole {
  if (role === 'OWNER') return 'DEV';
  if (role === 'ADMIN') return 'ADM';
  return isMediaTeam ? 'MEDIA' : 'MEMBER';
}

/**
 * Caminho inverso, usado ao salvar edições no AdminPanelModal: recebe o
 * papel legado escolhido na UI e devolve o par (role, is_media_team) para
 * gravar em `workspace_members`.
 */
export function mapLegacyRoleToWorkspace(role: UserRole): { role: WorkspaceRole; is_media_team: boolean } {
  switch (role) {
    case 'DEV':
      return { role: 'OWNER', is_media_team: false };
    case 'ADM':
      return { role: 'ADMIN', is_media_team: false };
    case 'MEDIA':
      return { role: 'MEMBER', is_media_team: true };
    case 'MEMBER':
    default:
      return { role: 'MEMBER', is_media_team: false };
  }
}
