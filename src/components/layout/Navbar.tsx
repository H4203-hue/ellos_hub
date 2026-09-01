'use client';

import React from 'react';
import { Menu, Plus, Share2 } from 'lucide-react';
import { GroupMember } from '@/data/groupMembers';
import { getFilteredNavLinks, NavTabId } from '@/config/navigation';
import { useTenant } from '@/context/TenantContext';
import { toast } from 'sonner';

interface NavbarProps {
  activeTab: NavTabId;
  onTabChange: (tab: NavTabId) => void;
  currentMember?: GroupMember | null;
  effectiveRole: string; // 'DEV' | 'ADM' | 'MEDIA' | 'MEMBER'
  onOpenSidebar: () => void;
  onOpenAddModal?: () => void;
  onShare?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  currentMember,
  effectiveRole,
  onOpenSidebar,
  onOpenAddModal,
  onShare,
}) => {
  const { workspace, slug } = useTenant();
  const canCreate = effectiveRole === 'ADM' || effectiveRole === 'DEV';
  const allowedLinks = getFilteredNavLinks(effectiveRole);
  const mainTabLinks = allowedLinks.filter((item) => item.section === 'MENU PRINCIPAL' && item.type === 'tab');

  const handleDefaultShare = () => {
    if (typeof window !== 'undefined') {
      const fullUrl = `${window.location.origin}/${slug || 'ellos'}/convite`;
      navigator.clipboard.writeText(fullUrl);
      toast.success('✨ Link público de convite copiado!', {
        description: `Compartilhe com igrejas ou convidados: ${fullUrl}`,
      });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-[#0F223D]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-theme-primary/20 shadow-sm transition-colors duration-200 shrink-0">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-3 py-3">
        
        {/* Esquerda: Logo Dinâmico do Workspace */}
        <div className="flex items-center gap-2.5 shrink-0">
          {workspace?.logo_url ? (
            <img 
              src={workspace.logo_url} 
              alt={`Logo ${workspace.name}`} 
              className="h-8 w-auto object-contain" 
            />
          ) : (
            <div className="text-xl font-bold text-slate-900 dark:text-white tracking-wide">
              {workspace?.name || 'Workspace'}
            </div>
          )}
        </div>

        {/* Centro: Abas Principais mapeadas da Fonte Única */}
        <nav className="hidden lg:flex items-center gap-1 p-1 bg-slate-100 dark:bg-navy-950/60 rounded-xl border border-slate-200 dark:border-white/5 overflow-x-auto no-scrollbar">
          {mainTabLinks.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.tabId;
            return (
              <button
                key={item.id}
                onClick={() => item.tabId && onTabChange(item.tabId)}
                className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap border-b-2 cursor-pointer ${
                  isActive
                    ? 'text-navy-900 dark:text-theme-primary border-navy-900 dark:border-theme-primary font-bold bg-white/60 dark:bg-transparent'
                    : 'text-slate-600 dark:text-white/70 border-transparent hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Direita: Botão Compartilhar + Criar (se >= ADM) + Name badge + Menu Hambúrguer */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          
          {/* 🌟 Botão Chamativo: Compartilhar (White-label) */}
          <button
            onClick={onShare || handleDefaultShare}
            title="Compartilhar Link do Grupo / Convite"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-theme-primary text-slate-950 hover:opacity-80 shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Compartilhar</span>
          </button>

          {canCreate && onOpenAddModal && (
            <button
              onClick={onOpenAddModal}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-800 dark:text-white border border-gray-300 dark:border-gray-700 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Criar</span>
            </button>
          )}

          {currentMember && (
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-theme-primary/10 text-slate-800 dark:text-theme-primary border border-theme-primary/30">
              <span className="w-2 h-2 rounded-full bg-theme-primary animate-pulse" />
              <span>{currentMember.name}</span>
            </span>
          )}

          <button
            onClick={onOpenSidebar}
            title="Abrir Menu de Opções"
            className="p-2 rounded-xl text-theme-primary hover:bg-theme-primary/10 transition-all cursor-pointer border border-theme-primary/20 active:scale-95"
          >
            <Menu className="w-6 h-6 text-theme-primary" />
          </button>
        </div>
      </div>
    </header>
  );
};
