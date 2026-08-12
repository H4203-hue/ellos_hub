'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EventItem, SongItem, VoiceType } from '@/types';
import { GroupMember, isAdm } from '@/data/groupMembers';
import { EventResponseRow } from './EventCard';
import { toast } from 'sonner';
import { 
  X, 
  MapPin, 
  Clock, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Car, 
  Shirt, 
  Mic, 
  FileText, 
  Music, 
  ExternalLink, 
  Lock, 
  Unlock, 
  Sparkles,
  Users,
  Navigation
} from 'lucide-react';

interface EventNotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem | null;
  songs: SongItem[];
  currentMember: GroupMember | null;
  effectiveRole: string; // 'DEV' | 'ADM' | 'MEDIA' | 'MEMBER'
  onToggleVote: (eventId: string, memberOverride?: GroupMember | null, statusOverride?: 'YES' | 'NO' | 'MAYBE', note?: string) => Promise<void> | void;
  onUpdateEvent?: (updated: EventItem) => void;
  eventResponses?: EventResponseRow[];
}

export const EventNotionModal: React.FC<EventNotionModalProps> = ({
  isOpen,
  onClose,
  event,
  songs,
  currentMember,
  effectiveRole,
  onToggleVote,
  onUpdateEvent,
  eventResponses = [],
}) => {
  const [activeTab, setActiveTab] = useState<'geral' | 'presenca' | 'adm' | 'repertorio'>('geral');
  const [voteNote, setVoteNote] = useState('');
  const [lastVotedStatus, setLastVotedStatus] = useState<'YES' | 'MAYBE' | 'NO' | null>(null);

  if (!isOpen || !event) return null;

  const userCanManageAdm = effectiveRole === 'ADM' || effectiveRole === 'DEV';

  // Respostas deste evento
  const currentEventResponses = eventResponses.filter((r) => r.event_id === event.id);
  const myResponse = currentMember
    ? currentEventResponses.find((r) => r.member_id === currentMember.id)
    : undefined;

  const handleVoteAction = async (status: 'YES' | 'MAYBE' | 'NO') => {
    if (event.isVotingClosed) {
      toast.error('🔒 Votação encerrada pela Regência (ADM).');
      return;
    }

    setLastVotedStatus(status);
    await onToggleVote(event.id, currentMember, status, voteNote);

    if (status === 'YES') {
      toast.success(`✨ Presença confirmada para ${currentMember?.name || 'você'}!`, {
        description: 'Seu voto foi registrado com sucesso no Ellos Hub.',
      });
    } else if (status === 'MAYBE') {
      toast.warning(`🟡 Plantão / Escala registrado para ${currentMember?.name || 'você'}.`, {
        description: 'Regência notificada sobre a ressalva.',
      });
    } else {
      toast.info(`Ausência informada para ${currentMember?.name || 'você'}.`);
    }
  };

  const handleToggleVotingClosed = () => {
    if (!userCanManageAdm || !onUpdateEvent) return;
    const updated = {
      ...event,
      isVotingClosed: !event.isVotingClosed,
    };
    onUpdateEvent(updated);
    toast.success(
      updated.isVotingClosed
        ? '🔒 Votações encerradas para este evento!'
        : '🔓 Votações reabertas pela Regência.'
    );
  };

  const googleMapsUrl = event.location
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`
    : null;

  const wazeUrl = event.location
    ? `https://waze.com/ul?q=${encodeURIComponent(event.location)}`
    : null;

  // Filtrar músicas vinculadas
  const scheduledSongs = songs.filter((s) => event.songIds?.includes(s.id));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-sans no-scrollbar">
        {/* Backdrop de Desfoque Notion-Style */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal Container Centralizado com Zoom e Fade no Eixo Z */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-3xl bg-[#1B365D] border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh] z-10"
        >
          {/* Header Notion-Style com Capa Dourada / Status */}
          <div className="bg-gradient-to-r from-navy-900 via-navy-950 to-navy-900 px-6 py-5 border-b border-amber-500/20 relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2 max-w-xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gold-500/15 text-gold-300 border border-gold-500/30">
                  {event.category}
                </span>

                {event.status === 'CONFIRMED' && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Confirmado
                  </span>
                )}
                {event.status === 'PROPOSAL' && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-gold-300 border border-amber-500/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Em Votação
                  </span>
                )}
                {event.status === 'INTERNAL' && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3" />
                    Ensaio Interno
                  </span>
                )}

                {event.isVotingClosed && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Votação Encerrada
                  </span>
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {event.title}
              </h2>

              <p className="text-xs text-slate-300 flex flex-wrap items-center gap-3">
                {event.date && (
                  <span className="flex items-center gap-1 text-gold-300 font-semibold">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    {event.date}
                  </span>
                )}
                {event.time && (
                  <span className="flex items-center gap-1 text-slate-300">
                    <Clock className="w-3.5 h-3.5" />
                    {event.time}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Sub-Navegação por Abas Notion-Style */}
          <div className="flex items-center gap-1 px-4 pt-3 bg-navy-950/60 border-b border-navy-800 overflow-x-auto no-scrollbar shrink-0">
            <button
              onClick={() => setActiveTab('geral')}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border-b-2 ${
                activeTab === 'geral'
                  ? 'border-gold-400 text-gold-300 bg-navy-900'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Geral &amp; Local</span>
            </button>

            <button
              onClick={() => setActiveTab('presenca')}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border-b-2 ${
                activeTab === 'presenca'
                  ? 'border-gold-400 text-gold-300 bg-navy-900'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Sua Presença</span>
            </button>

            {userCanManageAdm && (
              <button
                onClick={() => setActiveTab('adm')}
                className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border-b-2 ${
                  activeTab === 'adm'
                    ? 'border-gold-400 text-gold-300 bg-navy-900'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Ficha Técnica / ADM</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('repertorio')}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border-b-2 ${
                activeTab === 'repertorio'
                  ? 'border-gold-400 text-gold-300 bg-navy-900'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Repertório ({scheduledSongs.length})</span>
            </button>
          </div>

          {/* Conteúdo da Modal Expandida */}
          <div className="p-5 sm:p-6 overflow-y-auto no-scrollbar flex-1 space-y-6">
            {/* ABA 1: GERAL & LOCAL */}
            {activeTab === 'geral' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Local & GPS Navigation Buttons */}
                <div className="bg-navy-950/70 p-4 sm:p-5 rounded-2xl border border-amber-500/20 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gold-400 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        Localização &amp; Endereço
                      </span>
                      <h4 className="text-base font-extrabold text-white mt-1">
                        {event.location || 'Local a definir'}
                      </h4>
                    </div>
                  </div>

                  {event.location && (
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-navy-800">
                      {googleMapsUrl && (
                        <a
                          href={googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-navy-900 hover:bg-navy-800 border border-gold-500/20 text-gold-300 flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Navigation className="w-3.5 h-3.5 text-gold-400" />
                          <span>Abrir no Google Maps</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </a>
                      )}
                      {wazeUrl && (
                        <a
                          href={wazeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Car className="w-3.5 h-3.5 text-sky-400" />
                          <span>Abrir no Waze</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Traje do Dia & Horários */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Traje */}
                  <div className="bg-navy-950/70 p-4 rounded-2xl border border-amber-500/20 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gold-400 flex items-center gap-1.5">
                      <Shirt className="w-4 h-4" />
                      Traje do Dia (Dress Code)
                    </span>
                    <p className="text-xs text-slate-200 font-semibold leading-relaxed">
                      {event.dressCode || '👔 Traje oficial a definir pela Regência.'}
                    </p>
                  </div>

                  {/* Horário de Chegada */}
                  <div className="bg-navy-950/70 p-4 rounded-2xl border border-amber-500/20 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gold-400 flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      Horário de Chegada &amp; Som
                    </span>
                    <p className="text-xs text-slate-200 font-semibold leading-relaxed">
                      {event.time ? `⏰ Passagem de som às ${event.time}` : '⏰ Horário de concentração a confirmar.'}
                    </p>
                  </div>
                </div>

                {/* Mapa de Caronas */}
                <div className="bg-navy-950/70 p-4 sm:p-5 rounded-2xl border border-amber-500/20 space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gold-400 flex items-center gap-1.5">
                    <Car className="w-4 h-4" />
                    Mapa de Caronas &amp; Deslocamento
                  </span>

                  {event.drivers && event.drivers.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {event.drivers.map((drv, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-xl bg-navy-900 border border-navy-800 text-xs flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold text-white block">🚘 {drv.name}</span>
                            <span className="text-[11px] text-slate-400">
                              Vagas disponíveis: <strong className="text-gold-300">{drv.spots}</strong>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">
                      Nenhuma carona ou motorista oficial alocado até o momento.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ABA 2: SUA PRESENÇA */}
            {activeTab === 'presenca' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="bg-navy-950/70 p-5 rounded-2xl border border-amber-500/20 space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-gold-400" />
                      Confirmação Rápida de Presença em 1 Toque
                    </h3>
                    <p className="text-xs text-slate-300">
                      Informe sua disponibilidade para o compromisso.
                    </p>
                  </div>

                  {/* Voto Atual do Integrante */}
                  {myResponse && (
                    <div className="p-3 rounded-xl bg-navy-900 border border-gold-500/30 text-xs flex items-center gap-2">
                      <span className="font-bold text-slate-300">Seu voto registrado:</span>
                      <span className="font-black text-gold-300 bg-gold-500/20 px-2.5 py-0.5 rounded-md">
                        {myResponse.status === 'YES' && '🟢 Posso ir (Confirmado)'}
                        {myResponse.status === 'MAYBE' && '🟡 Plantão / Escala'}
                        {myResponse.status === 'NO' && '🔴 Não vou'}
                      </span>
                    </div>
                  )}

                  {/* Campo de Observação */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Observação / Justificativa (Opcional):
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Chegarei 15min depois / Caso seja escalado no trabalho..."
                      value={voteNote}
                      onChange={(e) => setVoteNote(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-navy-700 bg-navy-900 text-slate-100 text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                    />
                  </div>

                  {/* Botões de Votação com Efeito Spring/Pop */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleVoteAction('YES')}
                      disabled={event.isVotingClosed}
                      className="py-3 px-4 rounded-2xl text-xs font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/20 hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Posso Ir (Confirmar)</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleVoteAction('MAYBE')}
                      disabled={event.isVotingClosed}
                      className="py-3 px-4 rounded-2xl text-xs font-extrabold bg-amber-500/20 hover:bg-amber-500/30 text-gold-300 border border-amber-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <HelpCircle className="w-4 h-4 text-gold-400" />
                      <span>Plantão / Escala</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleVoteAction('NO')}
                      disabled={event.isVotingClosed}
                      className="py-3 px-4 rounded-2xl text-xs font-extrabold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4 text-rose-400" />
                      <span>Não Vou (Ausente)</span>
                    </motion.button>
                  </div>
                </div>

                {/* Resumo de Respostas por Integrante */}
                <div className="bg-navy-950/70 p-5 rounded-2xl border border-amber-500/20 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gold-400">
                    Respostas dos Integrantes ({currentEventResponses.length})
                  </h4>

                  {currentEventResponses.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {currentEventResponses.map((r, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-navy-900 border border-navy-800 text-xs flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold text-white block">
                              {r.member_name} <span className="font-normal text-slate-400">({r.voice})</span>
                            </span>
                            {r.note && (
                              <span className="text-[11px] text-gold-300/90 block italic">
                                &quot;{r.note}&quot;
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-black">
                            {r.status === 'YES' && '🟢 Sim'}
                            {r.status === 'MAYBE' && '🟡 Plantão'}
                            {r.status === 'NO' && '🔴 Não'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">Nenhum voto computado ainda.</p>
                  )}
                </div>
              </div>
            )}

            {/* ABA 3: FICHA TÉCNICA / ADM (Apenas ADM/DEV) */}
            {activeTab === 'adm' && userCanManageAdm && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Trava de Votação */}
                <div className="bg-navy-950/70 p-5 rounded-2xl border border-amber-500/20 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-white block flex items-center gap-1.5">
                      {event.isVotingClosed ? <Lock className="w-4 h-4 text-rose-400" /> : <Unlock className="w-4 h-4 text-emerald-400" />}
                      Status da Votação no Ellos Hub
                    </span>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {event.isVotingClosed
                        ? 'Votações atualmente ENCERRADAS pela Regência.'
                        : 'Votações abertas para confirmação de presença.'}
                    </p>
                  </div>

                  <button
                    onClick={handleToggleVotingClosed}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 ${
                      event.isVotingClosed
                        ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                    }`}
                  >
                    {event.isVotingClosed ? '🔓 Reabrir Votações' : '🔒 Encerrar Votações'}
                  </button>
                </div>

                {/* Microfones & Cronograma */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-navy-950/70 p-4 rounded-2xl border border-amber-500/20 space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gold-400 flex items-center gap-1.5">
                      <Mic className="w-4 h-4" />
                      Distribuição de Microfones
                    </span>
                    <p className="text-sm font-extrabold text-white">
                      {event.microphonesCount || 4} microfones sem fio escalados
                    </p>
                  </div>

                  <div className="bg-navy-950/70 p-4 rounded-2xl border border-amber-500/20 space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gold-400 flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      Prazo Limite de Votação
                    </span>
                    <p className="text-sm font-extrabold text-white">
                      {event.votingDeadline || 'Sem prazo limite estipulado'}
                    </p>
                  </div>
                </div>

                {/* Cronograma / Schedule */}
                <div className="bg-navy-950/70 p-5 rounded-2xl border border-amber-500/20 space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gold-400 flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    Cronograma Detalhado do Compromisso
                  </span>

                  {event.schedule && event.schedule.length > 0 ? (
                    <div className="space-y-2">
                      {event.schedule.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-navy-900 border border-navy-800 text-xs flex items-center gap-3"
                        >
                          <span className="font-black text-gold-300 bg-gold-500/10 px-2.5 py-1 rounded-md">
                            {item.time}
                          </span>
                          <span className="font-medium text-white">{item.activity}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">Nenhum cronograma definido ainda.</p>
                  )}
                </div>
              </div>
            )}

            {/* ABA 4: REPERTÓRIO */}
            {activeTab === 'repertorio' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gold-400 flex items-center gap-1.5">
                    <Music className="w-4 h-4" />
                    Músicas Escaladas ({scheduledSongs.length})
                  </h3>
                </div>

                {scheduledSongs.length > 0 ? (
                  <div className="space-y-3">
                    {scheduledSongs.map((song) => (
                      <div
                        key={song.id}
                        className="p-4 rounded-2xl bg-navy-950/80 border border-amber-500/20 space-y-3 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-base font-extrabold text-white">
                              {song.title}
                            </h4>
                            <p className="text-xs text-slate-400">
                              {song.artistOrGroup} {song.keySignature && `• Tom: ${song.keySignature}`}
                            </p>
                          </div>

                          <a
                            href={song.generalDriveFolderUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gold-500/10 hover:bg-gold-500/20 text-gold-300 border border-gold-500/30 flex items-center gap-1 transition-all"
                          >
                            <span>Pasta Geral Drive</span>
                            <ExternalLink className="w-3 h-3 opacity-70" />
                          </a>
                        </div>

                        {/* Kits de Voz por Naipe */}
                        <div className="pt-2 border-t border-navy-800">
                          <span className="text-[11px] font-bold text-slate-400 block mb-1.5">
                            Kits de Ensaio por Naipe:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {song.voiceKits.map((vk, i) => (
                              <a
                                key={i}
                                href={vk.driveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-navy-900 hover:bg-navy-800 text-slate-200 border border-navy-700 flex items-center gap-1 transition-all"
                              >
                                🎵 {vk.label}
                                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-navy-950/50 rounded-2xl border border-navy-800">
                    <Music className="w-10 h-10 text-slate-500 mx-auto mb-2 opacity-50" />
                    <p className="text-xs text-slate-300 font-semibold">
                      Nenhuma música foi vinculada diretamente a este compromisso.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Acesse a aba Repertório para visualizar a lista completa de músicas.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
