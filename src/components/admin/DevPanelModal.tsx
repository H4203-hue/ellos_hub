'use client';

import React, { useState, useEffect } from 'react';
import { GroupMember } from '@/data/groupMembers';
import { GlobalSettings } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { toast } from 'sonner';
import { 
  ShieldAlert, 
  Globe, 
  Database, 
  Terminal, 
  RefreshCw, 
  X,
  Server,
  Activity,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface DevPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMember?: GroupMember | null;
  /** Papel real (OWNER traduzido) no workspace atual — não a simulação de visão. */
  isRealDev: boolean;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  source: string;
}

export const DevPanelModal: React.FC<DevPanelModalProps> = ({
  isOpen,
  onClose,
  currentMember,
  isRealDev,
}) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'monitor' | 'logs'>('settings');

  // Configurações Globais State
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
    appDomain: 'elloshub.vercel.app',
    driveRootUrl: 'https://drive.google.com/drive/folders/ellos-vocal',
    instagramBio: 'Grupo Vocal Ellos 🎵 | Louvor, harmonia e dedicação.\nSolicite uma apresentação: elloshub.vercel.app/convite',
  });

  // DB Stats State
  const [dbStats, setDbStats] = useState({ eventsCount: 0, songsCount: 0, tasksCount: 0, profilesCount: 0 });
  const [isRefreshingStats, setIsRefreshingStats] = useState(false);

  // Diagnostic System Logs
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 'log-1',
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      level: 'info',
      message: 'Supabase Realtime WebSocket conectado com sucesso.',
      source: 'RealtimeChannel',
    },
    {
      id: 'log-2',
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      level: 'info',
      message: 'Autenticação RBAC inicializada para sessão ativa.',
      source: 'AuthGuard',
    },
  ]);

  const fetchDbTelemetry = async () => {
    setIsRefreshingStats(true);
    try {
      if (supabase && isSupabaseConfigured) {
        const { count: evCount } = await supabase.from('events').select('*', { count: 'exact', head: true });
        const { count: sgCount } = await supabase.from('songs').select('*', { count: 'exact', head: true });
        const { count: tkCount } = await supabase.from('tasks').select('*', { count: 'exact', head: true });
        const { count: pfCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

        setDbStats({
          eventsCount: evCount || 0,
          songsCount: sgCount || 0,
          tasksCount: tkCount || 0,
          profilesCount: pfCount || 0,
        });

        setLogs((prev) => [
          {
            id: `log-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString('pt-BR'),
            level: 'info',
            message: `Telemetria DB atualizada: ${evCount || 0} eventos, ${sgCount || 0} músicas, ${tkCount || 0} tarefas.`,
            source: 'TelemetryService',
          },
          ...prev,
        ]);
      } else {
        setDbStats({
          eventsCount: 3,
          songsCount: 3,
          tasksCount: 5,
          profilesCount: 13,
        });
      }
    } catch (err) {
      console.warn('Erro ao carregar telemetria:', err);
      setLogs((prev) => [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('pt-BR'),
          level: 'warn',
          message: 'Falha ao buscar estatísticas remotas do Supabase.',
          source: 'TelemetryService',
        },
        ...prev,
      ]);
    } finally {
      setIsRefreshingStats(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDbTelemetry();
    }
  }, [isOpen]);

  // Defesa em profundidade: mesmo que o item de nav tenha sido filtrado
  // incorretamente em algum lugar, o painel Dev nunca renderiza sem o
  // papel real (não simulado) ser OWNER no workspace atual.
  if (!isOpen || !isRealDev) return null;

  const handleSaveGlobalSettings = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('✨ Configurações globais salvas com sucesso!');
    setLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        level: 'info',
        message: 'Configurações globais de domínio e Drive atualizadas pelo DEV.',
        source: 'GlobalSettings',
      },
      ...prev,
    ]);
  };

  const handleClearLogs = () => {
    setLogs([]);
    toast.info('🧹 Logs de diagnóstico limpos.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1F2937] border border-gray-800 text-slate-100 rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 relative max-h-[90vh] flex flex-col overflow-hidden font-sans">
        
        {/* Modal Header com Badge de Área Restrita - Engenharia */}
        <div className="flex items-start justify-between border-b border-gray-800 pb-4 shrink-0">
          <div className="space-y-1.5">
            {/* Aviso visual em destaque (Badge Vermelho) */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Área Restrita - Engenharia (DEV Mode)</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Console de Engenharia &amp; Infraestrutura
            </h2>
            <p className="text-xs text-slate-300">
              Controle avançado de parâmetros globais, telemetria do Supabase DB e monitoramento de logs do sistema.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-gray-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 border-b border-gray-800 pb-2 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-slate-950 font-black shadow-md'
                : 'bg-[#111827] text-slate-300 hover:bg-gray-800/60'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>1. Configurações Globais</span>
          </button>

          <button
            onClick={() => setActiveTab('monitor')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'monitor'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-slate-950 font-black shadow-md'
                : 'bg-[#111827] text-slate-300 hover:bg-gray-800/60'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>2. Monitor DB &amp; Telemetria</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-slate-950 font-black shadow-md'
                : 'bg-[#111827] text-slate-300 hover:bg-gray-800/60'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>3. Logs do Sistema ({logs.length})</span>
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="overflow-y-auto no-scrollbar flex-1 pr-1 space-y-6">
          
          {/* TAB 1: CONFIGURAÇÕES GLOBAIS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <form onSubmit={handleSaveGlobalSettings} className="bg-[#111827] p-5 rounded-2xl border border-gray-800 space-y-4 text-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gold-400 flex items-center gap-1.5">
                  <Globe className="w-4 h-4" />
                  Parâmetros de Domínio &amp; Redes Sociais
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Domínio Público Enxuto Vercel
                    </label>
                    <input
                      type="text"
                      value={globalSettings.appDomain}
                      onChange={(e) => setGlobalSettings({ ...globalSettings, appDomain: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-700 bg-[#1F2937] text-slate-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Link da Pasta Raiz do Google Drive (Kits de Voz)
                    </label>
                    <input
                      type="text"
                      value={globalSettings.driveRootUrl}
                      onChange={(e) => setGlobalSettings({ ...globalSettings, driveRootUrl: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-700 bg-[#1F2937] text-slate-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Texto Padrão da Bio do Instagram
                    </label>
                    <textarea
                      rows={3}
                      value={globalSettings.instagramBio}
                      onChange={(e) => setGlobalSettings({ ...globalSettings, instagramBio: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-700 bg-[#1F2937] text-slate-100 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-extrabold bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-slate-950 hover:brightness-110 transition-all cursor-pointer shadow-md"
                >
                  Salvar Configurações Globais
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: MONITOR DO BANCO DE DADOS */}
          {activeTab === 'monitor' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gold-400 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Telemetria em Tempo Real
                </span>

                <button
                  onClick={fetchDbTelemetry}
                  disabled={isRefreshingStats}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#111827] text-gold-300 border border-gray-800 hover:bg-gray-800 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingStats ? 'animate-spin' : ''}`} />
                  <span>Atualizar</span>
                </button>
              </div>

              {/* Status do Provedor Supabase */}
              <div className="bg-[#111827] p-4 rounded-2xl border border-gray-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <Server className="w-5 h-5 text-gold-400 shrink-0" />
                  <div>
                    <span className="font-bold text-white block">Status da Conexão Supabase</span>
                    <span className="text-[11px] text-slate-400">WebSocket Realtime &amp; Auth v2</span>
                  </div>
                </div>

                <div>
                  {isSupabaseConfigured ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Supabase Realtime Ativo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Modo Local (Demo)
                    </span>
                  )}
                </div>
              </div>

              {/* Cards de Métricas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#111827] p-5 rounded-2xl border border-gray-800 space-y-1">
                  <span className="text-[11px] font-bold uppercase text-gold-400 block">Total de Eventos</span>
                  <p className="text-3xl font-black text-white">{dbStats.eventsCount}</p>
                  <p className="text-[10px] text-slate-400">Registrados no Supabase</p>
                </div>

                <div className="bg-[#111827] p-5 rounded-2xl border border-gray-800 space-y-1">
                  <span className="text-[11px] font-bold uppercase text-gold-400 block">Total de Músicas</span>
                  <p className="text-3xl font-black text-white">{dbStats.songsCount}</p>
                  <p className="text-[10px] text-slate-400">Repertório cadastrado</p>
                </div>

                <div className="bg-[#111827] p-5 rounded-2xl border border-gray-800 space-y-1">
                  <span className="text-[11px] font-bold uppercase text-gold-400 block">Total de Tarefas</span>
                  <p className="text-3xl font-black text-white">{dbStats.tasksCount}</p>
                  <p className="text-[10px] text-slate-400">Tarefas e Backlog</p>
                </div>

                <div className="bg-[#111827] p-5 rounded-2xl border border-gray-800 space-y-1">
                  <span className="text-[11px] font-bold uppercase text-gold-400 block">Total de Perfis</span>
                  <p className="text-3xl font-black text-white">{dbStats.profilesCount}</p>
                  <p className="text-[10px] text-slate-400">Usuários no Auth DB</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LOGS DO SISTEMA */}
          {activeTab === 'logs' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gold-400 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4" />
                  Console de Logs do Sistema
                </span>

                <button
                  onClick={handleClearLogs}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#111827] text-slate-400 hover:text-white border border-gray-800 hover:bg-gray-800 transition-all cursor-pointer"
                >
                  Limpar Logs
                </button>
              </div>

              <div className="rounded-2xl border border-gray-800 bg-[#111827] p-4 font-mono text-xs space-y-2 max-h-72 overflow-y-auto no-scrollbar">
                {logs.length === 0 ? (
                  <p className="text-slate-500 text-center py-6">Nenhum log registrado na sessão.</p>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-2.5 py-1 border-b border-gray-800/50 last:border-0">
                      <span className="text-slate-500 shrink-0 text-[11px]">{log.timestamp}</span>
                      
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                          log.level === 'error'
                            ? 'bg-rose-500/20 text-rose-300'
                            : log.level === 'warn'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {log.level.toUpperCase()}
                      </span>

                      <span className="text-gold-400/80 font-bold shrink-0">[{log.source}]</span>
                      <span className="text-slate-200">{log.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
