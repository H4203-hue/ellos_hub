import { 
  Calendar, 
  Layers, 
  ListTodo, 
  Users, 
  Sparkles, 
  ShieldCheck, 
  LucideIcon 
} from 'lucide-react';

export type UserRole = 'DEV' | 'ADM' | 'MEDIA' | 'MEMBER';

export type NavTabId = 'agenda' | 'repertoire' | 'tasks';

export interface NavigationItem {
  id: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  section: 'MENU PRINCIPAL' | 'ADMINISTRAÇÃO';
  type: 'tab' | 'route' | 'modal';
  tabId?: NavTabId;
  href?: string;
  modalKey?: 'media' | 'admin' | 'dev';
  iconColor?: string;
  allowedRoles?: UserRole[];
}

export const NAVIGATION_LINKS: NavigationItem[] = [
  // MENU PRINCIPAL (Acesso para todos os membros)
  {
    id: 'agenda',
    label: 'Agenda & Convites',
    shortLabel: 'Agenda',
    icon: Calendar,
    section: 'MENU PRINCIPAL',
    type: 'tab',
    tabId: 'agenda',
    iconColor: 'text-[#D4AF37]',
    allowedRoles: ['DEV', 'ADM', 'MEDIA', 'MEMBER'],
  },
  {
    id: 'repertoire',
    label: 'Repertório & Kits',
    shortLabel: 'Repertório',
    icon: Layers,
    section: 'MENU PRINCIPAL',
    type: 'tab',
    tabId: 'repertoire',
    iconColor: 'text-[#D4AF37]',
    allowedRoles: ['DEV', 'ADM', 'MEDIA', 'MEMBER'],
  },
  {
    id: 'tasks',
    label: 'Tarefas & Backlog',
    shortLabel: 'Tarefas',
    icon: ListTodo,
    section: 'MENU PRINCIPAL',
    type: 'tab',
    tabId: 'tasks',
    iconColor: 'text-[#D4AF37]',
    allowedRoles: ['DEV', 'ADM', 'MEDIA', 'MEMBER'],
  },

  // ADMINISTRAÇÃO (Filtrado por nível de acesso)
  {
    id: 'admin-members',
    label: 'Painel ADM (Gestão de Membros)',
    shortLabel: 'Painel ADM',
    icon: Users,
    section: 'ADMINISTRAÇÃO',
    type: 'modal',
    modalKey: 'admin',
    iconColor: 'text-blue-400',
    allowedRoles: ['DEV', 'ADM'],
  },
  {
    id: 'media-central',
    label: 'Central de Mídia',
    shortLabel: 'Mídia',
    icon: Sparkles,
    section: 'ADMINISTRAÇÃO',
    type: 'modal',
    modalKey: 'media',
    iconColor: 'text-purple-400',
    allowedRoles: ['DEV', 'ADM', 'MEDIA'],
  },
  {
    id: 'dev-panel',
    label: 'Painel Dev (Logs & Supabase)',
    shortLabel: 'Painel Dev',
    icon: ShieldCheck,
    section: 'ADMINISTRAÇÃO',
    type: 'modal',
    modalKey: 'dev',
    iconColor: 'text-amber-400',
    allowedRoles: ['DEV'],
  },
];

/**
 * Retorna os links de navegação acessíveis para o papel especificado.
 */
export function getFilteredNavLinks(role?: string | null): NavigationItem[] {
  const effectiveRole = (role as UserRole) || 'MEMBER';
  return NAVIGATION_LINKS.filter((item) => {
    if (!item.allowedRoles) return true;
    return item.allowedRoles.includes(effectiveRole);
  });
}
