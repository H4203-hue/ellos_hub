'use client';

import React from 'react';
import Link from 'next/link';
import { GroupMember } from '@/data/groupMembers';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { toast } from 'sonner';
import { 
  X, 
  Link as LinkIcon, 
  LogOut, 
  ExternalLink 
} from 'lucide-react';
import { getFilteredNavLinks, NavigationItem, NavTabId } from '@/config/navigation';
import { useTenant } from '@/context/TenantContext';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentMember: GroupMember | null;
  effectiveRole: string; // Papel ativo/simulado
  /** Papel real (sem simulação) já traduzido de workspace_members — não confundir com effectiveRole. */
  isRealDev: boolean;
  simulatedRole: string; // 'DEV' | 'ADM' | 'MEDIA' | 'MEMBER'
  onSimulatedRoleChange: (role: 'DEV' | 'ADM' | 'MEDIA' | 'MEMBER') => void;
  onOpenAddModal?: () => void;
  onOpenMediaModal: () => void;
  onOpenAdminModal: () => void;
  onOpenDevModal: () => void;
  onLogout: () => void;
  activeTab?: NavTabId;
  onTabChange?: (tab: NavTabId) => void;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
  isOpen,
  onClose,
  currentMember,
  effectiveRole,
  isRealDev,
  simulatedRole,
  onSimulatedRoleChange,
  onOpenMediaModal,
  onOpenAdminModal,
  onOpenDevModal,
  onLogout,
  activeTab,
  onTabChange,
}) => {
  const { workspace, slug } = useTenant();

  if (!isOpen) return null;

  const currentSlug = workspace?.slug || slug || 'ellos';
  const allowedLinks = getFilteredNavLinks(effectiveRole);
  const mainLinks = allowedLinks.filter((item) => item.section === 'MENU PRINCIPAL');
  
  // Filtra itens de administração garantindo a restrição do Painel Dev apenas para DEV
  const adminLinks = allowedLinks.filter((item) => {
    if (item.section !== 'ADMINISTRAÇÃO') return false;
    if (item.id === 'dev-panel' || item.modalKey === 'dev') {
      return effectiveRole === 'DEV';
    }
    return true;
  });

  const handleLinkClick = (item: NavigationItem) => {
    onClose();
    if (item.type === 'tab' && item.tabId && onTabChange) {
      onTabChange(item.tabId);
    } else if (item.type === 'modal') {
      if (item.modalKey === 'media') {
        onOpenMediaModal();
      } else if (item.modalKey === 'admin') {
        onOpenAdminModal();
      } else if (item.modalKey === 'dev') {
        onOpenDevModal();
      }
    }
  };

  const handleCopyBioLink = () => {
    const fullUrl = `${window.location.origin}/${currentSlug}/convite`;
    navigator.clipboard.writeText(fullUrl);
    toast.success('🔗 Link da Bio (/convite) copiado com sucesso!', {
      description: `URL: ${fullUrl}`,
    });
    onClose();
  };

  return (
    <>
      {/* Backdrop Overlay */}
      <div 
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
      />

      {/* Drawer Panel Retrátil */}
      <aside className="fixed inset-y-0 right-0 z-50 w-80 bg-[#0F172A] border-l border-gray-800 shadow-2xl flex flex-col justify-between p-6 animate-in slide-in-from-right duration-300 font-sans text-slate-100 no-scrollbar">
        {/* Top Header */}
        <div className="space-y-6 overflow-y-auto no-scrollbar pr-1">
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            
            {/* Logo e Nome do Workspace Atual */}
            <div className="flex items-center gap-2.5 overflow-hidden">
              {workspace?.logo_url ? (
                <img 
                  src={workspace.logo_url} 
                  alt={`Logo ${workspace.name}`} 
                  className="h-8 w-auto object-contain" 
                />
              ) : (
                <div className="text-xl font-bold text-white tracking-wide truncate">
                  {workspace?.name || 'Workspace'}
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-all cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* MENU PRINCIPAL (Links Dinâmicos com /[slug]/...) */}
          {mainLinks.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block px-1 mb-2">
                MENU PRINCIPAL
              </span>
              <div className="space-y-1">
                {mainLinks.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.type === 'tab' && activeTab === item.tabId;
                  const dynamicHref = `/${currentSlug}/${item.tabId || 'agenda'}`;

                  return (
                    <Link
                      key={item.id}
                      href={dynamicHref}
                      onClick={(e) => {
                        if (onTabChange && item.tabId) {
                          e.preventDefault();
                          handleLinkClick(item);
                        } else {
                          onClose();
                        }
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'text-theme-primary bg-gray-800/50 border border-gray-700/60 shadow-xs'
                          : 'text-gray-300 hover:text-white hover:bg-gray-800/30'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${item.iconColor || 'text-theme-primary'}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* ADMINISTRAÇÃO (Mapeado da Fonte Única com RBAC & Modais) */}
          {adminLinks.length > 0 && (
            <div className="space-y-1.5 pt-3 border-t border-gray-800">
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block px-1 mb-2">
                ADMINISTRAÇÃO
              </span>
              <div className="space-y-1">
                {adminLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleLinkClick(item)}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-gray-300 hover:text-white hover:bg-gray-800/30 transition-all cursor-pointer"
                    >
                      <Icon className={`w-4 h-4 ${item.iconColor || 'text-theme-primary'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* PERFIL */}
          <div className="space-y-1.5 pt-3 border-t border-gray-800">
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block px-1 mb-2">
              PERFIL
            </span>
            {currentMember ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/40 border border-gray-800">
                <div className="w-8 h-8 rounded-full bg-theme-primary text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                  {currentMember.name.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-white truncate">{currentMember.name}</p>
                  <p className="text-[10px] text-gray-400 truncate">{currentMember.voice} • {currentMember.role}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 px-1">Nenhum membro autenticado.</p>
            )}
          </div>

          {/* DEV Vision Simulator (If DEV) */}
          {isRealDev && (
            <div className="bg-gray-800/40 rounded-xl p-3.5 border border-gray-700/60 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-theme-primary block">
                Simulador de Visão DEV
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {(['DEV', 'ADM', 'MEDIA', 'MEMBER'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      onSimulatedRoleChange(r);
                      toast.info(`🎭 Modo alterado para ${r}`);
                    }}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer text-center ${
                      simulatedRole === r
                        ? 'bg-theme-primary text-slate-950 font-extrabold'
                        : 'bg-gray-900 text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Preferências & PWA */}
          <div className="space-y-2 pt-3 border-t border-gray-800">
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block px-1 mb-1">
              PREFERÊNCIAS
            </span>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-800/30 text-xs">
              <span className="font-semibold text-gray-300">Tema:</span>
              <ThemeToggle />
            </div>
            <button
              onClick={handleCopyBioLink}
              className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-gray-800/30 hover:bg-gray-800/60 border border-gray-700/60 text-theme-primary transition-all flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <LinkIcon className="w-3.5 h-3.5" />
                Link da Bio ({`/${currentSlug}/convite`})
              </span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </button>
          </div>
        </div>

        {/* Footer: Logout */}
        <div className="pt-4 border-t border-gray-800">
          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair da Conta</span>
          </button>
        </div>
      </aside>
    </>
  );
};
