'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EventItem, SongItem, TaskItem } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { 
  fetchUserProfileById,
  mapProfileToGroupMember
} from '@/services/api';
import { Navbar } from '@/components/layout/Navbar';
import { SidebarDrawer } from '@/components/layout/SidebarDrawer';
import { EventCard, EventResponseRow } from '@/components/events/EventCard';
import { MonthlyCalendarView } from '@/components/events/MonthlyCalendarView';
import { EventNotionModal } from '@/components/events/EventNotionModal';
import { MediaCentralModal } from '@/components/media/MediaCentralModal';
import { AdminPanelModal } from '@/components/admin/AdminPanelModal';
import { DevPanelModal } from '@/components/admin/DevPanelModal';
import { SongListItem } from '@/components/songs/SongListItem';
import { TasksSection } from '@/components/tasks/TasksSection';
import { AddItemModal } from '@/components/common/AddItemModal';
import { groupMembers, GroupMember } from '@/data/groupMembers';
import { toast } from 'sonner';
import { getFilteredNavLinks } from '@/config/navigation';
import { formatDateBR } from '@/lib/dateUtils';
import { useTenant } from '@/context/TenantContext';
import { useWorkspaceRole } from '@/hooks/useWorkspaceRole';
import { 
  Calendar, 
  CalendarX,
  Vote, 
  Search, 
  Filter, 
  CheckCircle2, 
  Music, 
  ListTodo,
  Sparkles,
  ChevronRight,
  LayoutGrid,
  List,
  Eye,
  Plus,
  Layers,
  Menu
} from 'lucide-react';

export default function WorkspaceAgendaPage() {
  const router = useRouter();
  const { workspace, tenant, slug } = useTenant();
  const [activeTab, setActiveTab] = useState<'agenda' | 'repertoire' | 'tasks'>('agenda');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [songs, setSongs] = useState<SongItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  
  // Member authentication & RBAC state
  const [currentMember, setCurrentMember] = useState<GroupMember | null>(null);
  const [membersList, setMembersList] = useState<GroupMember[]>(groupMembers);
  
  // 🛠️ DEV Vision Simulator State
  const [simulatedRole, setSimulatedRole] = useState<'DEV' | 'ADM' | 'MEDIA' | 'MEMBER'>('DEV');

  // Modais State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isDevModalOpen, setIsDevModalOpen] = useState(false);
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

  // Papel dentro DESTE workspace, lido de workspace_members (fonte de
  // verdade do RBAC multitenant) e traduzido pro enum legado — substitui
  // a leitura antiga de currentMember.role (profiles.role, global).
  const { role: workspaceRole } = useWorkspaceRole(workspace?.id, currentMember?.id);
  const isRealDev = workspaceRole === 'DEV';

  // Papel Efetivo Ativo (Permite simulação em tempo real para DEV)
  const effectiveRole = isRealDev ? simulatedRole : (workspaceRole || 'MEMBER');
  const canCreate = effectiveRole === 'ADM' || effectiveRole === 'DEV';

  // Carregar membro salvo ou verificar sessão ativa no Supabase Auth
  useEffect(() => {
    const initSession = async () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('login') === 'success') {
        toast.success('✨ Login realizado com sucesso!');
        window.history.replaceState({}, '', window.location.pathname);
      }

      try {
        if (supabase && isSupabaseConfigured) {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session?.user) {
            const user = sessionData.session.user;
            const { profile, error: profileErr } = await fetchUserProfileById(user.id);

            if (profile && !profileErr) {
              const memberObj = mapProfileToGroupMember(profile);
              localStorage.setItem('ellos_current_member', JSON.stringify(memberObj));
              setCurrentMember(memberObj);
              setSimulatedRole(memberObj.role as 'DEV' | 'ADM' | 'MEDIA' | 'MEMBER');
              return;
            } else {
              localStorage.removeItem('ellos_current_member');
              sessionStorage.removeItem('ellos_current_member');
              toast.error('Perfil de usuário não foi encontrado no sistema. Por favor, faça login novamente.');
              router.replace('/login');
              return;
            }
          }
        }

        const localSavedStr = localStorage.getItem('ellos_current_member');
        const sessionSavedStr = sessionStorage.getItem('ellos_current_member');
        const savedMemberStr = localSavedStr || sessionSavedStr;

        if (savedMemberStr) {
          const parsed: GroupMember = JSON.parse(savedMemberStr);
          if (parsed && parsed.name && parsed.id) {
            setCurrentMember(parsed);
            setSimulatedRole(parsed.role as 'DEV' | 'ADM' | 'MEDIA' | 'MEMBER');
            return;
          }
        }

        router.replace('/login');
      } catch {
        router.replace('/login');
      }
    };

    initSession();
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
      let query = supabase.from('events').select('*').order('created_at', { ascending: false });
      
      if (workspace?.id) {
        query = query.eq('workspace_id', workspace.id);
      }

      const { data, error } = await query;
      if (!error && data) {
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
            isVotingClosed: false,
          }))
        );
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
      if (!songsErr && songsData) {
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
      }
    } catch (err) {
      console.warn('Supabase songs fetch error:', err);
    }
  };

  const fetchTasksFromSupabase = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
      if (!error && data) {
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
  }, [workspace?.id]);

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

  const formatDate = (dateStr?: string) => {
    return formatDateBR(dateStr);
  };

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
      await supabase.from('event_responses').upsert(
        {
          event_id: eventId,
          member_id: activeMember.id,
          member_name: activeMember.name,
          voice: activeMember.voice,
          status: targetStatus,
          note: note || null,
        },
        { onConflict: 'event_id,member_id' }
      );

      await fetchResponsesFromSupabase();

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
          workspace_id: workspace?.id || 'a0000000-0000-0000-0000-000000000001',
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

  const handleCreateEvent = async (formData: any) => {
    try {
      const payloadLimpo = {
        id: crypto.randomUUID(),
        title: formData.title || "Evento Sem Título",
        category: formData.category || "Geral",
        status: formData.status || "Pendente",
        date: formData.date || null,
        time: formData.time || null,
        location: formData.location || null,
        mic_count: formData.mic_count ? parseInt(formData.mic_count, 10) : 0,
        votes_yes: 0,
        votes_total: 0,
        workspace_id: workspace?.id || 'a0000000-0000-0000-0000-000000000001',
      };

      const { data, error } = await supabase!
        .from('events')
        .insert([payloadLimpo])
        .select()
        .single();

      if (error) {
        console.error("ERRO AO SALVAR NO BANCO:", error);
        alert(`Erro: ${error.message}`);
        return;
      }

      setEvents((prev) => [...prev, data]);
    } catch (err) {
      console.error("Erro no trycatch de criação:", err);
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
        mic_count: updatedEvent.microphonesCount ? parseInt(String(updatedEvent.microphonesCount), 10) : 4,
        schedule: updatedEvent.schedule || [],
        drivers: updatedEvent.drivers || [],
        passengers: updatedEvent.passengers || [],
        votes_yes: updatedEvent.votesCount?.yes ?? 1,
        votes_total: updatedEvent.votesCount?.total ?? 9,
        voting_deadline: updatedEvent.votingDeadline || null,
        workspace_id: workspace?.id || 'a0000000-0000-0000-0000-000000000001',
      });
    }
  };

  const handleAddSong = async (newSong: SongItem) => {
    const payloadDoBanco = {
      id: newSong.id || `song-${Date.now()}`,
      title: newSong.title || 'Sem título',
      artist_or_group: newSong.artistOrGroup || null,
      key_signature: newSong.keySignature || null,
      bpm: newSong.bpm ? parseInt(String(newSong.bpm), 10) : null,
      tags: newSong.tags && newSong.tags.length > 0 ? newSong.tags : ['Ellos'],
      status: newSong.status || 'REHEARSING',
      general_drive_url: newSong.generalDriveFolderUrl || null,
      sheet_music_url: newSong.sheetMusicUrl || null,
    };

    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('songs')
        .insert([payloadDoBanco])
        .select()
        .single();

      if (error) {
        console.error("ERRO COMPLETO DO SUPABASE:", error);
        alert(`Erro ao salvar: ${error.message}`);
        return;
      }

      let voiceKits = newSong.voiceKits || [];
      if (voiceKits.length > 0) {
        const kitsToInsert = voiceKits.map((vk) => ({
          song_id: data.id,
          label: vk.label,
          drive_url: vk.driveUrl,
        }));
        await supabase.from('song_voice_kits').insert(kitsToInsert);
      }

      const createdSong: SongItem = {
        id: data.id,
        title: data.title,
        artistOrGroup: data.artist_or_group || 'Ellos',
        keySignature: data.key_signature || 'C',
        bpm: data.bpm ? Number(data.bpm) : undefined,
        tags: data.tags || ['Ellos'],
        status: data.status,
        generalDriveFolderUrl: data.general_drive_url || 'https://drive.google.com',
        sheetMusicUrl: data.sheet_music_url || undefined,
        voiceKits,
      };

      setSongs((prev) => [createdSong, ...prev]);
      toast.success('✨ Música adicionada ao repertório!');
      return;
    }

    setSongs((prev) => [{ ...newSong, id: `song-local-${Date.now()}` }, ...prev]);
    toast.success('✨ Música adicionada localmente!');
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
    const payloadDoBanco = {
      id: newTask.id || `task-${Date.now()}`,
      description: newTask.description || 'Sem descrição',
      category: newTask.category || 'LOGISTICA',
      due_date: newTask.dueDate || null,
      is_done: Boolean(newTask.isDone),
      assigned_to: newTask.assignedTo || null,
    };

    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('tasks')
        .insert([payloadDoBanco])
        .select()
        .single();

      if (error) {
        console.error("ERRO COMPLETO DO SUPABASE:", error);
        alert(`Erro ao salvar: ${error.message}`);
        return;
      }

      const createdTask: TaskItem = {
        id: data.id,
        description: data.description,
        category: data.category,
        dueDate: data.due_date || undefined,
        isDone: Boolean(data.is_done),
        assignedTo: data.assigned_to || undefined,
      };

      setTasks((prev) => [createdTask, ...prev]);
      toast.success('✨ Tarefa registrada com sucesso!');
      return;
    }

    setTasks((prev) => [{ ...newTask, id: `task-local-${Date.now()}` }, ...prev]);
    toast.success('✨ Tarefa registrada localmente!');
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

  const handleDeleteEvent = async (idParaDeletar: string) => {
    try {
      const { data, error } = await supabase!
        .from('events')
        .delete()
        .eq('id', idParaDeletar)
        .select();

      if (error || !data || data.length === 0) {
        console.error("ERRO AO EXCLUIR NO BANCO:", error);
        alert("O banco não permitiu a exclusão ou o evento não existe mais.");
        return;
      }

      setEvents((prev) => prev.filter((evento) => evento.id !== idParaDeletar));
    } catch (err) {
      console.error("Erro no trycatch de exclusão:", err);
    }
  };

  const handleDeleteSong = async (songId: string) => {
    if (!canCreate) {
      toast.error('Apenas Regência (ADM) ou DEV podem excluir músicas.');
      return;
    }

    if (!songId) return;

    try {
      if (supabase && isSupabaseConfigured) {
        await supabase.from('song_voice_kits').delete().eq('song_id', songId);

        const { data, error } = await supabase
          .from('songs')
          .delete()
          .eq('id', songId)
          .select();

        if (error || !data || data.length === 0) {
          toast.error("Não foi possível excluir a música no banco.");
          return;
        }
      }

      setSongs((prev) => prev.filter((item) => item.id !== songId));
      toast.success("Música excluída com sucesso!");
    } catch (err) {
      console.error("Erro na exclusão:", err);
      toast.error("Ocorreu um erro inesperado ao tentar excluir.");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!canCreate) {
      toast.error('Apenas Regência (ADM) ou DEV podem excluir tarefas.');
      return;
    }

    if (!taskId) return;

    try {
      if (supabase && isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('tasks')
          .delete()
          .eq('id', taskId)
          .select();

        if (error || !data || data.length === 0) {
          toast.error("Não foi possível excluir a tarefa no banco.");
          return;
        }
      }

      setTasks((prev) => prev.filter((item) => item.id !== taskId));
      toast.success("Tarefa excluída com sucesso!");
    } catch (err) {
      console.error("Erro na exclusão:", err);
      toast.error("Ocorreu um erro inesperado ao tentar excluir.");
    }
  };

  const nextConfirmedEvent = events.find((e) => e.status === 'CONFIRMED');
  const pendingProposalsCount = events.filter((e) => e.status === 'PROPOSAL').length;
  const completedTasksCount = tasks.filter((t) => t.isDone).length;

  const filteredEvents = events.filter((evt) => {
    if (agendaFilter === 'ALL') return true;
    return evt.status === agendaFilter;
  });

  const filteredSongs = songs.filter((song) => {
    const matchesSearch =
      song.title.toLowerCase().includes(songSearch.toLowerCase()) ||
      song.tags.some((tag) => tag.toLowerCase().includes(songSearch.toLowerCase())) ||
      (song.keySignature && song.keySignature.toLowerCase().includes(songSearch.toLowerCase()));

    const matchesStatus =
      songStatusFilter === 'ALL' ? true : song.status === songStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const allowedNavLinks = getFilteredNavLinks(effectiveRole);
  const mainNavLinks = allowedNavLinks.filter((item) => item.section === 'MENU PRINCIPAL');
  const adminNavLinks = allowedNavLinks.filter((item) => {
    if (item.section !== 'ADMINISTRAÇÃO') return false;
    if (item.id === 'dev-panel' || item.modalKey === 'dev') {
      return effectiveRole === 'DEV';
    }
    return true;
  });

  const handleNavClick = (item: typeof allowedNavLinks[0]) => {
    if (item.type === 'tab' && item.tabId) {
      setActiveTab(item.tabId);
    } else if (item.type === 'modal') {
      if (item.modalKey === 'media') {
        setIsMediaModalOpen(true);
      } else if (item.modalKey === 'admin') {
        setIsAdminModalOpen(true);
      } else if (item.modalKey === 'dev') {
        setIsDevModalOpen(true);
      }
    }
  };

  const handleShareClick = () => {
    const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}/${slug || 'ellos'}/convite` : '';
    if (fullUrl) {
      navigator.clipboard.writeText(fullUrl);
      toast.success('🔗 Link público do Workspace copiado!', {
        description: `URL: ${fullUrl}`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-ellos-light dark:bg-ellos-navy text-slate-900 dark:text-white font-sans transition-colors duration-200">
      {/* 1. LEFT SIDEBAR */}
      <aside className="hidden md:flex flex-col w-16 lg:w-64 fixed inset-y-0 left-0 bg-[#0F172A] border-r border-gray-800 text-white z-30 p-2.5 lg:p-5 justify-between font-sans transition-all duration-300">
        <div className="space-y-6 overflow-y-auto no-scrollbar">
          {/* Logo Oficial do Workspace */}
          <div className="pt-2 flex items-center justify-center lg:justify-start">
            <div className="hidden lg:block">
              {workspace?.logo_url ? (
                <img 
                  src={workspace.logo_url} 
                  alt={`Logo ${workspace.name}`} 
                  className="h-8 w-auto object-contain" 
                />
              ) : (
                <div className="text-xl font-bold text-white tracking-wide truncate">
                  {workspace?.name || 'Workspace'}
                </div>
              )}
            </div>
            <div 
              className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-theme-primary/10 border border-theme-primary/30 text-theme-primary font-black text-sm tracking-wider shadow-xs"
            >
              {(workspace?.name || 'EL').substring(0, 2).toUpperCase()}
            </div>
          </div>

          {/* MENU PRINCIPAL */}
          {mainNavLinks.length > 0 && (
            <div className="space-y-1">
              <span className="hidden lg:block text-xs text-gray-500 font-semibold uppercase tracking-wider px-3 mb-2">
                MENU PRINCIPAL
              </span>
              <div className="space-y-1">
                {mainNavLinks.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.type === 'tab' && activeTab === item.tabId;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item)}
                      title={item.label}
                      className={`w-full flex items-center justify-center lg:justify-start gap-3 px-2 lg:px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'text-theme-primary bg-gray-800/50 border border-gray-700/60 shadow-xs'
                          : 'text-gray-300 hover:text-white hover:bg-gray-800/30'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${item.iconColor || 'text-theme-primary'}`} />
                      <span className="hidden lg:inline truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ADMINISTRAÇÃO */}
          {adminNavLinks.length > 0 && (
            <div className="space-y-1 pt-3 border-t border-gray-800">
              <span className="hidden lg:block text-xs text-gray-500 font-semibold uppercase tracking-wider px-3 mb-2">
                ADMINISTRAÇÃO
              </span>
              <div className="space-y-1">
                {adminNavLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item)}
                      title={item.label}
                      className="w-full flex items-center justify-center lg:justify-start gap-3 px-2 lg:px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white hover:bg-gray-800/30 transition-all cursor-pointer"
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${item.iconColor || 'text-theme-primary'}`} />
                      <span className="hidden lg:inline truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* PERFIL */}
          <div className="space-y-1 pt-3 border-t border-gray-800">
            <span className="hidden lg:block text-xs text-gray-500 font-semibold uppercase tracking-wider px-3 mb-2">
              PERFIL
            </span>
            {currentMember ? (
              <div className="flex items-center justify-center lg:justify-start gap-3 p-1.5 lg:px-3 lg:py-2 rounded-xl bg-gray-800/40 border border-gray-800">
                <div className="w-7 h-7 rounded-full bg-theme-primary text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                  {currentMember.name.charAt(0)}
                </div>
                <div className="hidden lg:block overflow-hidden">
                  <p className="text-xs font-bold text-white truncate">{currentMember.name}</p>
                  <p className="text-[10px] text-gray-400 truncate">{currentMember.voice} • {currentMember.role}</p>
                </div>
              </div>
            ) : (
              <span className="hidden lg:block text-xs text-gray-400 px-3">Nenhum perfil ativo</span>
            )}
          </div>
        </div>

        {/* Rodapé da Sidebar */}
        <div className="pt-4 border-t border-gray-800 text-center">
          <p className="hidden lg:block text-[10px] text-gray-500 font-medium truncate">
            © {new Date().getFullYear()} {workspace?.name || tenant.name}
          </p>
        </div>
      </aside>

      {/* 2. TOP BAR HEADER COM BOTÃO COMPARTILHAR */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentMember={currentMember}
        effectiveRole={effectiveRole}
        onOpenSidebar={() => setIsSidebarOpen(true)}
        onOpenAddModal={handleOpenHeaderModal}
        onShare={handleShareClick}
      />

      {/* 3. MAIN AREA */}
      <main className="md:ml-16 lg:ml-64 pt-20 pb-20 md:pb-6 p-4 md:p-6 min-h-screen space-y-6 transition-all duration-300">
        {/* Barra Indicadora */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white dark:bg-ellos-navy-surface border border-gray-200 dark:border-gray-800 px-4 py-3 rounded-2xl text-xs gap-2 shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            {currentMember && (
              <span className="text-xs font-bold text-slate-700 dark:text-white flex items-center gap-1">
                <span>Bem-vindo(a),</span>
                <strong className="text-theme-primary">{currentMember.name}</strong>
                <span className="text-slate-400">({currentMember.role})</span>
              </span>
            )}
            {isRealDev && simulatedRole !== workspaceRole && (
              <span className="text-[11px] font-bold bg-amber-500/20 text-theme-primary px-2 py-0.5 rounded-lg border border-amber-500/30 flex items-center gap-1">
                <Eye className="w-3 h-3 text-theme-primary" />
                <span>Simulando: <strong>{simulatedRole}</strong></span>
              </span>
            )}
          </div>
          <div className="text-[11px] font-semibold text-slate-500 dark:text-gray-400">
            {events.length} eventos • {songs.length} músicas • {tasks.length} tarefas
          </div>
        </div>

        {/* Top Summary Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-ellos-navy-surface border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider bg-status-confirmed/10 text-status-confirmed px-2.5 py-1 rounded-full border border-status-confirmed/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Próximo Compromisso
                </span>
              </div>
              {nextConfirmedEvent ? (
                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-theme-primary transition-colors">
                    {nextConfirmedEvent.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-gray-300 flex items-center gap-2">
                    <span>📅 {formatDate(nextConfirmedEvent.date)}</span>
                    <span>•</span>
                    <span>⏰ {nextConfirmedEvent.time}</span>
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Nenhum evento confirmado cadastrado.</p>
              )}
            </div>
            <button
              onClick={() => {
                if (nextConfirmedEvent) setSelectedNotionEvent(nextConfirmedEvent);
                else { setActiveTab('agenda'); setAgendaFilter('CONFIRMED'); }
              }}
              className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-theme-primary hover:underline pt-2 border-t border-gray-100 dark:border-gray-800 cursor-pointer"
            >
              <span>Abrir Ficha Completa</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white dark:bg-ellos-navy-surface border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider bg-status-voting/10 text-status-voting px-2.5 py-1 rounded-full border border-status-voting/30">
                  <Vote className="w-3.5 h-3.5" />
                  Votação de Convites
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">{pendingProposalsCount}</span>
                  <span className="text-xs font-medium text-slate-500 dark:text-gray-400">convites em análise</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => { setActiveTab('agenda'); setAgendaFilter('PROPOSAL'); }}
              className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-theme-primary hover:underline pt-2 border-t border-gray-100 dark:border-gray-800 cursor-pointer"
            >
              <span>Votar nos convites</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white dark:bg-ellos-navy-surface border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider bg-status-success/10 text-status-success px-2.5 py-1 rounded-full border border-status-success/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  Painel de Tarefas
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">{completedTasksCount} / {tasks.length}</span>
                  <span className="text-xs font-medium text-slate-500 dark:text-gray-400">concluídas</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('tasks')}
              className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-theme-primary hover:underline pt-2 border-t border-gray-100 dark:border-gray-800 cursor-pointer"
            >
              <span>Gerenciar tarefas</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

        {/* TAB 1: AGENDA */}
        {activeTab === 'agenda' && (
          <section className="space-y-5 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-ellos-navy-surface border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-theme-primary" />
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Agenda &amp; Convites
                </h2>
              </div>

              <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                <div className="flex items-center p-1 bg-gray-100 dark:bg-ellos-navy-sidebar rounded-xl border border-gray-200 dark:border-gray-800">
                  <button
                    onClick={() => setAgendaViewMode('calendar')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      agendaViewMode === 'calendar'
                        ? 'bg-theme-primary text-slate-950 shadow-xs'
                        : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Calendário</span>
                  </button>
                  <button
                    onClick={() => setAgendaViewMode('list')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      agendaViewMode === 'list'
                        ? 'bg-theme-primary text-slate-950 shadow-xs'
                        : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>Lista</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setAgendaFilter('ALL')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      agendaFilter === 'ALL'
                        ? 'bg-theme-primary text-slate-950'
                        : 'bg-gray-100 text-slate-600 dark:bg-ellos-navy-sidebar dark:text-gray-300'
                    }`}
                  >
                    Todos ({events.length})
                  </button>
                  <button
                    onClick={() => setAgendaFilter('CONFIRMED')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      agendaFilter === 'CONFIRMED'
                        ? 'bg-status-confirmed text-white'
                        : 'bg-gray-100 text-slate-600 dark:bg-ellos-navy-sidebar dark:text-gray-300'
                    }`}
                  >
                    Confirmados ({events.filter((e) => e.status === 'CONFIRMED').length})
                  </button>
                  <button
                    onClick={() => setAgendaFilter('PROPOSAL')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      agendaFilter === 'PROPOSAL'
                        ? 'bg-status-voting text-slate-950'
                        : 'bg-gray-100 text-slate-600 dark:bg-ellos-navy-sidebar dark:text-gray-300'
                    }`}
                  >
                    Votação ({events.filter((e) => e.status === 'PROPOSAL').length})
                  </button>
                </div>

                {canCreate && (
                  <button
                    onClick={() => handleOpenAddModal('event', true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black bg-theme-primary text-slate-950 hover:brightness-110 transition-all cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Novo Convite</span>
                  </button>
                )}
              </div>
            </div>

            {agendaViewMode === 'calendar' ? (
              <MonthlyCalendarView
                events={filteredEvents}
                onSelectEvent={(evt) => setSelectedNotionEvent(evt)}
                onOpenAddModal={() => handleOpenAddModal('event', true)}
                canCreate={canCreate}
              />
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-ellos-navy-surface border border-gray-200 dark:border-gray-800 rounded-2xl">
                <CalendarX className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Nenhum compromisso encontrado.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEvents.map((evt) => (
                  <EventCard
                    key={evt.id}
                    event={evt}
                    songs={songs}
                    currentMember={currentMember}
                    onToggleVote={handleToggleVote}
                    onEditEvent={canCreate ? handleOpenEditEvent : undefined}
                    onDeleteEvent={canCreate ? handleDeleteEvent : undefined}
                    eventResponses={eventResponses}
                    onRefetchResponses={fetchResponsesFromSupabase}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 2: REPERTÓRIO */}
        {activeTab === 'repertoire' && (
          <section className="space-y-5 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-ellos-navy-surface border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center justify-between md:justify-end gap-2 w-full">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-500 dark:text-gray-400 mr-1 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5" /> Status:
                  </span>
                  <button
                    onClick={() => setSongStatusFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      songStatusFilter === 'ALL'
                        ? 'bg-theme-primary text-slate-950'
                        : 'bg-gray-100 text-slate-600 dark:bg-ellos-navy-sidebar dark:text-gray-300'
                    }`}
                  >
                    Todas ({songs.length})
                  </button>
                  <button
                    onClick={() => setSongStatusFilter('REHEARSING')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      songStatusFilter === 'REHEARSING'
                        ? 'bg-status-voting text-slate-950'
                        : 'bg-gray-100 text-slate-600 dark:bg-ellos-navy-sidebar dark:text-gray-300'
                    }`}
                  >
                    Em Ensaio ({songs.filter((s) => s.status === 'REHEARSING').length})
                  </button>
                  <button
                    onClick={() => setSongStatusFilter('READY')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      songStatusFilter === 'READY'
                        ? 'bg-status-success text-white'
                        : 'bg-gray-100 text-slate-600 dark:bg-ellos-navy-sidebar dark:text-gray-300'
                    }`}
                  >
                    Prontas ({songs.filter((s) => s.status === 'READY').length})
                  </button>
                </div>

                {canCreate && (
                  <button
                    onClick={() => handleOpenAddModal('song', true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black bg-theme-primary text-slate-950 hover:brightness-110 transition-all cursor-pointer shadow-xs ml-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nova Música</span>
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {filteredSongs.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-ellos-navy-surface border border-gray-200 dark:border-gray-800 rounded-2xl">
                  <Music className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Nenhuma música encontrada.</p>
                </div>
              ) : (
                filteredSongs.map((song) => (
                  <SongListItem
                    key={song.id}
                    song={song}
                    onEditSong={canCreate ? handleOpenEditSong : undefined}
                    onDeleteSong={canCreate ? handleDeleteSong : undefined}
                  />
                ))
              )}
            </div>
          </section>
        )}

        {/* TAB 3: TAREFAS */}
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

      {/* 4. BOTTOM NAVIGATION BAR (Mobile < md) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border-t border-slate-200 dark:border-gray-800 flex items-center justify-around py-2 px-3 z-30 shadow-lg">
        <button
          onClick={() => setActiveTab('agenda')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
            activeTab === 'agenda'
              ? 'text-theme-primary font-extrabold scale-105'
              : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Agenda</span>
        </button>
        <button
          onClick={() => setActiveTab('repertoire')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
            activeTab === 'repertoire'
              ? 'text-theme-primary font-extrabold scale-105'
              : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Repertório</span>
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
            activeTab === 'tasks'
              ? 'text-theme-primary font-extrabold scale-105'
              : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ListTodo className="w-4 h-4" />
          <span>Tarefas</span>
        </button>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[10px] font-bold text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
        >
          <Menu className="w-4 h-4 text-theme-primary" />
          <span>Menu</span>
        </button>
      </nav>

      {/* Menu Lateral Retrátil Mobile */}
      <SidebarDrawer
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentMember={currentMember}
        effectiveRole={effectiveRole}
        isRealDev={isRealDev}
        simulatedRole={simulatedRole}
        onSimulatedRoleChange={setSimulatedRole}
        onOpenAddModal={handleOpenHeaderModal}
        onOpenMediaModal={() => setIsMediaModalOpen(true)}
        onOpenAdminModal={() => setIsAdminModalOpen(true)}
        onOpenDevModal={() => setIsDevModalOpen(true)}
        onLogout={handleLogout}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Modais da Aplicação */}
      <AdminPanelModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        currentMember={currentMember}
        onUpdateMembersList={setMembersList}
        workspaceId={workspace?.id}
        canManage={canCreate}
      />

      <DevPanelModal
        isOpen={isDevModalOpen}
        onClose={() => setIsDevModalOpen(false)}
        currentMember={currentMember}
        isRealDev={isRealDev}
      />

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

      <MediaCentralModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        events={events}
      />

      <AddItemModal
        isOpen={isAddModalOpen}
        mode={modalMode}
        initialType={modalInitialType}
        hideTypeSelector={modalHideTypeSelector}
        editingItem={editingItem}
        onClose={() => setIsAddModalOpen(false)}
        onAddEvent={handleCreateEvent}
        onUpdateEvent={handleUpdateEvent}
        onAddSong={handleAddSong}
        onUpdateSong={handleUpdateSong}
        onAddTask={handleAddTask}
        onUpdateTask={handleUpdateTask}
      />
    </div>
  );
}
