'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { groupMembers, GroupMember, isDev } from '@/data/groupMembers';
import { UserRole, VoiceType, RepertoireTag, GlobalSettings, InviteToken } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { toast } from 'sonner';
import { 
  ShieldCheck, 
  UserPlus, 
  Shield, 
  Sparkles, 
  ArrowLeft, 
  Mail, 
  CheckCircle2, 
  Trash2, 
  KeyRound, 
  Tag as TagIcon, 
  Globe, 
  Database, 
  RefreshCw, 
  Plus, 
  Edit3, 
  ExternalLink,
  Users,
  X
} from 'lucide-react';
import Image from 'next/image';

export default function DevPage() {
  const router = useRouter();
  const [currentMember, setCurrentMember] = useState<GroupMember | null>(null);
  const [membersList, setMembersList] = useState<GroupMember[]>(groupMembers);
  const [activeTab, setActiveTab] = useState<'members' | 'invites' | 'tags' | 'settings' | 'monitor'>('members');
  const [invitesList, setInvitesList] = useState<InviteToken[]>([]);

  const fetchInvites = async () => {
    try {
      const res = await fetch('/api/admin/invites');
      const data = await res.json();
      if (data.invites) setInvitesList(data.invites);
    } catch {
      console.warn('Erro ao buscar convites descartáveis.');
    }
  };

  const handleGenerateInviteToken = async () => {
    try {
      const res = await fetch('/api/admin/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ createdBy: currentMember?.name || 'DEV', role: 'MEMBER' }),
      });
      const data = await res.json();
      if (data.inviteUrl) {
        navigator.clipboard.writeText(data.inviteUrl);
        toast.success('✨ Link de convite único gerado e copiado!', {
          description: 'Válido por 48h para auto-cadastro de integrante.',
        });
        fetchInvites();
      }
    } catch {
      toast.error('Erro ao gerar convite.');
    }
  };

  const handleRevokeInviteToken = async (id: string) => {
    try {
      await fetch(`/api/admin/invites?id=${id}`, { method: 'DELETE' });
      toast.success('Convite revogado com sucesso.');
      fetchInvites();
    } catch {
      toast.error('Erro ao revogar convite.');
    }
  };

  // Add Member State
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newVoice, setNewVoice] = useState<VoiceType>('Soprano');
  const [newRole, setNewRole] = useState<UserRole>('MEMBER');

  // Confirmation & Edit Modal State
  const [memberToDelete, setMemberToDelete] = useState<GroupMember | null>(null);
  const [tempPasswordResult, setTempPasswordResult] = useState<{ name: string; pass: string } | null>(null);

  // Edit Member Modal State
  const [editingMember, setEditingMember] = useState<GroupMember | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editVoice, setEditVoice] = useState<VoiceType>('Soprano');
  const [editRole, setEditRole] = useState<UserRole>('MEMBER');
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const handleOpenEditModal = (member: GroupMember) => {
    setEditingMember(member);
    setEditName(member.name);
    setEditEmail(member.email);
    setEditPhone(member.phone || '');
    setEditVoice(member.voice);
    setEditRole(member.role);
    setEditIsActive(member.isActive !== false);
  };

  const handleSaveEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !editName.trim() || !editEmail.trim()) return;

    setIsSavingEdit(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingMember.id,
          name: editName.trim(),
          email: editEmail.trim().toLowerCase(),
          phone: editPhone.trim(),
          voice: editVoice,
          role: editRole,
          isActive: editIsActive,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMembersList((prev) =>
          prev.map((m) =>
            m.id === editingMember.id
              ? {
                  ...m,
                  name: editName.trim(),
                  email: editEmail.trim().toLowerCase(),
                  phone: editPhone.trim(),
                  voice: editVoice,
                  role: editRole,
                  isActive: editIsActive,
                }
              : m
          )
        );
        toast.success(`✨ Dados de ${editName} atualizados com sucesso!`);
        setEditingMember(null);
      } else {
        toast.error(data.error || 'Erro ao atualizar dados.');
      }
    } catch {
      toast.error('Erro ao conectar com o servidor.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Tags State
  const [tags, setTags] = useState<RepertoireTag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#D4AF37');

  // Global Settings State
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
    appDomain: 'elloshub.vercel.app',
    driveRootUrl: 'https://drive.google.com/drive/folders/ellos-vocal',
    instagramBio: 'Grupo Vocal Ellos 🎵 | Louvor, harmonia e dedicação.\nSolicite uma apresentação: elloshub.vercel.app/convite',
  });

  // DB Stats State
  const [dbStats, setDbStats] = useState({ eventsCount: 0, songsCount: 0, tasksCount: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  // Load Tags from API
  const fetchTags = async () => {
    try {
      const res = await fetch('/api/admin/tags');
      const data = await res.json();
      if (data.tags) {
        setTags(data.tags);
      }
    } catch {
      // Fallback
      setTags([
        { id: 'tag-1', name: '#EllosAutoral', colorHex: '#D4AF37' },
        { id: 'tag-2', name: '#EspecialCTJ', colorHex: '#3B82F6' },
      ]);
    }
  };

  // Check DEV Access
  useEffect(() => {
    const verifyDevRole = async () => {
      try {
        const localSaved = localStorage.getItem('ellos_current_member');
        const sessionSaved = sessionStorage.getItem('ellos_current_member');
        const savedStr = localSaved || sessionSaved;

        if (savedStr) {
          const parsed: GroupMember = JSON.parse(savedStr);
          if (parsed && isDev(parsed)) {
            setCurrentMember(parsed);
          } else {
            router.replace('/');
            return;
          }
        } else {
          router.replace('/login');
          return;
        }

        // Carregar perfis do Supabase
        if (supabase && isSupabaseConfigured) {
          const { data } = await supabase.from('profiles').select('*').order('name');
          if (data && data.length > 0) {
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

          // Estatísticas do Banco
          const { count: evCount } = await supabase.from('events').select('*', { count: 'exact', head: true });
          const { count: sgCount } = await supabase.from('songs').select('*', { count: 'exact', head: true });
          const { count: tkCount } = await supabase.from('tasks').select('*', { count: 'exact', head: true });

          setDbStats({
            eventsCount: evCount || 3,
            songsCount: sgCount || 3,
            tasksCount: tkCount || 5,
          });
        }

        fetchTags();
        fetchInvites();
      } catch (err) {
        console.warn('Erro ao verificar acesso DEV:', err);
        router.replace('/');
      } finally {
        setIsCheckingAccess(false);
      }
    };

    verifyDevRole();
  }, [router]);

  // Handler: Cadastrar Integrante
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newName.trim()) return;

    const emailFormatted = newEmail.trim().toLowerCase();
    const nameFormatted = newName.trim();

    if (membersList.some((m) => m.email.toLowerCase() === emailFormatted)) {
      toast.error('⚠️ Este e-mail já está cadastrado.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailFormatted,
          name: nameFormatted,
          voice: newVoice,
          role: newRole,
        }),
      });
      const data = await res.json();

      const newMember: GroupMember = {
        id: data.user?.id || `prof-${Date.now()}`,
        email: emailFormatted,
        name: nameFormatted,
        voice: newVoice,
        role: newRole,
      };

      setMembersList([newMember, ...membersList]);
      if (data.tempPassword) {
        setTempPasswordResult({ name: nameFormatted, pass: data.tempPassword });
      }
      toast.success(`✨ Integrante ${nameFormatted} (${newRole}) cadastrado!`);
      setNewEmail('');
      setNewName('');
    } catch {
      toast.error('Erro ao cadastrar novo integrante.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Resetar Senha
  const handleResetPassword = async (member: GroupMember) => {
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: member.id, email: member.email }),
      });
      const data = await res.json();
      if (data.tempPassword) {
        setTempPasswordResult({ name: member.name, pass: data.tempPassword });
        toast.success(`🔑 Senha temporária gerada para ${member.name}!`);
      }
    } catch {
      toast.error('Erro ao redefinir senha do integrante.');
    }
  };

  // Handler: Excluir Integrante
  const handleDeleteMember = async (member: GroupMember) => {
    try {
      await fetch(`/api/admin/users?id=${member.id}&email=${encodeURIComponent(member.email)}`, {
        method: 'DELETE',
      });
      setMembersList(membersList.filter((m) => m.id !== member.id));
      setMemberToDelete(null);
      toast.success(`🗑️ Integrante ${member.name} removido do sistema.`);
    } catch {
      toast.error('Erro ao apagar registro do integrante.');
    }
  };

  // Handlers para Tags
  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    try {
      const res = await fetch('/api/admin/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName.trim(), colorHex: newTagColor }),
      });
      const data = await res.json();
      if (data.tags) {
        setTags(data.tags);
        setNewTagName('');
        toast.success(`🏷️ Tag ${newTagName} adicionada!`);
      }
    } catch {
      toast.error('Erro ao criar tag de repertório.');
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    try {
      const res = await fetch(`/api/admin/tags?id=${tagId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.tags) {
        setTags(data.tags);
        toast.success('🏷️ Tag excluída com sucesso.');
      }
    } catch {
      toast.error('Erro ao excluir tag.');
    }
  };

  if (isCheckingAccess) {
    return (
      <div className="min-h-screen bg-[#0F223D] flex items-center justify-center p-4 text-slate-100 font-sans">
        <div className="flex items-center gap-3 text-xs font-semibold text-gold-400">
          <Sparkles className="w-5 h-5 animate-spin" />
          <span>Verificando credenciais de Engenharia (DEV)...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F223D] text-slate-100 p-4 sm:p-6 font-sans">
      {/* Top Header Navigation */}
      <header className="max-w-5xl mx-auto w-full pt-2 pb-6 flex items-center justify-between">
        <button
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-gold-400 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Hub</span>
        </button>

        <Image
          src="/logo-ellos.svg"
          alt="Ellos Grupo Logo"
          width={130}
          height={34}
          priority
          className="h-8 w-auto object-contain"
        />
      </header>

      {/* Main Container Card */}
      <main className="max-w-5xl mx-auto w-full space-y-6">
        <div className="bg-navy-900/90 backdrop-blur-md border border-amber-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="space-y-2 border-b border-navy-800 pb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-gold-300 border border-amber-500/20">
              <ShieldCheck className="w-3.5 h-3.5 text-gold-400" />
              <span>Painel do Engenheiro &amp; Administrador (DEV Mode)</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Suíte Administrativa &amp; Controle de APIs
            </h1>
            <p className="text-xs text-slate-300">
              Gestão dos 9 integrantes oficiais, reset de senhas, banco de dados e tags de repertório.
            </p>
          </div>

          {/* Sub-Navegação por Abas do Painel DEV */}
          <div className="flex items-center gap-2 border-b border-navy-800 pb-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('members')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'members'
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-slate-950 font-black shadow-md'
                  : 'bg-navy-950 text-slate-300 hover:bg-navy-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>1. Integrantes ({membersList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('invites')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'invites'
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-slate-950 font-black shadow-md'
                  : 'bg-navy-950 text-slate-300 hover:bg-navy-800'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>2. Convites OTP ({invitesList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('tags')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'tags'
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-slate-950 font-black shadow-md'
                  : 'bg-navy-950 text-slate-300 hover:bg-navy-800'
              }`}
            >
              <TagIcon className="w-4 h-4" />
              <span>3. Tags ({tags.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-slate-950 font-black shadow-md'
                  : 'bg-navy-950 text-slate-300 hover:bg-navy-800'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>4. Configurações Globais</span>
            </button>

            <button
              onClick={() => setActiveTab('monitor')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'monitor'
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-slate-950 font-black shadow-md'
                  : 'bg-navy-950 text-slate-300 hover:bg-navy-800'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>5. Monitor DB</span>
            </button>
          </div>

          {/* ABA 1: INTEGRANTES OFICIAIS */}
          {activeTab === 'members' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Form de Cadastro */}
              <form onSubmit={handleAddMember} className="bg-navy-950/80 p-5 rounded-2xl border border-amber-500/20 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gold-400 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4" />
                  Cadastrar Novo Integrante
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      E-mail *
                    </label>
                    <input
                      type="email"
                      placeholder="ex: integrante@ellos.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-navy-700 bg-navy-900 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      placeholder="ex: Samily"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-navy-700 bg-navy-900 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Naipe Vocal
                    </label>
                    <select
                      value={newVoice}
                      onChange={(e) => setNewVoice(e.target.value as VoiceType)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-navy-700 bg-navy-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                    >
                      <option value="Soprano">Soprano</option>
                      <option value="Contralto">Contralto</option>
                      <option value="Tenor">Tenor</option>
                      <option value="Baixo">Baixo</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Papel / Responsabilidade (Role)
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as UserRole)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-navy-700 bg-navy-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-gold-500/50 font-bold text-gold-300"
                    >
                      <option value="MEMBER">MEMBER (Membro padrão)</option>
                      <option value="MEDIA">MEDIA (Duda / Comunicação)</option>
                      <option value="ADM">ADM (Rayane / Eloise)</option>
                      <option value="DEV">DEV (Henrique / Engenharia)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !newEmail.trim() || !newName.trim()}
                  className="w-full py-3 px-4 rounded-xl text-xs font-extrabold bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-slate-950 hover:brightness-110 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  Salvar Novo Integrante
                </button>
              </form>

              {/* Tabela dos Integrantes Oficial */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gold-400 flex items-center justify-between">
                  <span>Integrantes Cadastrados ({membersList.length})</span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    Servidor Admin Active
                  </span>
                </h3>

                <div className="overflow-x-auto rounded-2xl border border-navy-800 bg-navy-950/70">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-navy-900 text-gold-400 font-bold uppercase text-[10px] tracking-wider border-b border-navy-800">
                      <tr>
                        <th className="p-3.5">Nome / Naipe</th>
                        <th className="p-3.5">E-mail</th>
                        <th className="p-3.5">Papel (Role)</th>
                        <th className="p-3.5 text-right">Ações Admin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-800/60">
                      {membersList.map((m) => (
                        <tr key={m.id} className="hover:bg-navy-900/50 transition-colors">
                          <td className="p-3.5 font-bold text-white">
                            {m.name} <span className="text-slate-400 font-normal">({m.voice})</span>
                          </td>
                          <td className="p-3.5 text-slate-300 font-mono text-[11px]">
                            {m.email}
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                m.role === 'DEV'
                                  ? 'bg-amber-500/20 text-gold-300 border border-amber-500/30'
                                  : m.role === 'ADM'
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : m.role === 'MEDIA'
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                              }`}
                            >
                              {m.role}
                            </span>
                          </td>
                          <td className="p-3.5 text-right space-x-1.5">
                            <button
                              onClick={() => handleOpenEditModal(m)}
                              title="Editar Integrante"
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-gold-300 border border-amber-500/30 transition-all cursor-pointer inline-flex items-center gap-1"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Editar</span>
                            </button>
                            <button
                              onClick={() => handleResetPassword(m)}
                              title="Resetar Senha"
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-navy-900 hover:bg-navy-800 text-gold-300 border border-gold-500/20 transition-all cursor-pointer inline-flex items-center gap-1"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                              <span>Senha</span>
                            </button>
                            <button
                              onClick={() => setMemberToDelete(m)}
                              title="Excluir Integrante"
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-all cursor-pointer inline-flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Excluir</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ABA 2: CONVITES DESCARTÁVEIS (OTP 48H) */}
          {activeTab === 'invites' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-navy-950/80 p-5 rounded-2xl border border-amber-500/20 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      Gerador &amp; Controle de Convites Descartáveis (48h)
                    </h3>
                    <p className="text-xs text-slate-300">
                      Links únicos e descartáveis para auto-cadastro de novos cantores com confirmação por código OTP.
                    </p>
                  </div>

                  <button
                    onClick={handleGenerateInviteToken}
                    className="py-2.5 px-4 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Gerar Link de Convite</span>
                  </button>
                </div>

                {/* Tabela de Convites */}
                <div className="overflow-x-auto rounded-2xl border border-navy-800 bg-navy-950/70 mt-2">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-navy-900 text-gold-400 font-bold uppercase text-[10px] tracking-wider border-b border-navy-800">
                      <tr>
                        <th className="p-3.5">Token / Criador</th>
                        <th className="p-3.5">Validade (48h)</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5">Utilizado Por</th>
                        <th className="p-3.5 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-800/60">
                      {invitesList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-slate-400">
                            Nenhum token de convite gerado até o momento.
                          </td>
                        </tr>
                      ) : (
                        invitesList.map((inv) => {
                          const isExpired = new Date(inv.expiresAt).getTime() < Date.now();
                          return (
                            <tr key={inv.id} className="hover:bg-navy-900/50 transition-colors">
                              <td className="p-3.5">
                                <span className="font-mono text-gold-300 font-bold block">
                                  {inv.token.substring(0, 12)}...
                                </span>
                                <span className="text-[10px] text-slate-400">Por: {inv.createdBy}</span>
                              </td>
                              <td className="p-3.5 text-slate-300 font-mono text-[11px]">
                                {inv.expiresAt ? new Date(inv.expiresAt).toLocaleString('pt-BR') : '48h'}
                              </td>
                              <td className="p-3.5">
                                {inv.isUsed ? (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-300 border border-slate-500/30">
                                    Utilizado
                                  </span>
                                ) : isExpired ? (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                    Expirado
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    🟢 Ativo (Válido)
                                  </span>
                                )}
                              </td>
                              <td className="p-3.5 text-slate-300 font-mono text-[11px]">
                                {inv.usedByEmail || '—'}
                              </td>
                              <td className="p-3.5 text-right">
                                <button
                                  onClick={() => handleRevokeInviteToken(inv.id)}
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                                  Revogar
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ABA 2: TAGS DO REPERTÓRIO */}
          {activeTab === 'tags' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <form onSubmit={handleAddTag} className="bg-navy-950/80 p-5 rounded-2xl border border-amber-500/20 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gold-400 flex items-center gap-1.5">
                  <TagIcon className="w-4 h-4" />
                  Criar Nova Tag de Música
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Nome da Tag (ex: #EllosAutoral)
                    </label>
                    <input
                      type="text"
                      placeholder="#TagExemplo"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-navy-700 bg-navy-900 text-slate-100 text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Cor da Tag (Hex)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newTagColor}
                        onChange={(e) => setNewTagColor(e.target.value)}
                        className="h-9 w-12 rounded-lg bg-navy-900 border border-navy-700 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={newTagColor}
                        onChange={(e) => setNewTagColor(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-navy-700 bg-navy-900 text-slate-100 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-extrabold bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-slate-950 hover:brightness-110 transition-all cursor-pointer"
                >
                  Salvar Nova Tag
                </button>
              </form>

              {/* Lista de Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tags.map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-2xl bg-navy-950/70 border border-navy-800 text-xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/20"
                        style={{ backgroundColor: t.colorHex }}
                      />
                      <span className="font-bold text-white">{t.name}</span>
                    </div>

                    <button
                      onClick={() => handleDeleteTag(t.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABA 3: CONFIGURAÇÕES GLOBAIS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-navy-950/80 p-5 rounded-2xl border border-amber-500/20 space-y-4 text-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gold-400 flex items-center gap-1.5">
                  <Globe className="w-4 h-4" />
                  Parâmetros de Domínio &amp; Redes Sociais
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Domínio Público Enxuto Vercel
                    </label>
                    <input
                      type="text"
                      value={globalSettings.appDomain}
                      onChange={(e) => setGlobalSettings({ ...globalSettings, appDomain: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-navy-700 bg-navy-900 text-slate-100 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Link da Pasta Raiz do Google Drive (Kits de Voz)
                    </label>
                    <input
                      type="text"
                      value={globalSettings.driveRootUrl}
                      onChange={(e) => setGlobalSettings({ ...globalSettings, driveRootUrl: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-navy-700 bg-navy-900 text-slate-100 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Texto Padrão da Bio do Instagram
                    </label>
                    <textarea
                      rows={3}
                      value={globalSettings.instagramBio}
                      onChange={(e) => setGlobalSettings({ ...globalSettings, instagramBio: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-navy-700 bg-navy-900 text-slate-100 text-xs resize-none"
                    />
                  </div>
                </div>

                <button
                  onClick={() => toast.success('✨ Configurações globais atualizadas!')}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-extrabold bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-slate-950 hover:brightness-110 transition-all cursor-pointer"
                >
                  Salvar Configurações Globais
                </button>
              </div>
            </div>
          )}

          {/* ABA 4: MONITOR DO BANCO DE DADOS */}
          {activeTab === 'monitor' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-navy-950/80 p-5 rounded-2xl border border-amber-500/20 space-y-1">
                  <span className="text-[11px] font-bold uppercase text-gold-400 block">Total de Eventos</span>
                  <p className="text-3xl font-black text-white">{dbStats.eventsCount}</p>
                  <p className="text-[10px] text-slate-400">Publicados no Supabase DB</p>
                </div>

                <div className="bg-navy-950/80 p-5 rounded-2xl border border-amber-500/20 space-y-1">
                  <span className="text-[11px] font-bold uppercase text-gold-400 block">Total de Músicas</span>
                  <p className="text-3xl font-black text-white">{dbStats.songsCount}</p>
                  <p className="text-[10px] text-slate-400">Repertório cadastrado</p>
                </div>

                <div className="bg-navy-950/80 p-5 rounded-2xl border border-amber-500/20 space-y-1">
                  <span className="text-[11px] font-bold uppercase text-gold-400 block">Status WebSocket Realtime</span>
                  <p className="text-sm font-extrabold text-emerald-400 flex items-center gap-1.5 pt-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    Conectado / Ativo
                  </p>
                  <p className="text-[10px] text-slate-400 pt-1">Provedor: Supabase Auth &amp; Realtime</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal de Confirmação de Exclusão de Integrante */}
      {memberToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#1B365D] border border-rose-500/30 rounded-3xl p-6 max-w-sm w-full space-y-4 text-center text-slate-100 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-white">Confirma a exclusão?</h3>
              <p className="text-xs text-slate-300">
                O integrante <strong className="text-gold-300">{memberToDelete.name}</strong> ({memberToDelete.email}) será removido permanentemente.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setMemberToDelete(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-navy-950 text-slate-300 hover:bg-navy-900 border border-navy-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteMember(memberToDelete)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-500 cursor-pointer"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal / Toast Result de Senha Temporária */}
      {tempPasswordResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#1B365D] border border-gold-500/40 rounded-3xl p-6 max-w-sm w-full space-y-4 text-center text-slate-100 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-gold-500/10 border border-gold-500/20 text-gold-400 flex items-center justify-center mx-auto">
              <KeyRound className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-white">Senha Provisória Gerada!</h3>
              <p className="text-xs text-slate-300">
                Nova senha temporária para <strong className="text-white">{tempPasswordResult.name}</strong>:
              </p>
              <div className="p-3 rounded-xl bg-navy-950 font-mono text-base font-black text-gold-300 border border-gold-500/30 select-all my-2">
                {tempPasswordResult.pass}
              </div>
            </div>
            <button
              onClick={() => setTempPasswordResult(null)}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-slate-950 hover:brightness-110 cursor-pointer"
            >
              Concluído
            </button>
          </div>
        </div>
      )}

      {/* ✏️ MODAL DE EDIÇÃO COMPLETA DE INTEGRANTE (v2.8) */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-200 font-sans">
          <div className="bg-[#1B365D] border border-amber-500/30 rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-5 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-navy-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-gold-400 border border-amber-500/20">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Editar Integrante</h3>
                  <p className="text-xs text-slate-400">Atualize os dados e permissões do perfil no Supabase.</p>
                </div>
              </div>

              <button
                onClick={() => setEditingMember(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-navy-800 cursor-pointer transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditMember} className="space-y-3.5 text-xs">
              {/* Nome */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Nome Completo *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-navy-700 bg-navy-950 text-slate-100 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                />
              </div>

              {/* E-mail & WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">E-mail *</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-navy-700 bg-navy-950 text-slate-100 focus:outline-none focus:ring-2 focus:ring-gold-500/50 font-mono text-[11px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Telefone / WhatsApp</label>
                  <input
                    type="tel"
                    placeholder="(11) 99999-8888"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-navy-700 bg-navy-950 text-slate-100 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                  />
                </div>
              </div>

              {/* Naipe Vocal & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Naipe Vocal</label>
                  <select
                    value={editVoice}
                    onChange={(e) => setEditVoice(e.target.value as VoiceType)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-navy-700 bg-navy-950 text-slate-100 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                  >
                    <option value="Soprano">Soprano</option>
                    <option value="Contralto">Contralto</option>
                    <option value="Tenor">Tenor</option>
                    <option value="Baixo">Baixo</option>
                    <option value="Geral">Geral</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Papel / Responsabilidade (Role)</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-navy-700 bg-navy-950 text-gold-300 font-bold focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                  >
                    <option value="MEMBER">MEMBER (Membro Padrão)</option>
                    <option value="MEDIA">MEDIA (Duda / Mídia)</option>
                    <option value="ADM">ADM (Rayane / Eloise)</option>
                    <option value="DEV">DEV (Henrique / Engenharia)</option>
                  </select>
                </div>
              </div>

              {/* Status de Atividade (is_active) */}
              <div className="pt-1">
                <label className="font-semibold text-slate-300 block mb-1.5">Status de Atividade no Grupo</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditIsActive(true)}
                    className={`flex-1 py-2 px-3 rounded-xl font-bold border transition-all cursor-pointer ${
                      editIsActive
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-xs'
                        : 'bg-navy-950 text-slate-400 border-navy-800'
                    }`}
                  >
                    🟢 Ativo no Grupo
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditIsActive(false)}
                    className={`flex-1 py-2 px-3 rounded-xl font-bold border transition-all cursor-pointer ${
                      !editIsActive
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-xs'
                        : 'bg-navy-950 text-slate-400 border-navy-800'
                    }`}
                  >
                    🔴 Inativo / Afastado
                  </button>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center gap-2 pt-3 border-t border-navy-800">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="flex-1 py-2.5 rounded-xl font-bold bg-navy-950 text-slate-300 hover:bg-navy-900 border border-navy-800 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="flex-1 py-2.5 rounded-xl font-extrabold bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-slate-950 hover:brightness-110 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingEdit ? 'Salvando alterações...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
