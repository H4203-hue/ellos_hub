'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTenant } from '@/context/TenantContext';
import { EventItem } from '@/types';
import { mockEvents } from '@/data/mockData';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { formatDateBR } from '@/lib/dateUtils';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  Music, 
  MessageSquare, 
  CheckCircle2, 
  ExternalLink,
  ChevronRight,
  Send
} from 'lucide-react';

export default function GuestDashboardPage() {
  const { tenant } = useTenant();
  const [events, setEvents] = useState<EventItem[]>(mockEvents);
  const [activeFilter, setActiveFilter] = useState<'CONFIRMED' | 'ALL'>('CONFIRMED');

  useEffect(() => {
    const loadEvents = async () => {
      if (supabase && isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('events')
            .select('*')
            .order('date', { ascending: true });

          if (!error && data && data.length > 0) {
            setEvents(
              data.map((row) => ({
                id: row.id,
                title: row.title,
                category: row.category,
                status: row.status,
                date: row.date || undefined,
                time: row.time || undefined,
                location: row.location || undefined,
                notes: row.notes || undefined,
              }))
            );
          }
        } catch (err) {
          console.warn('Erro ao carregar eventos para convidados:', err);
        }
      }
    };

    loadEvents();
  }, []);

  const confirmedEvents = events.filter((e) => e.status === 'CONFIRMED' && e.date);
  const displayEvents = activeFilter === 'CONFIRMED' ? confirmedEvents : events.filter((e) => e.date);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. HERO BANNER / MURAL DE BOAS-VINDAS */}
      <section className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-gray-800 p-6 sm:p-8 shadow-sm">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-theme-primary/10 text-theme-primary border border-theme-primary/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Painel do Visitante &amp; Organizador</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Bem-vindo ao portal oficial do{' '}
            <span className="text-theme-primary">{tenant.name}</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            {tenant.tagline || 'Acompanhe nossa agenda pública de apresentações e solicite convites para sua igreja ou evento.'}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href="/convite"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-theme-primary text-slate-950 hover:brightness-110 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <span>Solicitar Apresentação</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="#agenda"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-gray-700 transition-all cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-theme-primary" />
              <span>Ver Agenda Pública</span>
            </a>
          </div>
        </div>

        {/* Círculo Decorativo com a cor do tema */}
        <div 
          className="absolute -right-16 -top-16 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ backgroundColor: tenant.primaryColor || '#D4AF37' }}
        />
      </section>

      {/* 2. MURAL DE AVISOS & COMUNICADOS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-gray-800 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-theme-primary/10 text-theme-primary flex items-center justify-center font-bold">
            <Calendar className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Agendamento Aberto</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            A agenda para o próximo semestre está aberta para convites e participações especiais.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-gray-800 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Confirmações em Tempo Real</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Todas as datas exibidas na agenda abaixo já foram confirmadas com os organizadores locais.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-gray-800 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
            <MessageSquare className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Dúvidas &amp; Logística</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Entre em contato com nossa equipe de regência para obter detalhes de som e repertório.
          </p>
        </div>
      </section>

      {/* 3. AGENDA PÚBLICA DE APRESENTAÇÕES */}
      <section id="agenda" className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-gray-800 pb-3">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-theme-primary" />
              <span>Agenda de Apresentações</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Próximos compromissos e cultos confirmados de {tenant.name}
            </p>
          </div>

          <div className="flex items-center p-1 bg-slate-100 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700/60">
            <button
              onClick={() => setActiveFilter('CONFIRMED')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'CONFIRMED'
                  ? 'bg-theme-primary text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Confirmados ({confirmedEvents.length})
            </button>
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'ALL'
                  ? 'bg-theme-primary text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Todos
            </button>
          </div>
        </div>

        {displayEvents.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-gray-800 rounded-2xl">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Nenhuma apresentação agendada no momento.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayEvents.map((evt) => (
              <div
                key={evt.id}
                className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-gray-800 hover:border-theme-primary/40 rounded-2xl p-5 shadow-xs transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-status-confirmed/10 text-status-confirmed border border-status-confirmed/20">
                      {evt.category || 'Apresentação'}
                    </span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-theme-primary" />
                      <span>{evt.time || 'Horário a definir'}</span>
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {evt.title}
                  </h3>

                  {evt.location && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-theme-primary shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{evt.location}</span>
                    </p>
                  )}

                  {evt.notes && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic line-clamp-2">
                      &ldquo;{evt.notes}&rdquo;
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-gray-800/80 flex items-center justify-between text-xs">
                  <span className="font-bold text-theme-primary">
                    📅 {formatDateBR(evt.date)}
                  </span>

                  {evt.location && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(evt.location)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
                    >
                      <span>Ver Mapa</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. CALL TO ACTION FINAL */}
      <section className="bg-gradient-to-br from-slate-900 to-[#0F172A] border border-gray-800 rounded-3xl p-6 sm:p-8 text-white space-y-4 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
        <div className="space-y-1 max-w-xl">
          <h3 className="text-lg sm:text-xl font-black">
            Deseja levar o {tenant.name} para sua igreja ou evento?
          </h3>
          <p className="text-xs sm:text-sm text-gray-400">
            Envie sua proposta com data, local e horário para análise de disponibilidade da equipe.
          </p>
        </div>

        <Link
          href="/convite"
          className="px-5 py-3 rounded-xl text-xs sm:text-sm font-black bg-theme-primary text-slate-950 hover:brightness-110 shadow-xs transition-all active:scale-95 shrink-0 inline-flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          <span>Preencher Formulário de Convite</span>
        </Link>
      </section>
    </div>
  );
}
