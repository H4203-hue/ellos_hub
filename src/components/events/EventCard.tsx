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
  Trash2
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
  onToggleVote?: (eventId: string, member?: GroupMember | null) => void;
  onEditEvent?: (event: EventItem) => void;
  onDeleteEvent?: (eventId: string) => void;
  eventResponses?: EventResponseRow[];
}

export const EventCard: React.FC<EventCardProps> = ({ 
  event, 
  songs = [], 
  currentMember,
  onToggleVote, 
  onEditEvent, 
  onDeleteEvent,
  eventResponses = []
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'schedule' | 'carpool'>('info');
  const [copiedTechSheet, setCopiedTechSheet] = useState(false);

  // Carpool local state management for quick interaction
  const [localDrivers, setLocalDrivers] = useState(event.drivers || []);
  const [localPassengers, setLocalPassengers] = useState(event.passengers || []);
  const [showAddCarModal, setShowAddCarModal] = useState(false);
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverSpots, setNewDriverSpots] = useState(4);

  const getStatusBadge = () => {
    switch (event.status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Confirmado
          </span>
        );
      case 'PROPOSAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30">
            <Vote className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400" />
            Em Votação
          </span>
        );
      case 'INTERNAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-navy-500/10 text-navy-800 dark:text-navy-300 border border-navy-500/30 dark:border-navy-400/30">
            <Sparkles className="w-3.5 h-3.5 text-navy-600 dark:text-navy-400" />
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
    if (!dateStr || dateStr === 'A definir') return 'Data a definir';
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

  // Resolve event songs from repertoire
  const eventSongsList = (event.songIds || [])
    .map((id) => songs.find((s) => s.id === id))
    .filter(Boolean) as SongItem[];

  // Total carpool capacity
  const totalCarSpots = localDrivers.reduce((acc, d) => acc + d.spots, 0);

  const handleAddDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriverName.trim()) return;
    setLocalDrivers((prev) => [...prev, { name: newDriverName.trim(), spots: Number(newDriverSpots) }]);
    setNewDriverName('');
    setShowAddCarModal(false);
  };

  const handleCopyTechSheet = () => {
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

  return (
    <div className="group relative flex flex-col justify-between bg-white dark:bg-[#1B365D] border border-slate-200/90 dark:border-amber-500/20 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-navy-600/30 dark:hover:border-gold-500/40 transition-all duration-200">
      {/* Botões no Canto Superior Direito (Editar & Excluir) */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1">
        {onEditEvent && (
          <button
            onClick={() => onEditEvent(event)}
            title="Editar Evento"
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 transition-colors cursor-pointer"
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}
        {onDeleteEvent && (
          <button
            onClick={() => {
              if (window.confirm(`Tem certeza que deseja excluir o evento "${event.title}"?`)) {
                onDeleteEvent(event.id);
              }
            }}
            title="Excluir Evento"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div>
        {/* Topo: Categoria + Status Badge */}
        <div className="flex items-start justify-between gap-3 mb-3 pr-16">
          <div className="flex-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-navy-700 dark:text-[#E5C378] block mb-0.5">
              {event.category}
            </span>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-navy-800 dark:group-hover:text-gold-300 transition-colors">
              {event.title}
            </h3>
          </div>
          <div className="shrink-0">
            {getStatusBadge()}
          </div>
        </div>

        {/* Dress Code Badge */}
        {event.dressCode && (
          <div className="mb-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-900 dark:bg-amber-500/15 dark:text-[#E5C378] border border-amber-500/20 dark:border-amber-500/30">
            <Shirt className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400 shrink-0" />
            <span>Traje: {event.dressCode}</span>
          </div>
        )}

        {/* Corpo: Detalhes do Evento */}
        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-200 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-400 shrink-0" />
            <span className="font-medium">{formatDate(event.date)}</span>
            {event.time && event.time !== 'A definir' && (
              <>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <Clock className="w-4 h-4 text-slate-400 dark:text-slate-400 shrink-0" />
                <span className="font-medium">{event.time}</span>
              </>
            )}
          </div>

          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-400 shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}

          {event.contactName && (
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-300">
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Contato: {event.contactName}</span>
            </div>
          )}

          {event.notes && (
            <p className="text-xs text-slate-500 dark:text-slate-300/90 pt-2 border-t border-slate-100 dark:border-navy-800/80 italic">
              &quot;{event.notes}&quot;
            </p>
          )}
        </div>

        {/* Sub-Abas do Evento: Geral, Cronograma, Caronas */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-navy-950/60 rounded-xl mb-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'info'
                ? 'bg-white dark:bg-navy-800 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Geral</span>
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'schedule'
                ? 'bg-white dark:bg-navy-800 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Cronograma ({event.schedule?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('carpool')}
            className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'carpool'
                ? 'bg-white dark:bg-navy-800 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Car className="w-3.5 h-3.5 text-gold-500" />
            <span>Caronas ({localPassengers.length}/{totalCarSpots})</span>
          </button>
        </div>

        {/* TAB 1: GERAL (Votação & Termômetro de Disponibilidade) */}
        {activeTab === 'info' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            {event.status === 'PROPOSAL' && event.votesCount && (
              <div className="bg-slate-50 dark:bg-navy-950/60 rounded-xl p-3.5 border border-slate-200/60 dark:border-amber-500/10">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  <span className="flex items-center gap-1 text-gold-600 dark:text-gold-400">
                    <Vote className="w-3.5 h-3.5" />
                    Confirmação de Presença
                  </span>
                  <span>
                    {event.votesCount.yes} de {event.votesCount.total} ({votePercentage}%)
                  </span>
                </div>

                {hasFullQuorum && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 mb-2 rounded text-[11px] font-bold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                    Formação Completa ({event.votesCount.yes}/{event.votesCount.total})
                  </span>
                )}

                {/* Barra de Progresso */}
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mb-2.5">
                  <div
                    className="bg-gradient-to-r from-gold-500 to-gold-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${votePercentage}%` }}
                  />
                </div>

                {/* Respostas registradas por integrantes */}
                {eventResponses && eventResponses.filter((r) => r.event_id === event.id).length > 0 && (
                  <div className="my-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 space-y-1.5 text-xs">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                      Presenças Confirmadas ({eventResponses.filter((r) => r.event_id === event.id).length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {eventResponses
                        .filter((r) => r.event_id === event.id)
                        .map((resp, idx) => (
                          <span
                            key={idx}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                              resp.status === 'YES'
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30'
                            }`}
                          >
                            <span className="font-semibold">{resp.member_name}</span>
                            <span className="opacity-75">({resp.voice})</span>
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                {/* Voting Deadline & Closed Warning */}
                {event.votingDeadline && (
                  <div className="mb-2 text-[11px] font-semibold text-slate-500 dark:text-gold-300 flex items-center justify-between">
                    <span>⏰ Prazo Limite: {event.votingDeadline}</span>
                    {event.isVotingClosed && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        Votações Encerradas (Regência)
                      </span>
                    )}
                  </div>
                )}

                {/* Botão Votar / Confirmar */}
                <button
                  disabled={event.isVotingClosed}
                  onClick={() => onToggleVote && onToggleVote(event.id, currentMember)}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    event.userVoted
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                      : 'bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-slate-950 font-semibold shadow-xs hover:brightness-110'
                  }`}
                >
                  {event.isVotingClosed ? (
                    <span>Votação Encerrada pela Regência</span>
                  ) : event.userVoted ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>
                        Presença Confirmada {currentMember ? `(${currentMember.name})` : ''}! (Alterar)
                      </span>
                    </>
                  ) : (
                    <>
                      <Vote className="w-4 h-4" />
                      <span>
                        Posso ir! {currentMember ? `(Votar como ${currentMember.name})` : '(Confirmar Presença)'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CRONOGRAMA DO DIA */}
        {activeTab === 'schedule' && (
          <div className="bg-slate-50 dark:bg-navy-950/60 rounded-xl p-3.5 border border-slate-200/60 dark:border-amber-500/10 space-y-2.5 animate-in fade-in duration-150">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-[#E5C378] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-navy-600 dark:text-gold-400" />
              Cronograma do Dia
            </h4>

            {event.schedule && event.schedule.length > 0 ? (
              <div className="relative pl-3 border-l-2 border-gold-500/40 space-y-2.5 my-1">
                {event.schedule.map((sc, idx) => (
                  <div key={idx} className="relative text-xs">
                    <div className="absolute -left-[17px] top-1 w-2 h-2 rounded-full bg-gold-500" />
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono font-bold text-navy-800 dark:text-gold-300">
                        {sc.time}
                      </span>
                      <span className="text-slate-700 dark:text-slate-200 font-medium">
                        {sc.activity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Nenhum horário cadastrado para este evento.</p>
            )}
          </div>
        )}

        {/* TAB 3: LOGÍSTICA DE CARONAS */}
        {activeTab === 'carpool' && (
          <div className="bg-slate-50 dark:bg-navy-950/60 rounded-xl p-3.5 border border-slate-200/60 dark:border-amber-500/10 space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-[#E5C378] flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-gold-500" />
                Motoristas & Vagas
              </h4>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-300">
                {localPassengers.length} passageiro(s) / {totalCarSpots} vaga(s)
              </span>
            </div>

            {localDrivers.length > 0 ? (
              <div className="space-y-1.5">
                {localDrivers.map((drv, i) => (
                  <div key={i} className="flex items-center justify-between bg-white dark:bg-navy-900/80 px-2.5 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-700/50 text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-navy-600 dark:text-gold-400" />
                      {drv.name}
                    </span>
                    <span className="text-slate-500 dark:text-slate-300 font-medium">
                      {drv.spots} vaga(s) disponível(is)
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Nenhum motorista cadastrado ainda.</p>
            )}

            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                Passageiros na Carona:
              </span>
              {localPassengers.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {localPassengers.map((psg, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-200 dark:bg-navy-800 text-slate-700 dark:text-slate-200">
                      {psg}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Nenhum passageiro registrado.</p>
              )}
            </div>

            {showAddCarModal ? (
              <form onSubmit={handleAddDriver} className="p-2.5 bg-white dark:bg-navy-900 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <input
                  type="text"
                  placeholder="Nome do Motorista"
                  value={newDriverName}
                  onChange={(e) => setNewDriverName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-white"
                  required
                />
                <div className="flex items-center gap-2">
                  <label className="text-slate-600 dark:text-slate-300">Vagas:</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={newDriverSpots}
                    onChange={(e) => setNewDriverSpots(Number(e.target.value))}
                    className="w-16 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-white"
                  />
                  <div className="ml-auto flex gap-1">
                    <button
                      type="button"
                      onClick={() => setShowAddCarModal(false)}
                      className="px-2 py-1 rounded text-slate-500 hover:text-slate-700 dark:text-slate-400 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-2.5 py-1 rounded bg-gold-500 text-slate-950 font-bold hover:bg-gold-400 cursor-pointer"
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowAddCarModal(true)}
                className="w-full py-1.5 text-xs font-semibold text-navy-800 dark:text-gold-300 bg-white dark:bg-navy-900 border border-slate-200 dark:border-gold-500/20 hover:border-gold-500/50 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Car className="w-3.5 h-3.5" />
                <span>Oferecer Carona (Adicionar Carro)</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Rodapé: Ficha Técnica para Sonoplastia & WhatsApp */}
      <div className="pt-3 mt-4 border-t border-slate-100 dark:border-navy-800/80 flex flex-col gap-2">
        <button
          onClick={handleCopyTechSheet}
          className={`w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer ${
            copiedTechSheet
              ? 'bg-emerald-600 text-white shadow-emerald-600/20'
              : 'bg-slate-100 hover:bg-slate-200 dark:bg-navy-950/80 dark:hover:bg-navy-800 text-navy-900 dark:text-[#E5C378] border border-slate-200/90 dark:border-gold-500/30'
          }`}
        >
          {copiedTechSheet ? (
            <>
              <Check className="w-4 h-4 text-white" />
              <span>Ficha Copiada para WhatsApp! 📋</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 text-gold-500" />
              <span>Copiar Ficha para Sonoplastia</span>
              <Copy className="w-3.5 h-3.5 opacity-60 ml-auto" />
            </>
          )}
        </button>

        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Falar no WhatsApp ({event.contactPhone})</span>
          </a>
        )}
      </div>
    </div>
  );
};
