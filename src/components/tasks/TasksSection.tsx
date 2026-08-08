'use client';

import React, { useState } from 'react';
import { TaskItem } from '@/types';
import { 
  CheckSquare, 
  Square, 
  MessageCircle, 
  Calendar, 
  User, 
  Tag,
  Filter,
  CheckCircle2,
  ListTodo
} from 'lucide-react';

interface TasksSectionProps {
  tasks: TaskItem[];
  onToggleTask: (taskId: string) => void;
}

export const TasksSection: React.FC<TasksSectionProps> = ({ tasks, onToggleTask }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');

  const categories = [
    { id: 'TODAS', label: 'Todas' },
    { id: 'DIVULGACAO', label: 'Divulgação' },
    { id: 'LOGISTICA', label: 'Logística' },
    { id: 'CONFRAS', label: 'Confras' },
    { id: 'CONTATOS', label: 'Contatos' },
  ];

  const filteredTasks = selectedCategory === 'TODAS'
    ? tasks
    : tasks.filter(t => t.category === selectedCategory);

  const completedCount = tasks.filter(t => t.isDone).length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const getCategoryBadge = (category: TaskItem['category']) => {
    switch (category) {
      case 'DIVULGACAO':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            Divulgação
          </span>
        );
      case 'LOGISTICA':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            Logística
          </span>
        );
      case 'CONFRAS':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Confras
          </span>
        );
      case 'CONTATOS':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Contatos
          </span>
        );
      default:
        return null;
    }
  };

  const extractPhone = (text: string) => {
    const match = text.match(/\b\d{10,11}\b/);
    return match ? match[0] : null;
  };

  return (
    <div className="space-y-6">
      {/* Overview & Category Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Tarefas Administrativas & Backlog
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Acompanhe as pendências logísticas, divulgações e confraternizações do grupo Ellos.
            </p>
          </div>

          {/* Progress widget */}
          <div className="bg-slate-50 dark:bg-slate-800/80 rounded-xl p-3 border border-slate-100 dark:border-slate-700 min-w-[200px]">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              <span>Progresso Total</span>
              <span>{completedCount}/{totalCount} ({progressPercent}%)</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-2">
            <Filter className="w-3.5 h-3.5" />
            Categoria:
          </span>
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Task List Items */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Nenhuma tarefa encontrada nesta categoria.
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const phone = extractPhone(task.description);

            return (
              <div
                key={task.id}
                className={`group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-slate-900 border rounded-xl shadow-sm transition-all gap-4 ${
                  task.isDone
                    ? 'border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/40 opacity-75'
                    : 'border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800'
                }`}
              >
                <div className="flex items-start gap-3 flex-1">
                  <button
                    onClick={() => onToggleTask(task.id)}
                    className="mt-0.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shrink-0"
                    title={task.isDone ? 'Marcar como não concluída' : 'Marcar como concluída'}
                  >
                    {task.isDone ? (
                      <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {getCategoryBadge(task.category)}
                      <p
                        className={`text-sm font-medium text-slate-800 dark:text-slate-200 ${
                          task.isDone ? 'line-through text-slate-400 dark:text-slate-500' : ''
                        }`}
                      >
                        {task.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      {task.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Prazo: {task.dueDate}
                        </span>
                      )}
                      {task.assignedTo && (
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {task.assignedTo}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Direct Action (e.g. WhatsApp if phone exists) */}
                {phone && (
                  <a
                    href={`https://wa.me/55${phone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 rounded-lg border border-emerald-200/80 dark:border-emerald-800/60 transition-colors shrink-0"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
