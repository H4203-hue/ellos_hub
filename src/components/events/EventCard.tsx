'use client';

import React, { useState } from 'react';
import { EventItem, SongItem } from '@/types';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  CheckCircle2, 
  Vote, 
  MessageCircle, 
  Sparkles,
  Check,
  Building2,
  Shirt,
  Car,
  Volume2,
  Copy,
  ListOrdered,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

import { GroupMember } from '@/data/groupMembers';
import { VoiceType } from '@/types';

export interface EventResponseRow {
  id?: string;
  event_id: string;
  member_id: string;
  member_name: string;
  voice: VoiceType;
  status: 'YES' | 'NO' | 'MAYBE';
  note?: string;
}

interface EventCardProps {
  event: EventItem;
  songs?: SongItem[];
  currentMember?: GroupMember | null;
  onToggleVote?: (eventId: string, member?: GroupMember | null, statusOverride?: 'YES' | 'NO' | 'MAYBE', note?: string) => Promise<void> | void;
  onEditEvent?: (event: EventItem) => void;
  onDeleteEvent?: (eventId: string) => void;
  eventResponses?: EventResponseRow[];
  onRefetchResponses?: () => Promise<void> | void;
}

export const EventCard: React.FC<EventCardProps> = ({ 
  event, 
  songs = [], 
  currentMember,
  onToggleVote, 
  onEditEvent, 
  onDeleteEvent,
  eventResponses = [],
  onRefetchResponses
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'schedule' | 'carpool'>('info');
  const [copiedTechSheet, setCopiedTechSheet] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirmPresence = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (event.isVotingClosed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (onToggleVote) {
        await onToggleVote(event.id, currentMember);
      }
      if (onRefetchResponses) {
        await onRefetchResponses();
      }
    } catch (err) {
      console.error('Erro ao confirmar presença:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [localDrivers, setLocalDrivers] = useState(event.drivers || []);
  const [localPassengers, setLocalPassengers] = useState(event.passengers || []);
  const [showAddCarModal, setShowAddCarModal] = useState(false);
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverSpots, setNewDriverSpots] = useState(4);

  const getStatusBadge = () => {
    switch (event.status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-status-confirmed/10 text-status-confirmed border border-status-confirmed/30 shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-status-confirmed" />
            Confirmado
          </span>
        );
      case 'PROPOSAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-status-voting/10 text-status-voting border border-status-voting/30 shadow-xs">
            <Vote className="w-3.5 h-3.5 text-status-voting" />
            Em Votação
          </span>
        );
      case 'INTERNAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-status-success/10 text-status-success border border-status-success/30 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-status-success" />
            Interno / Collab
          </span>
        );
      default:
        return null;
    }
  };

  const cleanPhone = event.contactPhone ? event.contactPhone.replace(/\D/g, '') : '';
  const whatsappUrl = cleanPhone ? `https://wa.me/55${cleanPhone}` : undefined;

  const formatDate = (dateStr?: string) => {
    if (!dateStr || dateStr === 'A definir') return 'A definir';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const [year, month, day] = parts;
        return `${day}/${month}/${year}`;
      }
    } catch {
      // fallback
    }
    return dateStr;
  };

  const votePercentage = event.votesCount 
    ? Math.round((event.votesCount.yes / event.votesCount.total) * 100)
    : 0;

  const hasFullQuorum = event.votesCount ? event.votesCount.yes >= event.votesCount.total : false;

  const eventSongsList = (event.songIds || [])
    .map((id) => songs.find((s) => s.id === id))
    .filter(Boolean) as SongItem[];

  const totalCarSpots = localDrivers.reduce((acc, d) => acc + d.spots, 0);

  const handleAddDriver = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!newDriverName.trim()) return;
    setLocalDrivers((prev) => [...prev, { name: newDriverName.trim(), spots: Number(newDriverSpots) }]);
    setNewDriverName('');
    setShowAddCarModal(false);
  };

  const handleCopyTechSheet = (e: React.MouseEvent) => {
    e.stopPropagation();
    const formattedSongs = eventSongsList.length > 0
      ? eventSongsList.map((s, idx) => `${idx + 1}. *${s.title}* (Tom: ${s.keySignature || 'N/D'}${s.bpm ? `, BPM: ${s.bpm}` : ''})`).join('\n')
      : '• Lista de músicas em definição no repertório';

    const formattedSchedule = (event.schedule && event.schedule.length > 0)
      ? event.schedule.map((sc) => `• ${sc.time} — ${sc.activity}`).join('\n')
      : '• Horário a confirmar';

    const techSheetText = `📋 *FICHA TÉCNICA DE SOM — ELLOS VOCAL*
📍 *Evento:* ${event.title} (${event.category})
📅 *Data:* ${formatDate(event.date)}${event.time ? ` às ${event.time}` : ''}
🏢 *Local:* ${event.location || 'A definir'}
🎤 *Microfones Necessários:* ${event.microphonesCount || 4} microfones sem fio (Soprano, Contralto, Tenor, Baixo)

🎵 *MÚSICAS & TONS:*
${formattedSongs}

🕒 *CRONOGRAMA DO DIA:*
${formattedSchedule}

👔 *UNIFORME / DRESS CODE:*
${event.dressCode || 'Social Padrão Ellos'}

--
_Gerado via Ellos Hub_`;

    navigator.clipboard.writeText(techSheetText);
    setCopiedTechSheet(true);
    setTimeout(() => setCopiedTechSheet(false), 3000);
  };

  const confirmedResponses = eventResponses.filter((r) => r.event_id === event.id && r.status === 'YES');

  return (
    <div className="group relative bg-white dark:bg-ellos-navy-surface border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xs hover:shadow-md hover:border-theme-primary/40 transition-all duration-200 overflow-hidden">
      {/* Layout em linha limpo */}
      <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Esquerda: Data & Hora */}
        <div className="shrink-0 flex md:flex-col items-center justify-center bg-ellos-light dark:bg-ellos-navy-sidebar p-3 rounded-xl min-w-[100px] border border-gray-200/60 dark:border-gray-800 text-center gap-1">
          <Calendar className="w-4 h-4 text-theme-primary" />
          <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">{formatDate(event.date)}</span>
          {event.time && event.time !== 'A definir' && (
            <span className="text-[11px] font-bold text-slate-500 dark:text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-theme-primary" />
              {event.time}
            </span>
          )}
        </div>

        {/* Centro: Título, Categoria, Local & Stack de Avatares */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-theme-primary bg-theme-primary/10 px-2 py-0.5 rounded border border-theme-primary/20">
              {event.category}
            </span>
            {event.dressCode && (
              <span className="text-[10px] font-medium text-slate-500 dark:text-gray-400 flex items-center gap-1">
                <Shirt className="w-3 h-3 text-theme-primary" /> {event.dressCode}
              </span>
            )}
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-theme-primary transition-colors truncate">
            {event.title}
          </h3>
          {event.location && (
            <p className="text-xs text-slate-600 dark:text-gray-300 flex items-center gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{event.location}</span>
            </p>
          )}

          {/* Avatares em Stack */}
          {confirmedResponses.length > 0 && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-800/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Confirmados:</span>
              <div className="flex -space-x-1.5 overflow-hidden">
                {confirmedResponses.slice(0, 5).map((resp, i) => (
                  <div
                    key={i}
                    title={`${resp.member_name} (${resp.voice})`}
                    className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-theme-primary text-slate-950 font-black text-[9px] ring-2 ring-white dark:ring-ellos-navy-surface"
                  >
                    {resp.member_name.charAt(0)}
                  </div>
                ))}
              </div>
              {confirmedResponses.length > 5 && (
                <span className="text-[10px] font-bold text-slate-400">+{confirmedResponses.length - 5}</span>
              )}
            </div>
          )}
        </div>

        {/* Direita: Status, Ações & Botões */}
        <div className="shrink-0 flex flex-col md:items-end justify-between gap-3 min-w-[160px] w-full md:w-auto">
          <div className="flex items-center justify-between md:justify-end gap-2 w-full">
            {getStatusBadge()}
            {/* Botões de Ação */}
            <div className="flex items-center gap-1">
              {onEditEvent && (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEditEvent(event); }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-theme-primary hover:bg-theme-primary/10 transition-colors cursor-pointer"
                  title="Editar Evento"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
              {onDeleteEvent && (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDeleteEvent(event.id); }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 transition-colors cursor-pointer"
                  title="Excluir Evento"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full justify-end">
            {/* Presença Button */}
            {event.status === 'PROPOSAL' && (
              <button
                disabled={event.isVotingClosed || isSubmitting}
                onClick={handleConfirmPresence}
                className={`py-1.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                  isSubmitting
                    ? 'opacity-60 bg-slate-400 text-slate-900'
                    : event.userVoted
                    ? 'bg-status-success text-white hover:brightness-110'
                    : 'bg-theme-primary text-slate-950 hover:opacity-80'
                }`}
              >
                {event.userVoted ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirmado</span>
                  </>
                ) : (
                  <>
                    <Vote className="w-3.5 h-3.5" />
                    <span>Confirmar</span>
                  </>
                )}
              </button>
            )}

            {/* Toggle Detalhes */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="py-1.5 px-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-gray-300 bg-gray-100 dark:bg-ellos-navy-sidebar hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Detalhes</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Painel Expansível de Detalhes (Sub-abas) */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-800 bg-ellos-light dark:bg-ellos-navy-sidebar p-5 space-y-4 animate-in fade-in duration-150">
          {/* Sub-Abas do Evento */}
          <div className="flex items-center gap-1 p-1 bg-gray-200/70 dark:bg-ellos-navy-surface rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveSubTab('info')}
              className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
                activeSubTab === 'info'
                  ? 'bg-white dark:bg-ellos-navy text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Geral & Votação</span>
            </button>
            <button
              onClick={() => setActiveSubTab('schedule')}
              className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
                activeSubTab === 'schedule'
                  ? 'bg-white dark:bg-ellos-navy text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Cronograma ({event.schedule?.length || 0})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('carpool')}
              className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
                activeSubTab === 'carpool'
                  ? 'bg-white dark:bg-ellos-navy text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Car className="w-3.5 h-3.5 text-theme-primary" />
              <span>Caronas ({localPassengers.length}/{totalCarSpots})</span>
            </button>
          </div>

          {/* TAB 1: GERAL & VOTAÇÃO */}
          {activeSubTab === 'info' && (
            <div className="space-y-3">
              {event.contactName && (
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-gray-300">
                  <User className="w-3.5 h-3.5 text-theme-primary shrink-0" />
                  <span>Contato: {event.contactName}</span>
                </div>
              )}
              {event.notes && (
                <p className="text-xs text-slate-500 dark:text-gray-400 italic">
                  &quot;{event.notes}&quot;
                </p>
              )}

              {event.status === 'PROPOSAL' && event.votesCount && (
                <div className="bg-white dark:bg-ellos-navy-surface rounded-xl p-3.5 border border-gray-200 dark:border-gray-800 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-800 dark:text-white">
                    <span className="flex items-center gap-1 text-theme-primary">
                      <Vote className="w-3.5 h-3.5" />
                      Confirmações
                    </span>
                    <span>{event.votesCount.yes} de {event.votesCount.total} ({votePercentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-theme-primary h-full rounded-full transition-all duration-300" style={{ width: `${votePercentage}%` }} />
                  </div>
                </div>
              )}

              {/* Botões Utilitários */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={handleCopyTechSheet}
                  className="py-2 px-3 rounded-xl text-xs font-bold bg-white dark:bg-ellos-navy-surface text-slate-800 dark:text-theme-primary border border-gray-200 dark:border-gray-800 hover:border-theme-primary transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5 text-theme-primary" />
                  <span>{copiedTechSheet ? 'Copiado!' : 'Copiar Ficha Técnica'}</span>
                </button>
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="py-2 px-3 rounded-xl text-xs font-bold bg-status-success/10 text-status-success border border-status-success/30 hover:bg-status-success/20 transition-all flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CRONOGRAMA */}
          {activeSubTab === 'schedule' && (
            <div className="bg-white dark:bg-ellos-navy-surface rounded-xl p-3.5 border border-gray-200 dark:border-gray-800 space-y-2">
              {event.schedule && event.schedule.length > 0 ? (
                <div className="relative pl-3 border-l-2 border-theme-primary space-y-2">
                  {event.schedule.map((sc, idx) => (
                    <div key={idx} className="relative text-xs">
                      <div className="absolute -left-[17px] top-1 w-2 h-2 rounded-full bg-theme-primary" />
                      <span className="font-mono font-bold text-theme-primary mr-2">{sc.time}</span>
                      <span className="text-slate-800 dark:text-white font-medium">{sc.activity}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Nenhum horário cadastrado.</p>
              )}
            </div>
          )}

          {/* TAB 3: CARONAS */}
          {activeSubTab === 'carpool' && (
            <div className="bg-white dark:bg-ellos-navy-surface rounded-xl p-3.5 border border-gray-200 dark:border-gray-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1">
                  <Car className="w-3.5 h-3.5 text-theme-primary" /> Motoristas
                </span>
                <span className="text-slate-500 dark:text-gray-400">{localPassengers.length} passageiros / {totalCarSpots} vagas</span>
              </div>
              {localDrivers.length > 0 ? (
                <div className="space-y-1 text-xs">
                  {localDrivers.map((drv, i) => (
                    <div key={i} className="flex justify-between p-2 bg-ellos-light dark:bg-ellos-navy-sidebar rounded-lg">
                      <span className="font-semibold text-slate-800 dark:text-white">{drv.name}</span>
                      <span className="text-slate-500 dark:text-gray-400">{drv.spots} vaga(s)</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Nenhum motorista registrado.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
