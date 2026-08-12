'use client';

import React, { useState } from 'react';
import { TaskItem } from '@/types';
import { 
  CheckSquare, 
  Square, 
  MessageCircle, 
  Calendar, 
  User, 
  Filter, 
  ListTodo,
  Pencil,
  Trash2
} from 'lucide-react';

interface TasksSectionProps {
  tasks: TaskItem[];
  onToggleTask: (taskId: string) => void;
  onAddTask?: (task: TaskItem) => void;
  onOpenAddModal?: (initialType: 'task') => void;
  onEditTask?: (task: TaskItem) => void;
  onDeleteTask?: (taskId: string) => void;
}

export const TasksSection: React.FC<TasksSectionProps> = ({
  tasks,
  onToggleTask,
  onAddTask,
  onOpenAddModal,
  onEditTask,
  onDeleteTask,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const [quickTaskText, setQuickTaskText] = useState('');

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskText.trim() || !onAddTask) return;

    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      description: quickTaskText.trim(),
      category: selectedCategory !== 'TODAS' ? (selectedCategory as TaskItem['category']) : 'LOGISTICA',
      isDone: false,
      dueDate: new Date().toISOString().split('T')[0],
      assignedTo: 'Equipe Ellos',
    };

    onAddTask(newTask);
    setQuickTaskText('');
  };

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
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300 border border-sky-200 dark:border-sky-800 shrink-0">
            Divulgação
          </span>
        );
      case 'LOGISTICA':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shrink-0">
            Logística
          </span>
        );
      case 'CONFRAS':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0">
            Confras
          </span>
        );
      case 'CONTATOS':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
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
      <div className="bg-white dark:bg-[#1B365D] border border-slate-200/90 dark:border-amber-500/20 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-navy-700 dark:text-gold-400" />
              Tarefas Administrativas & Backlog
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">
              Acompanhe as pendências logísticas, divulgações e confraternizações do grupo Ellos.
            </p>
          </div>

          {/* Progress widget & Add Task Button */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-50 dark:bg-navy-950/60 rounded-xl p-3 border border-slate-200/60 dark:border-amber-500/10 min-w-[180px]">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                <span>Progresso Total</span>
                <span>{completedCount}/{totalCount} ({progressPercent}%)</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-gold-500 to-gold-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {onOpenAddModal && (
              <button
                onClick={() => onOpenAddModal('task')}
                className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-[#D4AF37] to-[#B89028] hover:brightness-110 rounded-xl shadow-xs transition-all active:scale-95 shrink-0 cursor-pointer"
              >
                <span>+ Nova Tarefa</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Inline To-Do Input Field */}
        <form onSubmit={handleQuickAdd} className="flex items-center gap-2 pt-2">
          <input
            type="text"
            placeholder="Adicionar nova tarefa rápida... (pressione Enter)"
            value={quickTaskText}
            onChange={(e) => setQuickTaskText(e.target.value)}
            className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-200/90 dark:border-slate-700 bg-slate-50 dark:bg-navy-950/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-600 dark:focus:ring-gold-500/50"
          />
          <button
            type="submit"
            disabled={!quickTaskText.trim()}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-navy-900 text-white dark:bg-gold-500 dark:text-navy-950 hover:brightness-110 disabled:opacity-50 transition-all shrink-0 shadow-xs cursor-pointer"
          >
            + Adicionar
          </button>
          {onOpenAddModal && (
            <button
              type="button"
              onClick={() => onOpenAddModal('task')}
              className="md:hidden px-3 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-slate-950 shrink-0 cursor-pointer"
            >
              +
            </button>
          )}
        </form>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-navy-800/60">
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
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-navy-800 dark:bg-gold-500 text-white dark:text-navy-950 shadow-xs'
                    : 'bg-slate-100 text-slate-600 dark:bg-navy-950/60 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-800'
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
          <div className="text-center py-10 bg-white dark:bg-[#1B365D] border border-slate-200/90 dark:border-amber-500/20 rounded-2xl">
            <p className="text-sm text-slate-500 dark:text-slate-300">
              Nenhuma tarefa encontrada nesta categoria.
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const phone = extractPhone(task.description);

            return (
              <div
                key={task.id}
                className={`relative group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-[#1B365D] border rounded-2xl shadow-xs transition-all duration-200 gap-3 ${
                  task.isDone
                    ? 'border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-navy-950/30 opacity-75'
                    : 'border-slate-200/90 dark:border-amber-500/20 hover:border-navy-600/30 dark:hover:border-gold-500/40'
                }`}
              >
                {/* Esquerda (Checkbox) & Centro (Descrição + Tag) */}
                <div className="flex items-start gap-3 flex-1 min-w-0 pr-8 sm:pr-0">
                  <button
                    onClick={() => onToggleTask(task.id)}
                    className="mt-0.5 text-slate-400 hover:text-gold-600 dark:hover:text-gold-400 transition-colors shrink-0 cursor-pointer"
                    title={task.isDone ? 'Marcar como não concluída' : 'Marcar como concluída'}
                  >
                    {task.isDone ? (
                      <CheckSquare className="w-5 h-5 text-gold-600 dark:text-gold-400" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {getCategoryBadge(task.category)}
                      <p
                        className={`text-sm font-medium text-slate-800 dark:text-slate-200 break-words ${
                          task.isDone ? 'line-through text-slate-400 dark:text-slate-500' : ''
                        }`}
                      >
                        {task.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Direita: Prazo/Responsável, WhatsApp e Botão Editar */}
                <div className="flex flex-wrap items-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-navy-800/60">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    {task.dueDate && (
                      <span className="flex items-center gap-1 bg-slate-100 dark:bg-navy-950/60 px-2 py-1 rounded-md">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Prazo: {task.dueDate}
                      </span>
                    )}
                    {task.assignedTo && (
                      <span className="flex items-center gap-1 bg-slate-100 dark:bg-navy-950/60 px-2 py-1 rounded-md">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {task.assignedTo}
                      </span>
                    )}
                  </div>

                  {phone && (
                    <a
                      href={`https://wa.me/55${phone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 rounded-lg border border-emerald-200/80 dark:border-emerald-800/60 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>WhatsApp</span>
                    </a>
                  )}

                  {onEditTask && (
                    <button
                      onClick={() => onEditTask(task)}
                      title="Editar Tarefa"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 transition-colors cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}

                  {onDeleteTask && (
                    <button
                      onClick={() => {
                        if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
                          onDeleteTask(task.id);
                        }
                      }}
                      title="Excluir Tarefa"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
