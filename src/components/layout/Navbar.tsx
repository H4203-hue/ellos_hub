'use client';

import React from 'react';
import { 
  Music, 
  Calendar, 
  ListTodo, 
  Plus, 
  Sparkles,
  Layers
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'agenda' | 'repertoire' | 'tasks';
  onTabChange: (tab: 'agenda' | 'repertoire' | 'tasks') => void;
  onOpenAddModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onOpenAddModal,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 py-3.5">
        {/* Brand / Logo */}
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                  Ellos<span className="text-indigo-600 dark:text-indigo-400">Hub</span>
                </h1>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Gestão & Repertório Vocal
              </p>
            </div>
          </div>

          {/* Mobile Add Button */}
          <button
            onClick={onOpenAddModal}
            className="sm:hidden inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Novo</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => onTabChange('agenda')}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'agenda'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Agenda & Convites</span>
          </button>

          <button
            onClick={() => onTabChange('repertoire')}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'repertoire'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Repertório & Kits</span>
          </button>

          <button
            onClick={() => onTabChange('tasks')}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'tasks'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <ListTodo className="w-4 h-4" />
            <span>Tarefas & Backlog</span>
          </button>
        </nav>

        {/* Desktop Add Button */}
        <button
          onClick={onOpenAddModal}
          className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm hover:shadow-indigo-500/25 transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Item</span>
        </button>
      </div>
    </header>
  );
};
