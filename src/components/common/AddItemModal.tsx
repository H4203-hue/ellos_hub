'use client';

import React, { useState } from 'react';
import { EventItem, SongItem, TaskItem } from '@/types';
import { X, Calendar, Music, ListTodo, Plus } from 'lucide-react';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEvent: (event: EventItem) => void;
  onAddSong: (song: SongItem) => void;
  onAddTask: (task: TaskItem) => void;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  onAddEvent,
  onAddSong,
  onAddTask,
}) => {
  const [type, setType] = useState<'event' | 'song' | 'task'>('event');

  // Event Form State
  const [eventTitle, setEventTitle] = useState('');
  const [eventCategory, setEventCategory] = useState('Culto');
  const [eventStatus, setEventStatus] = useState<'CONFIRMED' | 'PROPOSAL' | 'INTERNAL'>('PROPOSAL');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventContactName, setEventContactName] = useState('');
  const [eventContactPhone, setEventContactPhone] = useState('');
  const [eventNotes, setEventNotes] = useState('');

  // Song Form State
  const [songTitle, setSongTitle] = useState('');
  const [songArtist, setSongArtist] = useState('');
  const [songKey, setSongKey] = useState('');
  const [songBpm, setSongBpm] = useState<number | ''>('');
  const [songTags, setSongTags] = useState('Ellos');
  const [songStatus, setSongStatus] = useState<'READY' | 'REHEARSING' | 'TO_LEARN'>('REHEARSING');
  const [songDriveUrl, setSongDriveUrl] = useState('');
  const [songSheetUrl, setSongSheetUrl] = useState('');

  // Task Form State
  const [taskDescription, setTaskDescription] = useState('');
  const [taskCategory, setTaskCategory] = useState<'DIVULGACAO' | 'LOGISTICA' | 'CONFRAS' | 'CONTATOS'>('LOGISTICA');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskAssignedTo, setTaskAssignedTo] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (type === 'event') {
      if (!eventTitle) return;
      const newEvent: EventItem = {
        id: `evt-${Date.now()}`,
        title: eventTitle,
        category: eventCategory,
        status: eventStatus,
        date: eventDate || 'A definir',
        time: eventTime || 'A definir',
        location: eventLocation,
        contactName: eventContactName,
        contactPhone: eventContactPhone,
        notes: eventNotes,
        votesCount: eventStatus === 'PROPOSAL' ? { yes: 1, total: 7 } : undefined,
        userVoted: eventStatus === 'PROPOSAL',
      };
      onAddEvent(newEvent);
    } else if (type === 'song') {
      if (!songTitle) return;
      const tagsArray = songTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const newSong: SongItem = {
        id: `song-${Date.now()}`,
        title: songTitle,
        artistOrGroup: songArtist || 'Ellos',
        keySignature: songKey || 'C',
        bpm: songBpm ? Number(songBpm) : undefined,
        tags: tagsArray.length > 0 ? tagsArray : ['Ellos'],
        status: songStatus,
        generalDriveFolderUrl: songDriveUrl || 'https://drive.google.com',
        sheetMusicUrl: songSheetUrl || undefined,
        voiceKits: [
          { label: 'Soprano', driveUrl: songDriveUrl || 'https://drive.google.com' },
          { label: 'Contralto', driveUrl: songDriveUrl || 'https://drive.google.com' },
          { label: 'Tenor', driveUrl: songDriveUrl || 'https://drive.google.com' },
          { label: 'Baixo', driveUrl: songDriveUrl || 'https://drive.google.com' },
        ],
      };
      onAddSong(newSong);
    } else if (type === 'task') {
      if (!taskDescription) return;
      const newTask: TaskItem = {
        id: `task-${Date.now()}`,
        description: taskDescription,
        category: taskCategory,
        dueDate: taskDueDate || undefined,
        isDone: false,
        assignedTo: taskAssignedTo || undefined,
      };
      onAddTask(newTask);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Adicionar Novo Item
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Item Type Selector */}
        <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setType('event')}
            className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              type === 'event'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Evento
          </button>
          <button
            type="button"
            onClick={() => setType('song')}
            className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              type === 'song'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            Música
          </button>
          <button
            type="button"
            onClick={() => setType('task')}
            className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              type === 'task'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <ListTodo className="w-3.5 h-3.5" />
            Tarefa
          </button>
        </div>

        {/* Dynamic Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {type === 'event' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Título do Evento / Local *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: IASD Central Itapecerica"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Categoria
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Culto, Escola Sabatina"
                    value={eventCategory}
                    onChange={(e) => setEventCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={eventStatus}
                    onChange={(e) => setEventStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="PROPOSAL">Em Votação / Análise</option>
                    <option value="CONFIRMED">Confirmado</option>
                    <option value="INTERNAL">Interno / Collab</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Data
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 2026-11-15 ou A definir"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Horário
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 10:00"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contato Responsável
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Pr. João"
                    value={eventContactName}
                    onChange={(e) => setEventContactName(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Telefone WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 11996554353"
                    value={eventContactPhone}
                    onChange={(e) => setEventContactPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Observações
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Trajar social completo. Alinhamento técnico."
                  value={eventNotes}
                  onChange={(e) => setEventNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </>
          )}

          {type === 'song' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome da Música *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Música Especial CTJ"
                  value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tom (Key)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: F"
                    value={songKey}
                    onChange={(e) => setSongKey(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    BPM
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 105"
                    value={songBpm}
                    onChange={(e) => setSongBpm(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={songStatus}
                    onChange={(e) => setSongStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="REHEARSING">Em Ensaio</option>
                    <option value="READY">Pronta</option>
                    <option value="TO_LEARN">A Aprender</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tags (separadas por vírgula)
                </label>
                <input
                  type="text"
                  placeholder="Ellos, Autoral, Musical CTJ"
                  value={songTags}
                  onChange={(e) => setSongTags(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  URL Pasta Google Drive
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/drive/folders/..."
                  value={songDriveUrl}
                  onChange={(e) => setSongDriveUrl(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </>
          )}

          {type === 'task' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Descrição da Tarefa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Alinhar detalhes da volta dos ensaios"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Categoria
                  </label>
                  <select
                    value={taskCategory}
                    onChange={(e) => setTaskCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="DIVULGACAO">Divulgação</option>
                    <option value="LOGISTICA">Logística</option>
                    <option value="CONFRAS">Confras</option>
                    <option value="CONTATOS">Contatos</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Responsável
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Regência, Mídia"
                    value={taskAssignedTo}
                    onChange={(e) => setTaskAssignedTo(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </>
          )}

          {/* Submit Action */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all"
            >
              Salvar Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
