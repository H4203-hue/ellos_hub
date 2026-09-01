'use client';

import React, { useState } from 'react';
import { EventItem } from '@/types';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Plus, 
  Sparkles,
  ArrowRight
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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayNum, setSelectedDayNum] = useState<number | null>(new Date().getDate());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Nomes dos meses em PT-BR
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const daysOfWeekFull = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const daysOfWeekLetter = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  // Primeiro dia do mês e total de dias
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Navegação
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDayNum(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDayNum(null);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDayNum(today.getDate());
  };

  // Filtrar eventos por dia
  const getEventsForDay = (day: number) => {
    return events.filter((evt) => {
      if (!evt.date) return false;
      const parts = evt.date.split('-');
      if (parts.length !== 3) return false;
      const evtYear = parseInt(parts[0], 10);
      const evtMonth = parseInt(parts[1], 10) - 1;
      const evtDay = parseInt(parts[2], 10);
      return evtYear === year && evtMonth === month && evtDay === day;
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  };

  // Badge Status Info
  const getStatusBadge = (status: EventItem['status']) => {
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
          badgeStyle: 'bg-amber-500/10 text-amber-700 dark:text-theme-primary border-amber-500/30',
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

  // Eventos do dia selecionado
  const selectedEvents = selectedDayNum ? getEventsForDay(selectedDayNum) : [];

  return (
    <div className="bg-white dark:bg-[#1B365D] border border-slate-200/90 dark:border-theme-primary/20 rounded-3xl p-3.5 sm:p-6 shadow-xl space-y-4 font-sans transition-all">
      {/* Top Header do Calendário Mensal */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-200 dark:border-navy-800 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-2.5 rounded-2xl bg-theme-primary/10 border border-theme-primary/20 text-theme-primary shrink-0">
            <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white capitalize">
              {monthNames[month]} <span className="text-theme-primary">{year}</span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Visão Mensal Notion-Style • Selecione um dia para ver compromissos
            </p>
          </div>
        </div>

        {/* Botões de Ação e Navegação */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
          <button
            onClick={goToToday}
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-navy-950 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-navy-900 border border-slate-200 dark:border-navy-800 transition-all cursor-pointer"
          >
            Hoje
          </button>
          <button
            onClick={prevMonth}
            title="Mês Anterior"
            className="p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-navy-950 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-navy-900 border border-slate-200 dark:border-navy-800 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextMonth}
            title="Próximo Mês"
            className="p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-navy-950 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-navy-900 border border-slate-200 dark:border-navy-800 transition-all cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {canCreate && onOpenAddModal && (
            <button
              onClick={onOpenAddModal}
              className="ml-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-theme-primary text-slate-950 hover:opacity-80 shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Evento</span>
            </button>
          )}
        </div>
      </div>

      {/* Dias da Semana (Header Desktop & Mobile) */}
      <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-400 dark:text-theme-primary/80">
        {/* Desktop Header */}
        <div className="hidden md:contents">
          {daysOfWeekFull.map((day) => (
            <div key={day} className="py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Mobile Header (Letras Únicas D S T Q Q S S) */}
        <div className="contents md:hidden">
          {daysOfWeekLetter.map((letter, idx) => (
            <div key={`${letter}-${idx}`} className="py-1">
              {letter}
            </div>
          ))}
        </div>
      </div>

      {/* Grid de Dias do Mês */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {calendarCells.map((dayNum, index) => {
          if (dayNum === null) {
            return (
              <div
                key={`empty-${index}`}
                className="min-h-[55px] sm:min-h-[105px] rounded-2xl bg-slate-100/40 dark:bg-navy-950/20 border border-transparent"
              />
            );
          }

          const dayEvents = getEventsForDay(dayNum);
          const isSelected = selectedDayNum === dayNum;
          const activeToday = isToday(dayNum);

          return (
            <div
              key={`day-${dayNum}`}
              onClick={() => {
                setSelectedDayNum(dayNum);
                if (dayEvents.length > 0) {
                  onSelectEvent(dayEvents[0]);
                }
              }}
              className={`min-h-[55px] sm:min-h-[105px] rounded-2xl p-1.5 sm:p-2 border transition-all duration-200 flex flex-col justify-between cursor-pointer group ${
                isSelected
                  ? 'ring-2 ring-theme-primary border-theme-primary dark:bg-theme-primary/20'
                  : activeToday
                  ? 'bg-theme-primary/10 border-theme-primary/40 dark:bg-theme-primary/10'
                  : 'bg-slate-50 dark:bg-navy-950/60 border-slate-200/80 dark:border-navy-800 hover:border-theme-primary/40'
              }`}
            >
              {/* Número do Dia */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-black px-1.5 sm:px-2 py-0.5 rounded-lg ${
                    activeToday
                      ? 'bg-theme-primary text-slate-950 font-black shadow-xs'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {dayNum}
                </span>

                {dayEvents.length > 0 && (
                  <span className="hidden sm:inline-block text-[10px] font-bold text-theme-primary">
                    {dayEvents.length} {dayEvents.length === 1 ? 'evento' : 'evs'}
                  </span>
                )}
              </div>

              {/* 🟢 MOBILE MODE: Pontos Indicadores Coloridos (Dots) */}
              {dayEvents.length > 0 && (
                <div className="flex sm:hidden items-center justify-center gap-1 pt-1">
                  {dayEvents.slice(0, 3).map((evt) => {
                    const statusInfo = getStatusBadge(evt.status);
                    return (
                      <span
                        key={evt.id}
                        className={`w-2 h-2 rounded-full ${statusInfo.dotColor}`}
                      />
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <span className="text-[8px] font-black text-theme-primary">+</span>
                  )}
                </div>
              )}

              {/* 🖥️ DESKTOP MODE: Badges de Eventos Retangulares */}
              <div className="hidden sm:block space-y-1 mt-1 flex-1 overflow-y-auto no-scrollbar">
                {dayEvents.map((evt) => {
                  const statusInfo = getStatusBadge(evt.status);
                  return (
                    <div
                      key={evt.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(evt);
                      }}
                      className={`p-1.5 rounded-xl border text-[10px] font-semibold tracking-tight transition-all duration-200 ${statusInfo.badgeStyle} hover:scale-[1.02] shadow-xs cursor-pointer truncate`}
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

      {/* 📱 DETALHES DO DIA SELECIONADO (Cards Expansíveis Notion-Style) */}
      {selectedDayNum && (
        <div className="pt-3 border-t border-slate-200 dark:border-navy-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-theme-primary flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-theme-primary" />
              <span>Agenda para {selectedDayNum} de {monthNames[month]}:</span>
            </span>
            <span className="text-[10px] font-extrabold text-slate-400">
              {selectedEvents.length} {selectedEvents.length === 1 ? 'compromisso' : 'compromissos'}
            </span>
          </div>

          {selectedEvents.length === 0 ? (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-950/40 border border-slate-200 dark:border-navy-800/80 text-center text-xs text-slate-400">
              Nenhum evento agendado para este dia.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {selectedEvents.map((evt) => {
                const statusInfo = getStatusBadge(evt.status);
                return (
                  <div
                    key={evt.id}
                    onClick={() => onSelectEvent(evt)}
                    className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-navy-950/80 border border-slate-200 dark:border-theme-primary/20 hover:border-theme-primary/40 transition-all cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${statusInfo.badgeStyle}`}>
                        {statusInfo.label}
                      </span>
                      {evt.time && (
                        <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-theme-primary" />
                          <span>{evt.time}</span>
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-theme-primary transition-colors">
                      {evt.title}
                    </h4>

                    {evt.location && (
                      <p className="text-xs text-slate-500 dark:text-slate-300 flex items-center gap-1 truncate">
                        <MapPin className="w-3.5 h-3.5 text-theme-primary shrink-0" />
                        <span className="truncate">{evt.location}</span>
                      </p>
                    )}

                    <div className="pt-1.5 border-t border-slate-200 dark:border-navy-800 flex items-center justify-between text-[11px] font-bold text-theme-primary">
                      <span>Abrir Ficha Completa (Notion)</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
