'use client';

import React, { useState } from 'react';
import { GroupMember } from '@/data/groupMembers';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { toast } from 'sonner';
import { 
  X, 
  UserCheck, 
  ShieldCheck, 
  Plus, 
  Link as LinkIcon, 
  LogOut, 
  Sparkles,
  Eye,
  SlidersHorizontal,
  ExternalLink,
  Smartphone,
  Share2,
  Calendar,
  Layers,
  ListTodo
} from 'lucide-react';
import Image from 'next/image';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentMember: GroupMember | null;
  effectiveRole: string; // Papel ativo/simulado
  simulatedRole: string; // 'DEV' | 'ADM' | 'MEDIA' | 'MEMBER'
  onSimulatedRoleChange: (role: 'DEV' | 'ADM' | 'MEDIA' | 'MEMBER') => void;
  onOpenAddModal: () => void;
  onOpenMediaModal: () => void;
  onOpenDevModal: () => void;
  onLogout: () => void;
  activeTab?: 'agenda' | 'repertoire' | 'tasks';
  onTabChange?: (tab: 'agenda' | 'repertoire' | 'tasks') => void;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
  isOpen,
  onClose,
  currentMember,
  effectiveRole,
  simulatedRole,
  onSimulatedRoleChange,
  onOpenAddModal,
  onOpenMediaModal,
  onOpenDevModal,
  onLogout,
  activeTab,
  onTabChange,
}) => {
  const [showPwaHelp, setShowPwaHelp] = useState(false);

  if (!isOpen) return null;

  const isRealDev = currentMember?.role === 'DEV';
  const canCreate = effectiveRole === 'ADM' || effectiveRole === 'DEV';
  const canAccessMedia = effectiveRole === 'MEDIA' || effectiveRole === 'ADM' || effectiveRole === 'DEV';

  const handleCopyBioLink = () => {
    const fullUrl = `${window.location.origin}/convite`;
    navigator.clipboard.writeText(fullUrl);
    toast.success('🔗 Link da Bio (/convite) copiado com sucesso!', {
      description: 'Pronto para colar na bio do Instagram.',
    });
    onClose();
  };

  const getRoleBadge = (roleStr: string) => {
    switch (roleStr) {
      case 'DEV':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-gold-300 border border-amber-500/30">🛠️ DEV</span>;
      case 'ADM':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/30">👑 ADM</span>;
      case 'MEDIA':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">📸 MÍDIA</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-500/20 text-slate-300 border border-slate-500/30">🎵 MEMBRO</span>;
    }
  };

  return (
    <>
      {/* Backdrop Overlay */}
      <div 
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      />

      {/* Drawer Panel Retrátil */}
      <aside className="fixed inset-y-0 right-0 z-50 w-80 bg-[#1B365D] border-l border-amber-500/20 shadow-2xl flex flex-col justify-between p-6 animate-in slide-in-from-right duration-300 font-sans text-slate-100 no-scrollbar">
        {/* Top Header */}
        <div className="space-y-5 overflow-y-auto no-scrollbar pr-1">
          <div className="flex items-center justify-between border-b border-navy-800/80 pb-4">
            <Image 
              src="/logo-ellos.svg" 
              alt="Ellos Vocal Logo" 
              width={120} 
              height={32} 
              priority 
              className="h-7 w-auto"
            />
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-navy-800/80 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navegação Principal Mobile */}
          {onTabChange && (
            <div className="space-y-1.5 pb-2 md:hidden">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gold-400 block">
                Navegação Principal
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => {
                    onTabChange('agenda');
                    onClose();
                  }}
                  className={`p-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 border cursor-pointer ${
                    activeTab === 'agenda'
                      ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-slate-950 border-gold-400 font-black'
                      : 'bg-navy-950 text-slate-300 border-navy-800 hover:bg-navy-900'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Agenda</span>
                </button>
                <button
                  onClick={() => {
                    onTabChange('repertoire');
                    onClose();
                  }}
                  className={`p-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 border cursor-pointer ${
                    activeTab === 'repertoire'
                      ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-slate-950 border-gold-400 font-black'
                      : 'bg-navy-950 text-slate-300 border-navy-800 hover:bg-navy-900'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Músicas</span>
                </button>
                <button
                  onClick={() => {
                    onTabChange('tasks');
                    onClose();
                  }}
                  className={`p-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 border cursor-pointer ${
                    activeTab === 'tasks'
                      ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-slate-950 border-gold-400 font-black'
                      : 'bg-navy-950 text-slate-300 border-navy-800 hover:bg-navy-900'
                  }`}
                >
                  <ListTodo className="w-4 h-4" />
                  <span>Tarefas</span>
                </button>
              </div>
            </div>
          )}

          {/* Active Member Profile Card */}
          {currentMember ? (
            <div className="bg-navy-950/70 rounded-2xl p-4 border border-amber-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-gold-400" />
                  Perfil Autenticado
                </span>
                {getRoleBadge(currentMember.role)}
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">
                  {currentMember.name}
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Naipe: <span className="text-gold-300 font-bold">{currentMember.voice}</span> • {currentMember.email}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-navy-950/50 rounded-2xl p-4 border border-slate-700 text-center">
              <p className="text-xs text-slate-400">Nenhum membro autenticado.</p>
            </div>
          )}

          {/* 🛠️ SELETOR DE SIMULAÇÃO DEV (Visão em Tempo Real) */}
          {isRealDev && (
            <div className="bg-navy-950/90 rounded-2xl p-4 border border-amber-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-gold-400 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-gold-400" />
                  Simulador de Visão DEV
                </span>
                <span className="text-[10px] font-extrabold text-gold-300 bg-gold-500/20 px-2 py-0.5 rounded">
                  Tempo Real
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-tight">
                Alterne a visão de permissões do React sem dar refresh na página:
              </p>

              <div className="grid grid-cols-2 gap-1.5 pt-1">
                {(['DEV', 'ADM', 'MEDIA', 'MEMBER'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      onSimulatedRoleChange(r);
                      toast.info(`🎭 Modo de visão alterado para ${r}`);
                    }}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center border ${
                      simulatedRole === r
                        ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-slate-950 border-gold-400 font-black shadow-xs'
                        : 'bg-navy-900 text-slate-300 border-navy-700 hover:bg-navy-800'
                    }`}
                  >
                    {r === 'DEV' && '🛠️ Dev'}
                    {r === 'ADM' && '👑 ADM'}
                    {r === 'MEDIA' && '📸 Mídia'}
                    {r === 'MEMBER' && '🎵 Membro'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Gestão & Ações Reativas ao Efetivo Role */}
          <div className="space-y-2.5 pt-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gold-400 block">
              Gestão &amp; Atalhos de Acesso
            </span>

            {canCreate && (
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/admin/invites', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ createdBy: currentMember?.name || 'Regência', role: 'MEMBER' }),
                    });
                    const data = await res.json();
                    if (data.inviteUrl) {
                      navigator.clipboard.writeText(data.inviteUrl);
                      toast.success('✨ Link de convite único gerado e copiado!', {
                        description: 'Válido por 48 horas para auto-cadastro de integrante.',
                      });
                      onClose();
                    }
                  } catch {
                    toast.error('Erro ao gerar link de convite.');
                  }
                }}
                className="w-full py-2.5 px-3.5 rounded-xl text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Gerar Convite Único de Integrante</span>
              </button>
            )}

            {canCreate && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAddModal();
                }}
                className="w-full py-2.5 px-3.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-slate-950 hover:brightness-110 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Criar (Evento / Música / Tarefa)</span>
              </button>
            )}

            {canAccessMedia && (
              <button
                onClick={() => {
                  onClose();
                  onOpenMediaModal();
                }}
                className="w-full py-2.5 px-3.5 rounded-xl text-xs font-bold bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Central de Mídia (Copys &amp; Marca)</span>
              </button>
            )}

            {isRealDev && (
              <button
                onClick={() => {
                  onClose();
                  onOpenDevModal();
                }}
                className="w-full py-2.5 px-3.5 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-gold-300 border border-amber-500/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-gold-400" />
                <span>Painel de Engenharia (DEV / API)</span>
              </button>
            )}
          </div>

          {/* Preferências & PWA */}
          <div className="space-y-3 pt-3 border-t border-navy-800/80">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Preferências &amp; Utilitários
            </span>

            {/* Alternador de Tema */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-navy-950/60 border border-navy-800 text-xs">
              <span className="font-semibold text-slate-300">Tema do Aplicativo:</span>
              <ThemeToggle />
            </div>

            {/* Copiar Link da Bio */}
            <button
              onClick={handleCopyBioLink}
              className="w-full py-2.5 px-3.5 rounded-xl text-xs font-semibold bg-navy-950/60 hover:bg-navy-900 border border-amber-500/20 text-gold-300 transition-all flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-gold-400" />
                <span>Copiar Link da Bio (/convite)</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </button>

            {/* Instalação PWA */}
            <button
              onClick={() => setShowPwaHelp(!showPwaHelp)}
              className="w-full py-2.5 px-3.5 rounded-xl text-xs font-semibold bg-navy-950/60 hover:bg-navy-900 border border-navy-800 text-slate-300 transition-all flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-gold-400" />
                <span>Como instalar na tela inicial (PWA)</span>
              </div>
            </button>

            {showPwaHelp && (
              <div className="p-3 rounded-xl bg-navy-950/90 border border-gold-500/20 text-[11px] text-slate-300 leading-relaxed space-y-1.5 animate-in fade-in duration-200">
                <p className="font-bold text-gold-300">📱 No iPhone (Safari):</p>
                <p>Toque no ícone de Compartilhar e selecione &quot;Adicionar à Tela de Início&quot;.</p>
                <p className="font-bold text-gold-300 pt-1">🤖 No Android (Chrome):</p>
                <p>Toque nos 3 pontinhos no topo e clique em &quot;Instalar Aplicativo&quot;.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer: Logout */}
        <div className="pt-4 border-t border-navy-800/80">
          <button
            onClick={() => {
              if (window.confirm('Deseja realmente sair da sua conta?')) {
                onClose();
                onLogout();
              }
            }}
            className="w-full py-3 px-4 rounded-xl text-xs font-extrabold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Sair da Conta (Logout)</span>
          </button>
        </div>
      </aside>
    </>
  );
};
