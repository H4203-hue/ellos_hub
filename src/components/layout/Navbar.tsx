'use client';

import React from 'react';
import Image from 'next/image';
import { Calendar, Layers, ListTodo, Menu, Plus } from 'lucide-react';
import { GroupMember } from '@/data/groupMembers';

interface NavbarProps {
  activeTab: 'agenda' | 'repertoire' | 'tasks';
  onTabChange: (tab: 'agenda' | 'repertoire' | 'tasks') => void;
  currentMember?: GroupMember | null;
  effectiveRole: string; // 'DEV' | 'ADM' | 'MEDIA' | 'MEMBER'
  onOpenSidebar: () => void;
  onOpenAddModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  currentMember,
  effectiveRole,
  onOpenSidebar,
  onOpenAddModal,
}) => {
  const canCreate = effectiveRole === 'ADM' || effectiveRole === 'DEV';

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-[#0F223D]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-gold-500/20 shadow-sm transition-colors duration-200 shrink-0">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-3 py-3">
        {/* Esquerda: Logo Oficial em SVG */}
        <div className="flex items-center gap-2 shrink-0">
          <Image
            src="/logo-ellos.svg"
            alt="Ellos Grupo Logo"
            width={140}
            height={38}
            priority
            className="h-8 sm:h-9 w-auto object-contain"
          />
        </div>

        {/* Centro: Abas Principais (Exibidas apenas a partir de md: em telas maiores) */}
        <nav className="hidden md:flex items-center gap-1 p-1 bg-slate-100 dark:bg-navy-950/60 rounded-xl border border-slate-200 dark:border-white/5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => onTabChange('agenda')}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap border-b-2 cursor-pointer ${
              activeTab === 'agenda'
                ? 'text-navy-900 dark:text-[#E5C378] border-navy-900 dark:border-[#E5C378] font-bold bg-white/60 dark:bg-transparent'
                : 'text-slate-600 dark:text-white/70 border-transparent hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Agenda &amp; Convites</span>
          </button>

          <button
            onClick={() => onTabChange('repertoire')}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap border-b-2 cursor-pointer ${
              activeTab === 'repertoire'
                ? 'text-navy-900 dark:text-[#E5C378] border-navy-900 dark:border-[#E5C378] font-bold bg-white/60 dark:bg-transparent'
                : 'text-slate-600 dark:text-white/70 border-transparent hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Repertório &amp; Kits</span>
          </button>

          <button
            onClick={() => onTabChange('tasks')}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap border-b-2 cursor-pointer ${
              activeTab === 'tasks'
                ? 'text-navy-900 dark:text-[#E5C378] border-navy-900 dark:border-[#E5C378] font-bold bg-white/60 dark:bg-transparent'
                : 'text-slate-600 dark:text-white/70 border-transparent hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ListTodo className="w-4 h-4" />
            <span>Tarefas &amp; Backlog</span>
          </button>
        </nav>

        {/* Direita: Botão + Criar (se >= ADM) + Name badge + Menu Hambúrguer */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {canCreate && onOpenAddModal && (
            <button
              onClick={onOpenAddModal}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-slate-950 hover:brightness-110 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Criar</span>
            </button>
          )}

          {currentMember && (
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gold-500/10 text-slate-800 dark:text-gold-300 border border-gold-500/30">
              <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
              <span>{currentMember.name}</span>
            </span>
          )}

          <button
            onClick={onOpenSidebar}
            title="Abrir Menu de Opções"
            className="p-2 rounded-xl text-[#D4AF37] hover:bg-gold-500/10 transition-all cursor-pointer border border-gold-500/20 active:scale-95"
          >
            <Menu className="w-6 h-6 text-[#D4AF37]" />
          </button>
        </div>
      </div>
    </header>
  );
};
