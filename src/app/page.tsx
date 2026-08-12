'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { mockEvents, mockSongs, mockTasks } from '@/data/mockData';
import { EventItem, SongItem, TaskItem } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { deleteEventFromSupabase, deleteSongFromSupabase, deleteTaskFromSupabase } from '@/services/api';
import { Navbar } from '@/components/layout/Navbar';
import { SidebarDrawer } from '@/components/layout/SidebarDrawer';
import { EventCard, EventResponseRow } from '@/components/events/EventCard';
import { MonthlyCalendarView } from '@/components/events/MonthlyCalendarView';
import { EventNotionModal } from '@/components/events/EventNotionModal';
import { MediaCentralModal } from '@/components/media/MediaCentralModal';
import { SongListItem } from '@/components/songs/SongListItem';
import { TasksSection } from '@/components/tasks/TasksSection';
import { AddItemModal } from '@/components/common/AddItemModal';
import { groupMembers, GroupMember } from '@/data/groupMembers';
import { toast } from 'sonner';
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
  Database,
  LayoutGrid,
  List,
  Eye,
  Plus
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'agenda' | 'repertoire' | 'tasks'>('agenda');
  const [events, setEvents] = useState<EventItem[]>(mockEvents);
  const [songs, setSongs] = useState<SongItem[]>(mockSongs);
  const [tasks, setTasks] = useState<TaskItem[]>(mockTasks);
  
  // Member authentication & RBAC state
  const [currentMember, setCurrentMember] = useState<GroupMember | null>(null);
  const [membersList, setMembersList] = useState<GroupMember[]>(groupMembers);
  
  // 🛠️ DEV Vision Simulator State
  const [simulatedRole, setSimulatedRole] = useState<'DEV' | 'ADM' | 'MEDIA' | 'MEMBER'>('DEV');

  // Modais State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [selectedNotionEvent, setSelectedNotionEvent] = useState<EventItem | null>(null);
  const [eventResponses, setEventResponses] = useState<EventResponseRow[]>([]);

  // Agenda View Mode State (Lista vs Calendário Mensal Notion-Style)
  const [agendaViewMode, setAgendaViewMode] = useState<'list' | 'calendar'>('calendar');

  // Item Add/Edit Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [modalInitialType, setModalInitialType] = useState<'event' | 'song' | 'task'>('event');
  const [modalHideTypeSelector, setModalHideTypeSelector] = useState(false);
  const [editingItem, setEditingItem] = useState<EventItem | SongItem | TaskItem | null>(null);
  const [dbStatus, setDbStatus] = useState<'supabase' | 'mock'>(isSupabaseConfigured ? 'supabase' : 'mock');

  // Papel Efetivo Ativo (Permite simulação em tempo real para DEV)
  const effectiveRole = currentMember?.role === 'DEV' ? simulatedRole : (currentMember?.role || 'MEMBER');
  const canCreate = effectiveRole === 'ADM' || effectiveRole === 'DEV';
  const canAccessMedia = effectiveRole === 'MEDIA' || effectiveRole === 'ADM' || effectiveRole === 'DEV';

  // Carregar membro salvo ou redirecionar para /login
  useEffect(() => {
    try {
      const localSavedStr = localStorage.getItem('ellos_current_member');
      const sessionSavedStr = sessionStorage.getItem('ellos_current_member');
      const savedMemberStr = localSavedStr || sessionSavedStr;

      if (savedMemberStr) {
        const parsed: GroupMember = JSON.parse(savedMemberStr);
        if (parsed && parsed.name) {
          setCurrentMember(parsed);
          setSimulatedRole(parsed.role as 'DEV' | 'ADM' | 'MEDIA' | 'MEMBER');
        } else {
          router.replace('/login');
        }
      } else {
        router.replace('/login');
      }
    } catch {
      router.replace('/login');
    }
  }, [router]);

  const handleLogout = async () => {
    localStorage.removeItem('ellos_current_member');
    sessionStorage.removeItem('ellos_current_member');
    if (supabase && isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setCurrentMember(null);
    toast.info('👋 Você saiu da sua conta.');
    router.replace('/login');
  };

  // Supabase Loaders
  const fetchProfilesFromSupabase = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (!error && data && data.length > 0) {
        setMembersList(
          data.map((row) => ({
            id: row.id,
            email: row.email,
            name: row.name,
            voice: row.voice,
            role: row.role,
          }))
        );
      }
    } catch (err) {
      console.warn('Supabase profiles fetch error:', err);
    }
  };

  const fetchEventsFromSupabase = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('events').select('*').order('created_at', { ascending: false });
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
            contactName: row.contact_name || undefined,
            contactPhone: row.contact_phone || undefined,
            notes: row.notes || undefined,
            dressCode: row.dress_code || undefined,
            microphonesCount: row.mic_count || 4,
            schedule: Array.isArray(row.schedule) ? row.schedule : undefined,
            drivers: Array.isArray(row.drivers) ? row.drivers : [],
            passengers: Array.isArray(row.passengers) ? row.passengers : [],
            votesCount: row.status === 'PROPOSAL' ? { yes: row.votes_yes ?? 1, total: row.votes_total ?? 9 } : undefined,
            userVoted: false,
            votingDeadline: row.voting_deadline || undefined,
            isVotingClosed: Boolean(row.is_voting_closed),
          }))
        );
        setDbStatus('supabase');
      }
    } catch (err) {
      console.warn('Supabase events fetch error:', err);
    }
  };

  const fetchSongsFromSupabase = async () => {
    if (!supabase) return;
    try {
      const { data: songsData, error: songsErr } = await supabase.from('songs').select('*').order('created_at', { ascending: false });
      const { data: kitsData } = await supabase.from('song_voice_kits').select('*');
      if (!songsErr && songsData && songsData.length > 0) {
        setSongs(
          songsData.map((row) => {
            const voiceKits = (kitsData || [])
              .filter((vk) => vk.song_id === row.id)
              .map((vk) => ({ label: vk.label, driveUrl: vk.drive_url }));
            const defaultDrive = row.general_drive_url || 'https://drive.google.com';

            return {
              id: row.id,
              title: row.title,
              artistOrGroup: row.artist_or_group || undefined,
              keySignature: row.key_signature || undefined,
              bpm: row.bpm || undefined,
              tags: Array.isArray(row.tags) ? row.tags : [],
              status: row.status,
              generalDriveFolderUrl: defaultDrive,
              sheetMusicUrl: row.sheet_music_url || undefined,
              voiceKits: voiceKits.length > 0 ? voiceKits : [
                { label: 'Soprano', driveUrl: defaultDrive },
                { label: 'Contralto', driveUrl: defaultDrive },
                { label: 'Tenor', driveUrl: defaultDrive },
                { label: 'Baixo', driveUrl: defaultDrive },
              ],
            };
          })
        );
        setDbStatus('supabase');
      }
    } catch (err) {
      console.warn('Supabase songs fetch error:', err);
    }
  };

  const fetchTasksFromSupabase = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        setTasks(
          data.map((row) => ({
            id: row.id,
            description: row.description,
            category: row.category,
            dueDate: row.due_date || undefined,
            isDone: Boolean(row.is_done),
            assignedTo: row.assigned_to || undefined,
          }))
        );
        setDbStatus('supabase');
      }
    } catch (err) {
      console.warn('Supabase tasks fetch error:', err);
    }
  };

  const fetchResponsesFromSupabase = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('event_responses').select('*');
      if (!error && data) {
        setEventResponses(data as EventResponseRow[]);
      }
    } catch (err) {
      console.warn('Supabase responses fetch error:', err);
    }
  };

  useEffect(() => {
    const client = supabase;
    if (!client || !isSupabaseConfigured) return;

    fetchProfilesFromSupabase();
    fetchEventsFromSupabase();
    fetchSongsFromSupabase();
    fetchTasksFromSupabase();
    fetchResponsesFromSupabase();

    // Supabase Realtime Subscriptions
    const eventsChannel = client
      .channel('public:events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        fetchEventsFromSupabase();
      })
      .subscribe();

    const songsChannel = client
      .channel('public:songs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'songs' }, () => {
        fetchSongsFromSupabase();
      })
      .subscribe();

    const tasksChannel = client
      .channel('public:tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchTasksFromSupabase();
      })
      .subscribe();

    const responsesChannel = client
      .channel('public:event_responses')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_responses' }, () => {
        fetchResponsesFromSupabase();
      })
      .subscribe();

    const profilesChannel = client
      .channel('public:profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchProfilesFromSupabase();
      })
      .subscribe();

    return () => {
      client.removeChannel(eventsChannel);
      client.removeChannel(songsChannel);
      client.removeChannel(tasksChannel);
      client.removeChannel(responsesChannel);
      client.removeChannel(profilesChannel);
    };
  }, []);

  const handleOpenHeaderModal = () => {
    if (!canCreate) {
      toast.error('⚠️ Apenas Regência (ADM) ou DEV podem criar novos itens.');
      return;
    }
    setModalMode('create');
    setEditingItem(null);
    setModalInitialType('event');
    setModalHideTypeSelector(false);
    setIsAddModalOpen(true);
  };

  const handleOpenAddModal = (type: 'event' | 'song' | 'task' = 'event', hideSelector = true) => {
    if (!canCreate) {
      toast.error('⚠️ Apenas Regência (ADM) ou DEV podem criar novos itens.');
      return;
    }
    setModalMode('create');
    setEditingItem(null);
    setModalInitialType(type);
    setModalHideTypeSelector(hideSelector);
    setIsAddModalOpen(true);
  };

  const handleOpenEditEvent = (event: EventItem) => {
    if (!canCreate) {
      toast.error('⚠️ Apenas Regência (ADM) ou DEV podem editar eventos.');
      return;
    }
    setModalMode('edit');
    setEditingItem(event);
    setModalInitialType('event');
    setModalHideTypeSelector(true);
    setIsAddModalOpen(true);
  };

  const handleOpenEditSong = (song: SongItem) => {
    if (!canCreate) {
      toast.error('⚠️ Apenas Regência (ADM) ou DEV podem editar músicas.');
      return;
    }
    setModalMode('edit');
    setEditingItem(song);
    setModalInitialType('song');
    setModalHideTypeSelector(true);
    setIsAddModalOpen(true);
  };

  const handleOpenEditTask = (task: TaskItem) => {
    if (!canCreate) {
      toast.error('⚠️ Apenas Regência (ADM) ou DEV podem editar tarefas.');
      return;
    }
    setModalMode('edit');
    setEditingItem(task);
    setModalInitialType('task');
    setModalHideTypeSelector(true);
    setIsAddModalOpen(true);
  };

  // Agenda Filter State
  const [agendaFilter, setAgendaFilter] = useState<'ALL' | 'CONFIRMED' | 'PROPOSAL' | 'INTERNAL'>('ALL');

  // Repertoire Filter & Search State
  const [songSearch, setSongSearch] = useState('');
  const [songStatusFilter, setSongStatusFilter] = useState<'ALL' | 'READY' | 'REHEARSING' | 'TO_LEARN'>('ALL');

  // Votação de presença em 1 toque
  const handleToggleVote = async (
    eventId: string,
    memberOverride?: GroupMember | null,
    statusOverride?: 'YES' | 'NO' | 'MAYBE',
    note?: string
  ) => {
    const activeMember = memberOverride || currentMember;
    if (!activeMember) {
      router.replace('/login');
      return;
    }

    let updatedEvent: EventItem | undefined;
    const targetStatus = statusOverride || 'YES';

    setEvents((prev) =>
      prev.map((evt) => {
        if (evt.id === eventId && evt.votesCount) {
          const isCurrentlyVoted = !!evt.userVoted;
          const newYesCount = targetStatus === 'YES'
            ? evt.votesCount.yes + (isCurrentlyVoted ? 0 : 1)
            : Math.max(0, evt.votesCount.yes - (isCurrentlyVoted ? 1 : 0));
          const item = {
            ...evt,
            userVoted: targetStatus === 'YES',
            votesCount: {
              ...evt.votesCount,
              yes: newYesCount,
            },
          };
          updatedEvent = item;
          return item;
        }
        return evt;
      })
    );

    setEventResponses((prev) => {
      const filtered = prev.filter((r) => !(r.event_id === eventId && r.member_id === activeMember.id));
      return [
        ...filtered,
        {
          event_id: eventId,
          member_id: activeMember.id,
          member_name: activeMember.name,
          voice: activeMember.voice,
          status: targetStatus,
          note: note || undefined,
        },
      ];
    });

    if (supabase) {
      await supabase.from('event_responses').upsert({
        event_id: eventId,
        member_id: activeMember.id,
        member_name: activeMember.name,
        voice: activeMember.voice,
        status: targetStatus,
        note: note || null,
      });

      if (updatedEvent) {
        await supabase.from('events').upsert({
          id: updatedEvent.id,
          title: updatedEvent.title,
          category: updatedEvent.category,
          status: updatedEvent.status,
          date: updatedEvent.date || null,
          time: updatedEvent.time || null,
          location: updatedEvent.location || null,
          contact_name: updatedEvent.contactName || null,
          contact_phone: updatedEvent.contactPhone || null,
          notes: updatedEvent.notes || null,
          dress_code: updatedEvent.dressCode || null,
          mic_count: updatedEvent.microphonesCount || 4,
          schedule: updatedEvent.schedule || [],
          drivers: updatedEvent.drivers || [],
          passengers: updatedEvent.passengers || [],
          votes_yes: updatedEvent.votesCount?.yes ?? 1,
          votes_total: updatedEvent.votesCount?.total ?? 9,
          voting_deadline: updatedEvent.votingDeadline || null,
          is_voting_closed: updatedEvent.isVotingClosed || false,
        });
      }
    }
  };

  const handleToggleTask = async (taskId: string) => {
    let updatedTask: TaskItem | undefined;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const item = { ...t, isDone: !t.isDone };
          updatedTask = item;
          return item;
        }
        return t;
      })
    );

    if (supabase && updatedTask) {
      await supabase.from('tasks').upsert({
        id: updatedTask.id,
        description: updatedTask.description,
        category: updatedTask.category,
        due_date: updatedTask.dueDate || null,
        is_done: updatedTask.isDone,
        assigned_to: updatedTask.assignedTo || null,
      });
    }
  };

  const handleAddEvent = async (newEvent: EventItem) => {
    setEvents((prev) => [newEvent, ...prev]);
    toast.success('✨ Evento cadastrado com sucesso!');
    if (supabase) {
      await supabase.from('events').upsert({
        id: newEvent.id,
        title: newEvent.title,
        category: newEvent.category,
        status: newEvent.status,
        date: newEvent.date || null,
        time: newEvent.time || null,
        location: newEvent.location || null,
        contact_name: newEvent.contactName || null,
        contact_phone: newEvent.contactPhone || null,
        notes: newEvent.notes || null,
        dress_code: newEvent.dressCode || null,
        mic_count: newEvent.microphonesCount || 4,
        schedule: newEvent.schedule || [],
        drivers: newEvent.drivers || [],
        passengers: newEvent.passengers || [],
        votes_yes: newEvent.votesCount?.yes ?? 1,
        votes_total: newEvent.votesCount?.total ?? 9,
        voting_deadline: newEvent.votingDeadline || null,
        is_voting_closed: newEvent.isVotingClosed || false,
      });
    }
  };

  const handleUpdateEvent = async (updatedEvent: EventItem) => {
    setEvents((prev) => prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e)));
    if (selectedNotionEvent && selectedNotionEvent.id === updatedEvent.id) {
      setSelectedNotionEvent(updatedEvent);
    }
    toast.success('✨ Alterações do evento salvas!');
    if (supabase) {
      await supabase.from('events').upsert({
        id: updatedEvent.id,
        title: updatedEvent.title,
        category: updatedEvent.category,
        status: updatedEvent.status,
        date: updatedEvent.date || null,
        time: updatedEvent.time || null,
        location: updatedEvent.location || null,
        contact_name: updatedEvent.contactName || null,
        contact_phone: updatedEvent.contactPhone || null,
        notes: updatedEvent.notes || null,
        dress_code: updatedEvent.dressCode || null,
        mic_count: updatedEvent.microphonesCount || 4,
        schedule: updatedEvent.schedule || [],
        drivers: updatedEvent.drivers || [],
        passengers: updatedEvent.passengers || [],
        votes_yes: updatedEvent.votesCount?.yes ?? 1,
        votes_total: updatedEvent.votesCount?.total ?? 9,
        voting_deadline: updatedEvent.votingDeadline || null,
        is_voting_closed: updatedEvent.isVotingClosed || false,
      });
    }
  };

  const handleAddSong = async (newSong: SongItem) => {
    setSongs((prev) => [newSong, ...prev]);
    toast.success('✨ Música adicionada ao repertório!');
    if (supabase) {
      await supabase.from('songs').upsert({
        id: newSong.id,
        title: newSong.title,
        artist_or_group: newSong.artistOrGroup || null,
        key_signature: newSong.keySignature || null,
        bpm: newSong.bpm ? Number(newSong.bpm) : null,
        tags: newSong.tags || [],
        status: newSong.status,
        general_drive_url: newSong.generalDriveFolderUrl || null,
        sheet_music_url: newSong.sheetMusicUrl || null,
      });

      if (newSong.voiceKits && newSong.voiceKits.length > 0) {
        await supabase.from('song_voice_kits').delete().eq('song_id', newSong.id);
        const kitsToInsert = newSong.voiceKits.map((vk) => ({
          song_id: newSong.id,
          label: vk.label,
          drive_url: vk.driveUrl,
        }));
        await supabase.from('song_voice_kits').insert(kitsToInsert);
      }
    }
  };

  const handleUpdateSong = async (updatedSong: SongItem) => {
    setSongs((prev) => prev.map((s) => (s.id === updatedSong.id ? updatedSong : s)));
    toast.success('✨ Alterações da música salvas!');
    if (supabase) {
      await supabase.from('songs').upsert({
        id: updatedSong.id,
        title: updatedSong.title,
        artist_or_group: updatedSong.artistOrGroup || null,
        key_signature: updatedSong.keySignature || null,
        bpm: updatedSong.bpm ? Number(updatedSong.bpm) : null,
        tags: updatedSong.tags || [],
        status: updatedSong.status,
        general_drive_url: updatedSong.generalDriveFolderUrl || null,
        sheet_music_url: updatedSong.sheetMusicUrl || null,
      });

      if (updatedSong.voiceKits && updatedSong.voiceKits.length > 0) {
        await supabase.from('song_voice_kits').delete().eq('song_id', updatedSong.id);
        const kitsToInsert = updatedSong.voiceKits.map((vk) => ({
          song_id: updatedSong.id,
          label: vk.label,
          drive_url: vk.driveUrl,
        }));
        await supabase.from('song_voice_kits').insert(kitsToInsert);
      }
    }
  };

  const handleAddTask = async (newTask: TaskItem) => {
    setTasks((prev) => [newTask, ...prev]);
    toast.success('✨ Tarefa registrada com sucesso!');
    if (supabase) {
      await supabase.from('tasks').upsert({
        id: newTask.id,
        description: newTask.description,
        category: newTask.category,
        due_date: newTask.dueDate || null,
        is_done: newTask.isDone,
        assigned_to: newTask.assignedTo || null,
      });
    }
  };

  const handleUpdateTask = async (updatedTask: TaskItem) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    toast.success('✨ Alterações da tarefa salvas!');
    if (supabase) {
      await supabase.from('tasks').upsert({
        id: updatedTask.id,
        description: updatedTask.description,
        category: updatedTask.category,
        due_date: updatedTask.dueDate || null,
        is_done: updatedTask.isDone,
        assigned_to: updatedTask.assignedTo || null,
      });
    }
  };

  // Delete handlers
  const handleDeleteEvent = async (eventId: string) => {
    if (!canCreate) {
      toast.error('⚠️ Apenas Regência (ADM) ou DEV podem excluir eventos.');
      return;
    }
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    toast.success('🗑️ Evento excluído!');
    await deleteEventFromSupabase(eventId);
  };

  const handleDeleteSong = async (songId: string) => {
    if (!canCreate) {
      toast.error('⚠️ Apenas Regência (ADM) ou DEV podem excluir músicas.');
      return;
    }
    setSongs((prev) => prev.filter((s) => s.id !== songId));
    toast.success('🗑️ Música excluída do repertório!');
    await deleteSongFromSupabase(songId);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!canCreate) {
      toast.error('⚠️ Apenas Regência (ADM) ou DEV podem excluir tarefas.');
      return;
    }
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    toast.success('🗑️ Tarefa excluída!');
    await deleteTaskFromSupabase(taskId);
  };

  // Computations for Top Banners
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
    <div className="min-h-screen max-h-screen h-screen overflow-hidden flex flex-col bg-slate-50 dark:bg-[#0F223D] transition-colors duration-200 font-sans">
      {/* Navigation Header com Logo SVG & Hamburger Menu */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentMember={currentMember}
        effectiveRole={effectiveRole}
        onOpenSidebar={() => setIsSidebarOpen(true)}
        onOpenAddModal={handleOpenHeaderModal}
      />

      {/* Main Container Scrollable (Fit & Clean) */}
      <main className="flex-1 overflow-y-auto no-scrollbar max-w-6xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Database Status & Active Member Indicator Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white dark:bg-[#1B365D] border border-slate-200/90 dark:border-amber-500/20 px-4 py-2.5 rounded-xl text-xs gap-2 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <Database className="w-4 h-4 text-gold-500 shrink-0" />
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              Banco de Dados:
            </span>
            {dbStatus === 'supabase' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Supabase Realtime
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Modo Local (Demo)
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 ml-auto sm:ml-0">
            {currentMember && (
              <span className="text-[11px] text-slate-600 dark:text-gold-300 font-semibold bg-slate-100 dark:bg-navy-950 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-gold-500/20 flex items-center gap-1">
                <span>Membro Logado:</span>
                <strong className="text-slate-900 dark:text-white">{currentMember.name} ({currentMember.role})</strong>
              </span>
            )}

            {currentMember?.role === 'DEV' && (
              <span className="text-[11px] font-bold bg-amber-500/20 text-gold-300 px-2 py-1 rounded-lg border border-amber-500/30 flex items-center gap-1">
                <Eye className="w-3 h-3 text-gold-400" />
                <span>Simulando: <strong>{effectiveRole}</strong></span>
              </span>
            )}

            <span className="text-[11px] text-slate-400 hidden lg:inline">
              {events.length} eventos • {songs.length} músicas • {tasks.length} tarefas
            </span>
          </div>
        </div>

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
                if (nextConfirmedEvent) setSelectedNotionEvent(nextConfirmedEvent);
                else {
                  setActiveTab('agenda');
                  setAgendaFilter('CONFIRMED');
                }
              }}
              className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-white hover:underline pt-2 border-t border-white/20 cursor-pointer"
            >
              <span>Abrir Ficha Completa</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: Proposals Pending Vote Alert */}
          <div className="bg-gradient-to-br from-gold-500 to-gold-700 text-navy-950 rounded-2xl p-5 shadow-lg shadow-gold-900/10 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute right-[-10px] bottom-[-10px] opacity-15 text-navy-950 pointer-events-none transition-transform group-hover:scale-110">
              <Vote className="w-32 h-32" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-navy-950/10 backdrop-blur-md px-2.5 py-1 rounded-full text-navy-900">
                  <Vote className="w-3.5 h-3.5" />
                  Votação de Convites
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black">{pendingProposalsCount}</span>
                  <span className="text-sm font-medium text-navy-900/80">convites em análise</span>
                </div>
                <p className="text-xs text-navy-900/70">
                  Aguardando confirmação de presença dos integrantes do Ellos.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setActiveTab('agenda');
                setAgendaFilter('PROPOSAL');
              }}
              className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-navy-950 hover:underline pt-2 border-t border-navy-950/20 cursor-pointer"
            >
              <span>Votar nos convites</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 3: Quick Task Overview */}
          <div className="bg-gradient-to-br from-navy-800 to-navy-950 text-white rounded-2xl p-5 shadow-lg shadow-navy-950/20 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute right-[-10px] bottom-[-10px] opacity-15 text-white pointer-events-none transition-transform group-hover:scale-110">
              <ListTodo className="w-32 h-32" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-gold-500/15 backdrop-blur-md px-2.5 py-1 rounded-full text-gold-300 border border-gold-500/20">
                  <Sparkles className="w-3.5 h-3.5" />
                  Painel de Tarefas
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black">{completedTasksCount} / {tasks.length}</span>
                  <span className="text-sm font-medium text-slate-300">tarefas concluídas</span>
                </div>
                <p className="text-xs text-slate-400">
                  Divulgações, ensaios, confras e contatos logísticos.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('tasks')}
              className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-gold-300 hover:underline pt-2 border-t border-white/10 cursor-pointer"
            >
              <span>Gerenciar tarefas</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

        {/* TAB CONTENT SECTIONS */}

        {/* TAB 1: AGENDA & CONVITES (Alternador Lista vs Calendário Mensal) */}
        {activeTab === 'agenda' && (
          <section className="space-y-5 animate-in fade-in duration-200">
            {/* Filter Sub-bar & View Mode Toggle */}
            <div className="bg-white dark:bg-[#1B365D] border border-slate-200/90 dark:border-amber-500/20 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center justify-between w-full sm:w-auto gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-navy-700 dark:text-gold-400" />
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Agenda de Apresentações &amp; Convites
                  </h2>
                </div>

                {canCreate && (
                  <button
                    onClick={() => handleOpenAddModal('event', true)}
                    className="sm:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-slate-950 hover:brightness-110 shadow-xs transition-all active:scale-95 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Novo Evento</span>
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                {/* Visualizador Modo Alternador: Lista vs Calendário */}
                <div className="flex items-center p-1 bg-slate-100 dark:bg-navy-950 rounded-xl border border-slate-200 dark:border-navy-800">
                  <button
                    onClick={() => setAgendaViewMode('calendar')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      agendaViewMode === 'calendar'
                        ? 'bg-navy-800 dark:bg-gold-500 text-white dark:text-navy-950 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Visão Calendário</span>
                  </button>

                  <button
                    onClick={() => setAgendaViewMode('list')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      agendaViewMode === 'list'
                        ? 'bg-navy-800 dark:bg-gold-500 text-white dark:text-navy-950 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>Visão Lista</span>
                  </button>
                </div>

                {/* Filtros por Status */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setAgendaFilter('ALL')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      agendaFilter === 'ALL'
                        ? 'bg-navy-800 dark:bg-gold-500 text-white dark:text-navy-950'
                        : 'bg-slate-100 text-slate-600 dark:bg-navy-950/60 dark:text-slate-300'
                    }`}
                  >
                    Todos ({events.length})
                  </button>
                  <button
                    onClick={() => setAgendaFilter('CONFIRMED')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      agendaFilter === 'CONFIRMED'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600 dark:bg-navy-950/60 dark:text-slate-300'
                    }`}
                  >
                    Confirmados ({events.filter((e) => e.status === 'CONFIRMED').length})
                  </button>
                  <button
                    onClick={() => setAgendaFilter('PROPOSAL')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      agendaFilter === 'PROPOSAL'
                        ? 'bg-gold-500 text-navy-950 font-bold'
                        : 'bg-slate-100 text-slate-600 dark:bg-navy-950/60 dark:text-slate-300'
                    }`}
                  >
                    Votação ({events.filter((e) => e.status === 'PROPOSAL').length})
                  </button>
                </div>

                {canCreate && (
                  <button
                    onClick={() => handleOpenAddModal('event', true)}
                    className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-slate-950 hover:brightness-110 shadow-xs transition-all active:scale-95 shrink-0 ml-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Novo Convite</span>
                  </button>
                )}
              </div>
            </div>

            {/* RENDERIZAÇÃO CONFORME MODO SELECIONADO */}
            {agendaViewMode === 'calendar' ? (
              <MonthlyCalendarView
                events={filteredEvents}
                onSelectEvent={(evt) => setSelectedNotionEvent(evt)}
                onOpenAddModal={() => handleOpenAddModal('event', true)}
                canCreate={canCreate}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredEvents.map((evt) => (
                  <div
                    key={evt.id}
                    onClick={() => setSelectedNotionEvent(evt)}
                    className="cursor-pointer hover:border-amber-500/40 hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <EventCard
                      event={evt}
                      songs={songs}
                      currentMember={currentMember}
                      onToggleVote={handleToggleVote}
                      onEditEvent={canCreate ? handleOpenEditEvent : undefined}
                      onDeleteEvent={canCreate ? handleDeleteEvent : undefined}
                      eventResponses={eventResponses}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 2: REPERTÓRIO & KITS DRIVE */}
        {activeTab === 'repertoire' && (
          <section className="space-y-5 animate-in fade-in duration-200">
            {/* Search & Filter Bar */}
            <div className="bg-white dark:bg-[#1B365D] border border-slate-200/90 dark:border-amber-500/20 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar música, tom ou tag..."
                  value={songSearch}
                  onChange={(e) => setSongSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-navy-600"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between md:justify-end gap-2 w-full md:w-auto">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-1">
                    <Filter className="w-3.5 h-3.5" />
                    Status:
                  </span>
                  <button
                    onClick={() => setSongStatusFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      songStatusFilter === 'ALL'
                        ? 'bg-navy-800 dark:bg-gold-500 text-white dark:text-navy-950 shadow-xs'
                        : 'bg-slate-100 text-slate-600 dark:bg-navy-950/60 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    Todas ({songs.length})
                  </button>
                  <button
                    onClick={() => setSongStatusFilter('REHEARSING')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      songStatusFilter === 'REHEARSING'
                        ? 'bg-navy-800 dark:bg-gold-500 text-white dark:text-navy-950 shadow-xs'
                        : 'bg-slate-100 text-slate-600 dark:bg-navy-950/60 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    Em Ensaio ({songs.filter((s) => s.status === 'REHEARSING').length})
                  </button>
                  <button
                    onClick={() => setSongStatusFilter('READY')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      songStatusFilter === 'READY'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 dark:bg-navy-950/60 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    Prontas ({songs.filter((s) => s.status === 'READY').length})
                  </button>
                  <button
                    onClick={() => setSongStatusFilter('TO_LEARN')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      songStatusFilter === 'TO_LEARN'
                        ? 'bg-gradient-to-r from-gold-500 to-gold-700 text-slate-950 shadow-xs'
                        : 'bg-slate-100 text-slate-600 dark:bg-navy-950/60 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    A Aprender ({songs.filter((s) => s.status === 'TO_LEARN').length})
                  </button>
                </div>

                {canCreate && (
                  <button
                    onClick={() => handleOpenAddModal('song', true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-slate-950 hover:brightness-110 shadow-xs transition-all active:scale-95 shrink-0 ml-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nova Música</span>
                  </button>
                )}
              </div>
            </div>

            {/* List of Repertoire Songs */}
            <div className="space-y-4">
              {filteredSongs.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-[#1B365D] border border-slate-200/90 dark:border-amber-500/20 rounded-2xl">
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
                  <div
                    key={song.id}
                    className="hover:border-amber-500/40 hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <SongListItem
                      song={song}
                      onEditSong={canCreate ? handleOpenEditSong : undefined}
                      onDeleteSong={canCreate ? handleDeleteSong : undefined}
                    />
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* TAB 3: TAREFAS & BACKLOG */}
        {activeTab === 'tasks' && (
          <section className="animate-in fade-in duration-200">
            <TasksSection
              tasks={tasks}
              onToggleTask={handleToggleTask}
              onAddTask={canCreate ? handleAddTask : undefined}
              onOpenAddModal={canCreate ? (type) => handleOpenAddModal(type, true) : undefined}
              onEditTask={canCreate ? handleOpenEditTask : undefined}
              onDeleteTask={canCreate ? handleDeleteTask : undefined}
            />
          </section>
        )}

      </main>

      {/* Footer Limpo e Profissional */}
      <footer className="mt-auto border-t border-slate-200/80 dark:border-gold-500/10 py-3.5 bg-white dark:bg-[#0F223D] text-center text-xs text-slate-500 dark:text-slate-400 shrink-0">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-gold-500" />
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Ellos Hub &copy; {new Date().getFullYear()}
            </span>
            <span>— Organização &amp; Gestão Musical Restrita</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Plataforma PWA &amp; RBAC oficial do Grupo Vocal Ellos
          </p>
        </div>
      </footer>

      {/* Menu Lateral Retrátil (Sidebar Drawer) */}
      <SidebarDrawer
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentMember={currentMember}
        effectiveRole={effectiveRole}
        simulatedRole={simulatedRole}
        onSimulatedRoleChange={setSimulatedRole}
        onOpenAddModal={handleOpenHeaderModal}
        onOpenMediaModal={() => setIsMediaModalOpen(true)}
        onOpenDevModal={() => router.push('/dev')}
        onLogout={handleLogout}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Modal Ficha Completa Notion-Style Expandida */}
      <EventNotionModal
        isOpen={!!selectedNotionEvent}
        onClose={() => setSelectedNotionEvent(null)}
        event={selectedNotionEvent}
        songs={songs}
        currentMember={currentMember}
        effectiveRole={effectiveRole}
        onToggleVote={handleToggleVote}
        onUpdateEvent={handleUpdateEvent}
        eventResponses={eventResponses}
      />

      {/* Modal Central de Mídia */}
      <MediaCentralModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        events={events}
      />

      {/* Add / Edit Item Modal */}
      <AddItemModal
        isOpen={isAddModalOpen}
        mode={modalMode}
        initialType={modalInitialType}
        hideTypeSelector={modalHideTypeSelector}
        editingItem={editingItem}
        onClose={() => setIsAddModalOpen(false)}
        onAddEvent={handleAddEvent}
        onUpdateEvent={handleUpdateEvent}
        onAddSong={handleAddSong}
        onUpdateSong={handleUpdateSong}
        onAddTask={handleAddTask}
        onUpdateTask={handleUpdateTask}
      />
    </div>
  );
}
