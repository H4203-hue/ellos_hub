'use client';

import React from 'react';
import { EventItem } from '@/types';
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
  Building2
} from 'lucide-react';

interface EventCardProps {
  event: EventItem;
  onToggleVote?: (eventId: string) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onToggleVote }) => {
  const getStatusBadge = () => {
    switch (event.status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Confirmado
          </span>
        );
      case 'PROPOSAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
            <Vote className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            Em Votação
          </span>
        );
      case 'INTERNAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
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

  return (
    <div className="group relative flex flex-col justify-between bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all">
      <div>
        {/* Header: Title and Status */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1 block">
              {event.category}
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {event.title}
            </h3>
          </div>
          {getStatusBadge()}
        </div>

        {/* Event Details */}
        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300 my-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{formatDate(event.date)}</span>
            {event.time && event.time !== 'A definir' && (
              <>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{event.time}</span>
              </>
            )}
          </div>

          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}

          {event.contactName && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{event.contactName}</span>
            </div>
          )}

          {event.notes && (
            <p className="text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 italic">
              &quot;{event.notes}&quot;
            </p>
          )}
        </div>
      </div>

      {/* Voting & Action Footer */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
        {/* Voting section if PROPOSAL */}
        {event.status === 'PROPOSAL' && event.votesCount && (
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-3">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-amber-500" />
                Confirmação de Presença
              </span>
              <span>
                {event.votesCount.yes} de {event.votesCount.total} confirmados ({votePercentage}%)
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mb-2.5">
              <div 
                className="bg-amber-500 h-full rounded-full transition-all duration-300" 
                style={{ width: `${votePercentage}%` }}
              />
            </div>

            {/* Toggle button */}
            <button
              onClick={() => onToggleVote && onToggleVote(event.id)}
              className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                event.userVoted
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                  : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
              }`}
            >
              {event.userVoted ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Presença Confirmada! (Clique p/ alterar)</span>
                </>
              ) : (
                <>
                  <Vote className="w-4 h-4 text-amber-500" />
                  <span>Posso ir! (Confirmar Presença)</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* WhatsApp Button */}
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 rounded-lg border border-emerald-200/80 dark:border-emerald-800/60 transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Falar no WhatsApp ({event.contactPhone})</span>
          </a>
        )}
      </div>
    </div>
  );
};
