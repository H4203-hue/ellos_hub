'use client';

import React, { useState } from 'react';
import { EventItem } from '@/types';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  HelpCircle, 
  Sparkles,
  Plus
} from 'lucide-react';

interface MonthlyCalendarViewProps {
  events: EventItem[];
  onSelectEvent: (event: EventItem) => void;
  onOpenAddModal?: () => void;
  canCreate?: boolean;
}

export const MonthlyCalendarView: React.FC<MonthlyCalendarViewProps> = ({
  events,
  onSelectEvent,
  onOpenAddModal,
  canCreate,
}) => {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Primeiro dia do mês e total de dias
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Parse strings de data "YYYY-MM-DD"
  const getEventsForDay = (dayNumber: number) => {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(dayNumber).padStart(2, '0');
    const targetDateStr = `${year}-${formattedMonth}-${formattedDay}`;

    return events.filter((evt) => {
      if (!evt.date) return false;
      return evt.date === targetDateStr;
    });
  };

  const isToday = (dayNumber: number) => {
    const today = new Date();
    return (
      today.getDate() === dayNumber &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return {
          label: 'Confirmado',
          dotColor: 'bg-emerald-500',
          badgeStyle: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
        };
      case 'PROPOSAL':
        return {
          label: 'Em Votação',
          dotColor: 'bg-amber-500',
          badgeStyle: 'bg-amber-500/10 text-amber-700 dark:text-gold-300 border-amber-500/30',
        };
      default:
        return {
          label: 'Interno',
          dotColor: 'bg-blue-500',
          badgeStyle: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
        };
    }
  };

  // Construir matriz de células
  const calendarCells = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  return (
    <div className="bg-white dark:bg-[#1B365D] border border-slate-200/90 dark:border-amber-500/20 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4 font-sans transition-all">
      {/* Top Header do Calendário Mensal */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 dark:border-navy-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gold-500/10 border border-gold-500/20 text-gold-500">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white capitalize">
              {monthNames[month]} <span className="text-gold-500">{year}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Visão Mensal Notion-Style • Clique em qualquer dia para abrir a Ficha Completa
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-navy-950 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-navy-900 border border-slate-200 dark:border-navy-800 transition-all cursor-pointer"
          >
            Hoje
          </button>
          <button
            onClick={prevMonth}
            title="Mês Anterior"
            className="p-2 rounded-xl bg-slate-100 dark:bg-navy-950 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-navy-900 border border-slate-200 dark:border-navy-800 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextMonth}
            title="Próximo Mês"
            className="p-2 rounded-xl bg-slate-100 dark:bg-navy-950 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-navy-900 border border-slate-200 dark:border-navy-800 transition-all cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {canCreate && onOpenAddModal && (
            <button
              onClick={onOpenAddModal}
              className="ml-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-slate-950 hover:brightness-110 shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Evento</span>
            </button>
          )}
        </div>
      </div>

      {/* Dias da Semana (Header) */}
      <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] uppercase tracking-wider text-slate-400 dark:text-gold-400/80">
        {daysOfWeek.map((day) => (
          <div key={day} className="py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Grade do Calendário */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {calendarCells.map((dayNum, idx) => {
          if (dayNum === null) {
            return (
              <div
                key={`empty-${idx}`}
                className="min-h-[90px] sm:min-h-[110px] rounded-2xl bg-slate-50/40 dark:bg-navy-950/20 border border-transparent"
              />
            );
          }

          const dayEvents = getEventsForDay(dayNum);
          const activeToday = isToday(dayNum);

          return (
            <div
              key={`day-${dayNum}`}
              className={`min-h-[90px] sm:min-h-[110px] rounded-2xl p-1.5 sm:p-2 border transition-all duration-200 flex flex-col justify-between group ${
                dayEvents.length > 0 ? 'cursor-pointer hover:border-amber-500/40 hover:shadow-lg hover:-translate-y-0.5' : 'cursor-default'
              } ${
                activeToday
                  ? 'bg-gold-500/10 border-gold-500/40 dark:bg-gold-500/10'
                  : 'bg-slate-50 dark:bg-navy-950/60 border-slate-200/80 dark:border-navy-800'
              }`}
              onClick={() => {
                if (dayEvents.length > 0) {
                  onSelectEvent(dayEvents[0]);
                }
              }}
            >
              {/* Número do Dia */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                    activeToday
                      ? 'bg-gold-500 text-slate-950 font-black shadow-xs'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {dayNum}
                </span>

                {dayEvents.length > 0 && (
                  <span className="text-[10px] font-bold text-amber-500 dark:text-gold-400 opacity-80 group-hover:opacity-100">
                    {dayEvents.length} {dayEvents.length === 1 ? 'evento' : 'eventos'}
                  </span>
                )}
              </div>

              {/* Badges de Eventos Compactos */}
              <div className="space-y-1 mt-1 flex-1 overflow-y-auto no-scrollbar">
                {dayEvents.map((evt) => {
                  const statusInfo = getStatusBadge(evt.status);
                  return (
                    <div
                      key={evt.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(evt);
                      }}
                      className={`p-1 sm:p-1.5 rounded-xl border text-[10px] font-semibold tracking-tight transition-all duration-200 ${statusInfo.badgeStyle} hover:scale-[1.02] shadow-xs cursor-pointer truncate`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${statusInfo.dotColor}`} />
                        <span className="truncate font-bold text-slate-900 dark:text-white">
                          {evt.title}
                        </span>
                      </div>
                      {evt.time && (
                        <span className="block text-[9px] text-slate-500 dark:text-slate-300 font-normal pl-3 mt-0.5">
                          ⏰ {evt.time}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
