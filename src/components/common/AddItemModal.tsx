'use client';

import React, { useState, useEffect } from 'react';
import { EventItem, SongItem, TaskItem, VoiceStem } from '@/types';
import {
  X,
  Calendar,
  Music,
  ListTodo,
  Plus,
  Pencil,
  MapPin,
  Phone,
  User,
  Shirt,
  Mic,
  Clock,
  Tag,
  Info,
  FileText,
  Gauge,
  Folder,
  Hash,
  Layers,
  Users,
  CheckSquare,
  Sparkles,
  ListOrdered,
} from 'lucide-react';

interface AddItemModalProps {
  isOpen: boolean;
  mode?: 'create' | 'edit';
  initialType?: 'event' | 'song' | 'task';
  hideTypeSelector?: boolean;
  editingItem?: EventItem | SongItem | TaskItem | null;
  onClose: () => void;
  onAddEvent: (event: EventItem) => void;
  onUpdateEvent?: (event: EventItem) => void;
  onAddSong: (song: SongItem) => void;
  onUpdateSong?: (song: SongItem) => void;
  onAddTask: (task: TaskItem) => void;
  onUpdateTask?: (task: TaskItem) => void;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  mode = 'create',
  initialType = 'event',
  hideTypeSelector = false,
  editingItem = null,
  onClose,
  onAddEvent,
  onUpdateEvent,
  onAddSong,
  onUpdateSong,
  onAddTask,
  onUpdateTask,
}) => {
  const [type, setType] = useState<'event' | 'song' | 'task'>(initialType);

  // Tab State
  const [eventTab, setEventTab] = useState<'basic' | 'location' | 'logistics'>('basic');
  const [songTab, setSongTab] = useState<'info' | 'drive'>('info');

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
  const [eventDressCode, setEventDressCode] = useState('');
  const [eventMicrophonesCount, setEventMicrophonesCount] = useState<number>(4);
  const [eventScheduleInput, setEventScheduleInput] = useState('');
  const [eventVotingDeadline, setEventVotingDeadline] = useState('');
  const [eventIsVotingClosed, setEventIsVotingClosed] = useState(false);

  // Song Form State
  const [songTitle, setSongTitle] = useState('');
  const [songArtist, setSongArtist] = useState('');
  const [songKey, setSongKey] = useState('');
  const [songBpm, setSongBpm] = useState<number | ''>('');
  const [songTags, setSongTags] = useState('Ellos');
  const [songStatus, setSongStatus] = useState<'READY' | 'REHEARSING' | 'TO_LEARN'>('REHEARSING');
  const [songDriveUrl, setSongDriveUrl] = useState('');
  const [songSheetUrl, setSongSheetUrl] = useState('');
  // Voice Kits per voice
  const [voiceKitSoprano, setVoiceKitSoprano] = useState('');
  const [voiceKitContralto, setVoiceKitContralto] = useState('');
  const [voiceKitTenor, setVoiceKitTenor] = useState('');
  const [voiceKitBaixo, setVoiceKitBaixo] = useState('');

  // Task Form State
  const [taskDescription, setTaskDescription] = useState('');
  const [taskCategory, setTaskCategory] = useState<'DIVULGACAO' | 'LOGISTICA' | 'CONFRAS' | 'CONTATOS'>('LOGISTICA');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskAssignedTo, setTaskAssignedTo] = useState('');

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    // Reset tabs when modal opens
    setEventTab('basic');
    setSongTab('info');

    if (mode === 'edit' && editingItem) {
      if ('date' in editingItem || ('category' in editingItem && 'status' in editingItem && ('votesCount' in editingItem || 'dressCode' in editingItem))) {
        // EventItem
        const evt = editingItem as EventItem;
        setType('event');
        setEventTitle(evt.title || '');
        setEventCategory(evt.category || 'Culto');
        setEventStatus(evt.status || 'PROPOSAL');
        setEventDate(evt.date || '');
        setEventTime(evt.time || '');
        setEventLocation(evt.location || '');
        setEventContactName(evt.contactName || '');
        setEventContactPhone(evt.contactPhone || '');
        setEventNotes(evt.notes || '');
        setEventDressCode(evt.dressCode || '');
        setEventMicrophonesCount(evt.microphonesCount || 4);
        setEventScheduleInput(
          evt.schedule ? evt.schedule.map((sc) => `${sc.time} - ${sc.activity}`).join('\n') : ''
        );
        setEventVotingDeadline(evt.votingDeadline || '');
        setEventIsVotingClosed(Boolean(evt.isVotingClosed));
      } else if ('voiceKits' in editingItem || 'generalDriveFolderUrl' in editingItem) {
        // SongItem
        const song = editingItem as SongItem;
        setType('song');
        setSongTitle(song.title || '');
        setSongArtist(song.artistOrGroup || '');
        setSongKey(song.keySignature || '');
        setSongBpm(song.bpm || '');
        setSongTags(song.tags ? song.tags.join(', ') : 'Ellos');
        setSongStatus(song.status || 'REHEARSING');
        setSongDriveUrl(song.generalDriveFolderUrl || '');
        setSongSheetUrl(song.sheetMusicUrl || '');

        const sopranoKit = song.voiceKits?.find((vk) => vk.label === 'Soprano');
        const contraltoKit = song.voiceKits?.find((vk) => vk.label === 'Contralto');
        const tenorKit = song.voiceKits?.find((vk) => vk.label === 'Tenor');
        const baixoKit = song.voiceKits?.find((vk) => vk.label === 'Baixo');

        setVoiceKitSoprano(sopranoKit?.driveUrl || '');
        setVoiceKitContralto(contraltoKit?.driveUrl || '');
        setVoiceKitTenor(tenorKit?.driveUrl || '');
        setVoiceKitBaixo(baixoKit?.driveUrl || '');
      } else if ('isDone' in editingItem || 'description' in editingItem) {
        // TaskItem
        const task = editingItem as TaskItem;
        setType('task');
        setTaskDescription(task.description || '');
        setTaskCategory(task.category || 'LOGISTICA');
        setTaskDueDate(task.dueDate || '');
        setTaskAssignedTo(task.assignedTo || '');
      }
    } else {
      // Create mode
      setType(initialType);
      // Reset defaults
      setEventTitle('');
      setEventCategory('Culto');
      setEventStatus('PROPOSAL');
      setEventDate('');
      setEventTime('');
      setEventLocation('');
      setEventContactName('');
      setEventContactPhone('');
      setEventNotes('');
      setEventDressCode('');
      setEventMicrophonesCount(4);
      setEventScheduleInput('');

      setSongTitle('');
      setSongArtist('');
      setSongKey('');
      setSongBpm('');
      setSongTags('Ellos');
      setSongStatus('REHEARSING');
      setSongDriveUrl('');
      setSongSheetUrl('');
      setVoiceKitSoprano('');
      setVoiceKitContralto('');
      setVoiceKitTenor('');
      setVoiceKitBaixo('');

      setTaskDescription('');
      setTaskCategory('LOGISTICA');
      setTaskDueDate('');
      setTaskAssignedTo('');
    }
  }, [isOpen, mode, initialType, editingItem]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (type === 'event') {
      if (!eventTitle) return;

      const parsedSchedule = eventScheduleInput
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const parts = line.split(/[-—:]/);
          if (parts.length >= 2) {
            return { time: parts[0].trim(), activity: parts.slice(1).join('-').trim() };
          }
          return { time: 'Horário', activity: line };
        });

      const eventData: EventItem = {
        id: mode === 'edit' && editingItem ? editingItem.id : `evt-${Date.now()}`,
        title: eventTitle,
        category: eventCategory,
        status: eventStatus,
        date: eventDate || 'A definir',
        time: eventTime || 'A definir',
        location: eventLocation,
        contactName: eventContactName,
        contactPhone: eventContactPhone,
        notes: eventNotes,
        dressCode: eventDressCode || undefined,
        microphonesCount: eventMicrophonesCount || 4,
        schedule: parsedSchedule.length > 0 ? parsedSchedule : undefined,
        drivers: mode === 'edit' && editingItem && 'drivers' in editingItem ? (editingItem as EventItem).drivers : [],
        passengers: mode === 'edit' && editingItem && 'passengers' in editingItem ? (editingItem as EventItem).passengers : [],
        votesCount:
          eventStatus === 'PROPOSAL'
            ? mode === 'edit' && editingItem && 'votesCount' in editingItem
              ? (editingItem as EventItem).votesCount
              : { yes: 1, total: 7 }
            : undefined,
        userVoted: mode === 'edit' && editingItem && 'userVoted' in editingItem ? (editingItem as EventItem).userVoted : eventStatus === 'PROPOSAL',
        votingDeadline: eventVotingDeadline || undefined,
        isVotingClosed: eventIsVotingClosed,
      };

      if (mode === 'edit' && onUpdateEvent) {
        onUpdateEvent(eventData);
      } else {
        onAddEvent(eventData);
      }
    } else if (type === 'song') {
      if (!songTitle) return;
      const tagsArray = songTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const defaultDrive = songDriveUrl || 'https://drive.google.com';

      const voiceKits: VoiceStem[] = [
        { label: 'Soprano', driveUrl: voiceKitSoprano || defaultDrive },
        { label: 'Contralto', driveUrl: voiceKitContralto || defaultDrive },
        { label: 'Tenor', driveUrl: voiceKitTenor || defaultDrive },
        { label: 'Baixo', driveUrl: voiceKitBaixo || defaultDrive },
      ];

      const songData: SongItem = {
        id: mode === 'edit' && editingItem ? editingItem.id : `song-${Date.now()}`,
        title: songTitle,
        artistOrGroup: songArtist || 'Ellos',
        keySignature: songKey || 'C',
        bpm: songBpm ? Number(songBpm) : undefined,
        tags: tagsArray.length > 0 ? tagsArray : ['Ellos'],
        status: songStatus,
        generalDriveFolderUrl: defaultDrive,
        sheetMusicUrl: songSheetUrl || undefined,
        voiceKits,
      };

      if (mode === 'edit' && onUpdateSong) {
        onUpdateSong(songData);
      } else {
        onAddSong(songData);
      }
    } else if (type === 'task') {
      if (!taskDescription) return;
      const taskData: TaskItem = {
        id: mode === 'edit' && editingItem ? editingItem.id : `task-${Date.now()}`,
        description: taskDescription,
        category: taskCategory,
        dueDate: taskDueDate || undefined,
        isDone: mode === 'edit' && editingItem && 'isDone' in editingItem ? (editingItem as TaskItem).isDone : false,
        assignedTo: taskAssignedTo || undefined,
      };

      if (mode === 'edit' && onUpdateTask) {
        onUpdateTask(taskData);
      } else {
        onAddTask(taskData);
      }
    }

    onClose();
  };

  const getHeaderTitle = () => {
    if (mode === 'edit') {
      if (type === 'event') return 'Editar Evento';
      if (type === 'song') return 'Editar Música';
      if (type === 'task') return 'Editar Tarefa';
      return 'Editar Item';
    } else {
      if (type === 'event') return 'Novo Evento / Convite';
      if (type === 'song') return 'Nova Música do Repertório';
      if (type === 'task') return 'Nova Tarefa Administrativa';
      return 'Adicionar Novo Item';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-sm animate-in fade-in duration-200 no-scrollbar"
    >
      <div className="bg-white dark:bg-[#1B365D] border border-slate-200 dark:border-amber-500/20 rounded-2xl max-w-xl w-[92vw] sm:w-full shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[580px] overflow-hidden transition-all no-scrollbar">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-slate-100 dark:border-navy-800/60 shrink-0 bg-white/50 dark:bg-[#1B365D]/50">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {mode === 'edit' ? (
              <Pencil className="w-4 h-4 sm:w-5 sm:h-5 text-gold-500" />
            ) : (
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-navy-700 dark:text-gold-400" />
            )}
            {getHeaderTitle()}
          </h2>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 sm:p-1.5 rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-navy-800/60 cursor-pointer"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Item Type Selector (Hidden when opened from a specific tab or in edit mode) */}
        {!hideTypeSelector && mode !== 'edit' && (
          <div className="px-3.5 sm:px-5 pt-3 pb-0.5 shrink-0">
            <div className="grid grid-cols-3 gap-1.5 bg-slate-100 dark:bg-navy-950/60 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setType('event');
                  setEventTab('basic');
                }}
                className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  type === 'event'
                    ? 'bg-white dark:bg-navy-800 text-navy-700 dark:text-gold-400 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Evento
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('song');
                  setSongTab('info');
                }}
                className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  type === 'song'
                    ? 'bg-white dark:bg-navy-800 text-navy-700 dark:text-gold-400 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Music className="w-3.5 h-3.5" />
                Música
              </button>
              <button
                type="button"
                onClick={() => setType('task')}
                className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  type === 'task'
                    ? 'bg-white dark:bg-navy-800 text-navy-700 dark:text-gold-400 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <ListTodo className="w-3.5 h-3.5" />
                Tarefa
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Form with Fixed Footer & Scrollable Content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto no-scrollbar p-3.5 sm:p-5 space-y-3">
            {/* EVENT FORM */}
            {type === 'event' && (
              <>
                {/* Event Tabs Navigation: 100% width grid, no horizontal scroll */}
                <div className="grid grid-cols-3 border-b border-slate-200 dark:border-slate-700/80 mb-3 no-scrollbar shrink-0">
                  <button
                    type="button"
                    onClick={() => setEventTab('basic')}
                    className={`py-2 px-1 sm:px-2 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1 transition-all border-b-2 cursor-pointer ${
                      eventTab === 'basic'
                        ? 'border-[#D4AF37] text-gold-500 font-bold bg-gold-500/5 dark:bg-gold-500/10'
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    <span>📌</span> Geral
                  </button>
                  <button
                    type="button"
                    onClick={() => setEventTab('location')}
                    className={`py-2 px-1 sm:px-2 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1 transition-all border-b-2 cursor-pointer ${
                      eventTab === 'location'
                        ? 'border-[#D4AF37] text-gold-500 font-bold bg-gold-500/5 dark:bg-gold-500/10'
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    <span>📍</span> Local
                  </button>
                  <button
                    type="button"
                    onClick={() => setEventTab('logistics')}
                    className={`py-2 px-1 sm:px-2 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1 transition-all border-b-2 cursor-pointer ${
                      eventTab === 'logistics'
                        ? 'border-[#D4AF37] text-gold-500 font-bold bg-gold-500/5 dark:bg-gold-500/10'
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    <span>🎭</span> Logística
                  </button>
                </div>

                {/* Tab 1: Geral */}
                {eventTab === 'basic' && (
                  <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-gold-500" />
                        Título do Evento / Local *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: IASD Central Itapecerica"
                        value={eventTitle}
                        onChange={(e) => setEventTitle(e.target.value)}
                        className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-navy-950/70 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all shadow-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          <Tag className="w-3.5 h-3.5 text-gold-500" />
                          Categoria
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Culto, Escola Sabatina"
                          value={eventCategory}
                          onChange={(e) => setEventCategory(e.target.value)}
                          className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-navy-950/70 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all shadow-xs"
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          <Info className="w-3.5 h-3.5 text-gold-500" />
                          Status
                        </label>
                        <select
                          value={eventStatus}
                          onChange={(e) => setEventStatus(e.target.value as any)}
                          className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-navy-950/70 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all shadow-xs cursor-pointer"
                        >
                          <option value="PROPOSAL">Em Votação / Análise</option>
                          <option value="CONFIRMED">Confirmado</option>
                          <option value="INTERNAL">Interno / Collab</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          <Calendar className="w-3.5 h-3.5 text-gold-500" />
                          Data
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: 2026-11-15 ou A definir"
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                          className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-navy-950/70 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all shadow-xs"
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          <Clock className="w-3.5 h-3.5 text-gold-500" />
                          Horário
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: 10:00"
                          value={eventTime}
                          onChange={(e) => setEventTime(e.target.value)}
                          className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-navy-950/70 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all shadow-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/60 dark:border-navy-800">
                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-gold-400 mb-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Data Limite de Votação (ADM)</span>
                        </label>
                        <input
                          type="date"
                          value={eventVotingDeadline}
                          onChange={(e) => setEventVotingDeadline(e.target.value)}
                          className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-navy-950/70 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                        />
                      </div>

                      <div className="flex items-end">
                        <label className="inline-flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-navy-950/70 w-full text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={eventIsVotingClosed}
                            onChange={(e) => setEventIsVotingClosed(e.target.checked)}
                            className="rounded border-slate-400 text-gold-500 focus:ring-gold-500"
                          />
                          <span>Encerrar Votações (Regência)</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: Local */}
                {eventTab === 'location' && (
                  <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        <MapPin className="w-3.5 h-3.5 text-gold-500" />
                        Endereço / Localização
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Igreja Central - Av. Principal, 100"
                        value={eventLocation}
                        onChange={(e) => setEventLocation(e.target.value)}
                        className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-navy-950/70 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all shadow-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          <User className="w-3.5 h-3.5 text-gold-500" />
                          Contato Responsável
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Pr. João"
                          value={eventContactName}
                          onChange={(e) => setEventContactName(e.target.value)}
                          className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-navy-950/70 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all shadow-xs"
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          <Phone className="w-3.5 h-3.5 text-gold-500" />
                          Telefone WhatsApp
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: 11996554353"
                          value={eventContactPhone}
                          onChange={(e) => setEventContactPhone(e.target.value)}
                          className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-navy-950/70 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all shadow-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 3: Logística */}
                {eventTab === 'logistics' && (
                  <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          <Shirt className="w-3.5 h-3.5 text-gold-500" />
                          Uniforme / Dress Code
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: 👔 Social Dourado/Azul"
                          value={eventDressCode}
                          onChange={(e) => setEventDressCode(e.target.value)}
                          className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-navy-950/70 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all shadow-xs"
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          <Mic className="w-3.5 h-3.5 text-gold-500" />
                          Qtd. Microfones
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="16"
                          value={eventMicrophonesCount}
                          onChange={(e) => setEventMicrophonesCount(Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-navy-950/70 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all shadow-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        <ListOrdered className="w-3.5 h-3.5 text-gold-500" />
                        Cronograma do Dia (1 por linha)
                      </label>
                      <textarea
                        rows={2}
                        placeholder={"08:30 - Passagem de Som\n09:15 - Oração\n10:00 - Apresentação"}
                        value={eventScheduleInput}
                        onChange={(e) => setEventScheduleInput(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-navy-950/70 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all shadow-xs font-mono resize-none"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        <FileText className="w-3.5 h-3.5 text-gold-500" />
                        Observações
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Ex: Alinhamento técnico com sonoplastia."
                        value={eventNotes}
                        onChange={(e) => setEventNotes(e.target.value)}
                        className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-navy-950/70 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all shadow-xs resize-none"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* SONG FORM */}
            {type === 'song' && (
              <>
                {/* Song Tabs Navigation: 100% width grid, no horizontal scroll */}
                <div className="grid grid-cols-2 border-b border-slate-200 dark:border-slate-700/80 mb-3 no-scrollbar shrink-0">
                  <button
                    type="button"
                    onClick={() => setSongTab('info')}
                    className={`py-2 px-2 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all border-b-2 cursor-pointer ${
                      songTab === 'info'
                        ? 'border-[#D4AF37] text-gold-500 font-bold bg-gold-500/5 dark:bg-gold-500/10'
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    <span>🎼</span> Informações
                  </button>
                  <button
                    type="button"
                    onClick={() => setSongTab('drive')}
                    className={`py-2 px-2 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all border-b-2 cursor-pointer ${
                      songTab === 'drive'
                        ? 'border-[#D4AF37] text-gold-500 font-bold bg-gold-500/5 dark:bg-gold-500/10'
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    <span>📁</span> Drive & Kits
                  </button>
                </div>

                {/* Tab 1: Informações */}
                {songTab === 'info' && (
                  <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        <Music className="w-3.5 h-3.5 text-gold-500" />
                        Nome da Música *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Música Especial CTJ"
                        value={songTitle}
                        onChange={(e) => setSongTitle(e.target.value)}
                        className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-navy-950/70 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all shadow-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          <Users className="w-3.5 h-3.5 text-gold-500" />
                          Arranjo / Grupo
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Ellos Vocal"
                          value={songArtist}
                          onChange={(e) => setSongArtist(e.target.value)}
                          className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-navy-950/70 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all shadow-xs"
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          <Hash className="w-3.5 h-3.5 text-gold-500" />
                          Tom / Tonalidade
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: F, G, Dm"
                          value={songKey}
                          onChange={(e) => setSongKey(e.target.value)}
                          className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-navy-950/70 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all shadow-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          <Gauge className="w-3.5 h-3.5 text-gold-500" />
                          BPM (Andamento)
                        </label>
                        <input
                          type="number"
                          placeholder="Ex: 90"
                          value={songBpm}
                          onChange={(e) => setSongBpm(e.target.value ? Number(e.target.value) : '')}
                          className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-navy-950/70 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all shadow-xs"
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          <Layers className="w-3.5 h-3.5 text-gold-500" />
                          Status do Repertório
                        </label>
                        <select
                          value={songStatus}
                          onChange={(e) => setSongStatus(e.target.value as any)}
                          className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-navy-950/70 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all shadow-xs cursor-pointer"
                        >
                          <option value="REHEARSING">Em Ensaio</option>
                          <option value="READY">Pronta para Apresentar</option>
                          <option value="TO_LEARN">A Aprender</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        <Tag className="w-3.5 h-3.5 text-gold-500" />
                        Tags (separadas por vírgula)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Ellos, Autoral, Especial"
                        value={songTags}
                        onChange={(e) => setSongTags(e.target.value)}
                        className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-navy-950/70 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all shadow-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Tab 2: Drive & Kits */}
                {songTab === 'drive' && (
                  <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        <Folder className="w-3.5 h-3.5 text-gold-500" />
                        Link Pasta Google Drive Geral
                      </label>
                      <input
                        type="url"
                        placeholder="https://drive.google.com/..."
                        value={songDriveUrl}
                        onChange={(e) => setSongDriveUrl(e.target.value)}
                        className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-navy-950/70 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all shadow-xs"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        <FileText className="w-3.5 h-3.5 text-gold-500" />
                        Link Partitura / Cifra (PDF)
                      </label>
                      <input
                        type="url"
                        placeholder="https://drive.google.com/..."
                        value={songSheetUrl}
                        onChange={(e) => setSongSheetUrl(e.target.value)}
                        className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-navy-950/70 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all shadow-xs"
                      />
                    </div>

                    {/* Kits por Naipe */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-gold-400 mb-2 flex items-center gap-1.5">
                        <Mic className="w-3.5 h-3.5 text-gold-500" />
                        Kits de Ensaio por Naipe (Links)
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-0.5">
                            Soprano
                          </label>
                          <input
                            type="url"
                            placeholder="Link Drive Soprano"
                            value={voiceKitSoprano}
                            onChange={(e) => setVoiceKitSoprano(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-navy-950/70 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
                          />
                        </div>
                        <div>
                          <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-0.5">
                            Contralto
                          </label>
                          <input
                            type="url"
                            placeholder="Link Drive Contralto"
                            value={voiceKitContralto}
                            onChange={(e) => setVoiceKitContralto(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-navy-950/70 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
                          />
                        </div>
                        <div>
                          <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-0.5">
                            Tenor
                          </label>
                          <input
                            type="url"
                            placeholder="Link Drive Tenor"
                            value={voiceKitTenor}
                            onChange={(e) => setVoiceKitTenor(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-navy-950/70 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
                          />
                        </div>
                        <div>
                          <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-0.5">
                            Baixo
                          </label>
                          <input
                            type="url"
                            placeholder="Link Drive Baixo"
                            value={voiceKitBaixo}
                            onChange={(e) => setVoiceKitBaixo(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-navy-950/70 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* TASK FORM */}
            {type === 'task' && (
              <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <CheckSquare className="w-3.5 h-3.5 text-gold-500" />
                    Descrição da Tarefa *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Alinhar detalhes da volta dos ensaios"
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-navy-950/70 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all shadow-xs"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <Tag className="w-3.5 h-3.5 text-gold-500" />
                    Categoria
                  </label>
                  <select
                    value={taskCategory}
                    onChange={(e) => setTaskCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-navy-950/70 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all shadow-xs cursor-pointer"
                  >
                    <option value="DIVULGACAO">Divulgação</option>
                    <option value="LOGISTICA">Logística</option>
                    <option value="CONFRAS">Confras</option>
                    <option value="CONTATOS">Contatos</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <User className="w-3.5 h-3.5 text-gold-500" />
                    Responsável
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Regência, Mídia"
                    value={taskAssignedTo}
                    onChange={(e) => setTaskAssignedTo(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-navy-950/70 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all shadow-xs"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-gold-500" />
                    Prazo / Data Limite
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 2026-12-01 ou Próximo ensaio"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-navy-950/70 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all shadow-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sticky Action Footer */}
          <div className="p-3 sm:p-3.5 border-t border-slate-100 dark:border-navy-800/60 flex items-center justify-end gap-2 shrink-0 bg-slate-50/50 dark:bg-navy-950/40">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-extrabold text-slate-950 bg-gradient-to-r from-[#D4AF37] to-[#B89028] hover:brightness-110 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              {mode === 'edit' ? 'Salvar Alterações' : 'Salvar Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Aliases for explicit imports if needed
export const EventModal = AddItemModal;
export const SongModal = AddItemModal;
export const TaskModal = AddItemModal;
