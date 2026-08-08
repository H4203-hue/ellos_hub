'use client';

import React, { useState } from 'react';
import { mockEvents, mockSongs, mockTasks } from '@/data/mockData';
import { EventItem, SongItem, TaskItem } from '@/types';
import { Navbar } from '@/components/layout/Navbar';
import { EventCard } from '@/components/events/EventCard';
import { SongListItem } from '@/components/songs/SongListItem';
import { TasksSection } from '@/components/tasks/TasksSection';
import { AddItemModal } from '@/components/common/AddItemModal';
import { 
  Calendar, 
  Vote, 
  Search, 
  Filter, 
  CheckCircle2, 
  Music, 
  ListTodo,
  Sparkles,
  ChevronRight,
  MapPin,
  Clock,
  Layers
} from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'agenda' | 'repertoire' | 'tasks'>('agenda');
  const [events, setEvents] = useState<EventItem[]>(mockEvents);
  const [songs, setSongs] = useState<SongItem[]>(mockSongs);
  const [tasks, setTasks] = useState<TaskItem[]>(mockTasks);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Agenda Filter State
  const [agendaFilter, setAgendaFilter] = useState<'ALL' | 'CONFIRMED' | 'PROPOSAL' | 'INTERNAL'>('ALL');

  // Repertoire Filter & Search State
  const [songSearch, setSongSearch] = useState('');
  const [songStatusFilter, setSongStatusFilter] = useState<'ALL' | 'READY' | 'REHEARSING' | 'TO_LEARN'>('ALL');

  // Handlers for state updates
  const handleToggleVote = (eventId: string) => {
    setEvents((prev) =>
      prev.map((evt) => {
        if (evt.id === eventId && evt.votesCount) {
          const isCurrentlyVoted = !!evt.userVoted;
          const newYesCount = isCurrentlyVoted
            ? evt.votesCount.yes - 1
            : evt.votesCount.yes + 1;
          return {
            ...evt,
            userVoted: !isCurrentlyVoted,
            votesCount: {
              ...evt.votesCount,
              yes: Math.max(0, newYesCount),
            },
          };
        }
        return evt;
      })
    );
  };

  const handleToggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, isDone: !t.isDone } : t))
    );
  };

  const handleAddEvent = (newEvent: EventItem) => {
    setEvents((prev) => [newEvent, ...prev]);
  };

  const handleAddSong = (newSong: SongItem) => {
    setSongs((prev) => [newSong, ...prev]);
  };

  const handleAddTask = (newTask: TaskItem) => {
    setTasks((prev) => [newTask, ...prev]);
  };

  // Computations for Top Summary Banner
  const nextConfirmedEvent = events.find((e) => e.status === 'CONFIRMED');
  const pendingProposalsCount = events.filter((e) => e.status === 'PROPOSAL').length;
  const completedTasksCount = tasks.filter((t) => t.isDone).length;

  // Filtered Events
  const filteredEvents = events.filter((evt) => {
    if (agendaFilter === 'ALL') return true;
    return evt.status === agendaFilter;
  });

  // Filtered Songs
  const filteredSongs = songs.filter((song) => {
    const matchesSearch =
      song.title.toLowerCase().includes(songSearch.toLowerCase()) ||
      song.tags.some((tag) => tag.toLowerCase().includes(songSearch.toLowerCase())) ||
      (song.keySignature && song.keySignature.toLowerCase().includes(songSearch.toLowerCase()));

    const matchesStatus =
      songStatusFilter === 'ALL' ? true : song.status === songStatusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Top Summary Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Next Confirmed Event */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-5 shadow-lg shadow-emerald-500/10 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute right-[-10px] bottom-[-10px] opacity-15 text-white pointer-events-none transition-transform group-hover:scale-110">
              <Calendar className="w-32 h-32" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-emerald-50">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Próximo Compromisso
                </span>
                {nextConfirmedEvent && (
                  <span className="text-xs font-semibold bg-emerald-700/60 px-2 py-0.5 rounded text-emerald-100">
                    Confirmado
                  </span>
                )}
              </div>

              {nextConfirmedEvent ? (
                <div className="space-y-1">
                  <h3 className="text-xl font-extrabold tracking-tight">
                    {nextConfirmedEvent.title}
                  </h3>
                  <p className="text-xs text-emerald-100 flex items-center gap-2">
                    <span>📅 {nextConfirmedEvent.date}</span>
                    <span>•</span>
                    <span>⏰ {nextConfirmedEvent.time}</span>
                  </p>
                  <p className="text-xs text-emerald-100/90 truncate mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{nextConfirmedEvent.location}</span>
                  </p>
                </div>
              ) : (
                <p className="text-sm text-emerald-100">Nenhum evento confirmado cadastrado.</p>
              )}
            </div>

            <button
              onClick={() => {
                setActiveTab('agenda');
                setAgendaFilter('CONFIRMED');
              }}
              className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-white hover:underline pt-2 border-t border-white/20"
            >
              <span>Ver agenda completa</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: Proposals Pending Vote Alert */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl p-5 shadow-lg shadow-amber-500/10 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute right-[-10px] bottom-[-10px] opacity-15 text-white pointer-events-none transition-transform group-hover:scale-110">
              <Vote className="w-32 h-32" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-amber-50">
                  <Vote className="w-3.5 h-3.5" />
                  Votação de Convites
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black">{pendingProposalsCount}</span>
                  <span className="text-sm font-medium text-amber-100">convites em análise</span>
                </div>
                <p className="text-xs text-amber-100">
                  Aguardando confirmação de presença dos integrantes do Ellos.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setActiveTab('agenda');
                setAgendaFilter('PROPOSAL');
              }}
              className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-white hover:underline pt-2 border-t border-white/20"
            >
              <span>Votar nos convites</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 3: Quick Task Overview */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-2xl p-5 shadow-lg shadow-indigo-500/10 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute right-[-10px] bottom-[-10px] opacity-15 text-white pointer-events-none transition-transform group-hover:scale-110">
              <ListTodo className="w-32 h-32" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-indigo-50">
                  <Sparkles className="w-3.5 h-3.5" />
                  Painel de Tarefas
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black">{completedTasksCount} / {tasks.length}</span>
                  <span className="text-sm font-medium text-indigo-100">tarefas concluídas</span>
                </div>
                <p className="text-xs text-indigo-100">
                  Divulgações, ensaios, confras e contatos logísticos.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('tasks')}
              className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-white hover:underline pt-2 border-t border-white/20"
            >
              <span>Gerenciar tarefas</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

        {/* TAB CONTENT SECTIONS */}

        {/* TAB 1: AGENDA & CONVITES */}
        {activeTab === 'agenda' && (
          <section className="space-y-5 animate-in fade-in duration-200">
            {/* Filter Sub-bar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Agenda de Apresentações & Convites
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setAgendaFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    agendaFilter === 'ALL'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Todos ({events.length})
                </button>
                <button
                  onClick={() => setAgendaFilter('CONFIRMED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    agendaFilter === 'CONFIRMED'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Confirmados ({events.filter((e) => e.status === 'CONFIRMED').length})
                </button>
                <button
                  onClick={() => setAgendaFilter('PROPOSAL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    agendaFilter === 'PROPOSAL'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Em Votação ({events.filter((e) => e.status === 'PROPOSAL').length})
                </button>
                <button
                  onClick={() => setAgendaFilter('INTERNAL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    agendaFilter === 'INTERNAL'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Internos ({events.filter((e) => e.status === 'INTERNAL').length})
                </button>
              </div>
            </div>

            {/* Grid of Events */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredEvents.map((evt) => (
                <EventCard
                  key={evt.id}
                  event={evt}
                  onToggleVote={handleToggleVote}
                />
              ))}
            </div>
          </section>
        )}

        {/* TAB 2: REPERTÓRIO & KITS DRIVE */}
        {activeTab === 'repertoire' && (
          <section className="space-y-5 animate-in fade-in duration-200">
            {/* Search & Filter Bar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Search Input */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar música, tom ou tag..."
                  value={songSearch}
                  onChange={(e) => setSongSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Status Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-1">
                  <Filter className="w-3.5 h-3.5" />
                  Status:
                </span>
                <button
                  onClick={() => setSongStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    songStatusFilter === 'ALL'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Todas ({songs.length})
                </button>
                <button
                  onClick={() => setSongStatusFilter('REHEARSING')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    songStatusFilter === 'REHEARSING'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Em Ensaio ({songs.filter((s) => s.status === 'REHEARSING').length})
                </button>
                <button
                  onClick={() => setSongStatusFilter('READY')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    songStatusFilter === 'READY'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Prontas ({songs.filter((s) => s.status === 'READY').length})
                </button>
                <button
                  onClick={() => setSongStatusFilter('TO_LEARN')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    songStatusFilter === 'TO_LEARN'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  A Aprender ({songs.filter((s) => s.status === 'TO_LEARN').length})
                </button>
              </div>
            </div>

            {/* List of Repertoire Songs */}
            <div className="space-y-4">
              {filteredSongs.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl">
                  <Music className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    Nenhuma música encontrada.
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Tente ajustar o termo de busca ou o filtro de status.
                  </p>
                </div>
              ) : (
                filteredSongs.map((song) => (
                  <SongListItem key={song.id} song={song} />
                ))
              )}
            </div>
          </section>
        )}

        {/* TAB 3: TAREFAS & BACKLOG */}
        {activeTab === 'tasks' && (
          <section className="animate-in fade-in duration-200">
            <TasksSection tasks={tasks} onToggleTask={handleToggleTask} />
          </section>
        )}

      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/80 dark:border-slate-800 py-6 bg-white dark:bg-slate-900 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-indigo-500" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Ellos Hub &copy; {new Date().getFullYear()}
            </span>
            <span>— Organização & Gestão Musical</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Desenvolvido com Next.js (App Router), TypeScript & Tailwind CSS
          </p>
        </div>
      </footer>

      {/* Add New Item Modal */}
      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddEvent={handleAddEvent}
        onAddSong={handleAddSong}
        onAddTask={handleAddTask}
      />
    </div>
  );
}
