'use client';

import React, { useState, useEffect } from 'react';
import { GroupMember, groupMembers } from '@/data/groupMembers';
import { UserRole, VoiceType, RepertoireTag, InviteToken } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mapWorkspaceRoleToLegacy } from '@/lib/rbac';
import { toast } from 'sonner';
import { 
  ShieldCheck, 
  UserPlus, 
  Sparkles, 
  Trash2, 
  KeyRound, 
  Tag as TagIcon, 
  Plus, 
  Edit3, 
  Users,
  X
} from 'lucide-react';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMember?: GroupMember | null;
  onUpdateMembersList?: (members: GroupMember[]) => void;
  /** workspace.id do TenantContext — toda chamada a /api/admin/* exige isso. */
  workspaceId?: string;
  /** Papel efetivo (já traduzido) no workspace atual — ADM/DEV podem abrir este painel. */
  canManage: boolean;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  currentMember,
  onUpdateMembersList,
  workspaceId,
  canManage,
}) => {
  const [activeTab, setActiveTab] = useState<'members' | 'invites' | 'tags'>('members');
  const [membersList, setMembersList] = useState<GroupMember[]>(groupMembers);
  const [invitesList, setInvitesList] = useState<InviteToken[]>([]);
  const [tags, setTags] = useState<RepertoireTag[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form de Cadastro de Integrante
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newVoice, setNewVoice] = useState<VoiceType>('Soprano');
  const [newRole, setNewRole] = useState<UserRole>('MEMBER');

  // Modais Secundários (Exclusão, Senha Temporária e Edição)
  const [memberToDelete, setMemberToDelete] = useState<GroupMember | null>(null);
  const [tempPasswordResult, setTempPasswordResult] = useState<{ name: string; pass: string } | null>(null);

  // Estado de Edição de Integrante
  const [editingMember, setEditingMember] = useState<GroupMember | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editVoice, setEditVoice] = useState<VoiceType>('Soprano');
  const [editRole, setEditRole] = useState<UserRole>('MEMBER');
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [editPassword, setEditPassword] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Tags Form
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#D4AF37');

  const fetchMembers = async () => {
    if (!workspaceId) return;
    if (supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('workspace_members')
          .select('user_id, role, is_media_team, voice, is_active, profiles(id, email, name, phone)')
          .eq('workspace_id', workspaceId)
          .order('created_at');

        if (!error && data && data.length > 0) {
          const mapped: GroupMember[] = data
            .filter((row) => row.profiles)
            .map((row) => {
              const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
              return {
                id: profile.id,
                email: profile.email,
                name: profile.name,
                voice: row.voice,
                role: mapWorkspaceRoleToLegacy(row.role, Boolean(row.is_media_team)),
                phone: profile.phone || undefined,
                isActive: row.is_active !== false,
              };
            });
          setMembersList(mapped);
          if (onUpdateMembersList) onUpdateMembersList(mapped);
        }
      } catch (err) {
        console.warn('Erro ao carregar integrantes do workspace no AdminPanelModal:', err);
      }
    }
  };

  const fetchInvites = async () => {
    if (!workspaceId) return;
    try {
      const res = await fetch(`/api/admin/invites?workspace_id=${workspaceId}`);
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }
      if (data.invites) setInvitesList(data.invites);
    } catch {
      console.warn('Erro ao buscar convites descartáveis.');
    }
  };

  const fetchTags = async () => {
    if (!workspaceId) return;
    try {
      const res = await fetch(`/api/admin/tags?workspace_id=${workspaceId}`);
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }
      if (data.tags) {
        setTags(data.tags);
      }
    } catch {
      console.warn('Erro ao buscar tags de repertório.');
    }
  };

  useEffect(() => {
    if (isOpen && workspaceId) {
      fetchMembers();
      fetchInvites();
      fetchTags();
    }
  }, [isOpen, workspaceId]);

  // Defesa em profundidade: mesmo que o item de nav tenha sido filtrado
  // incorretamente em algum lugar, o painel Admin nunca renderiza pra quem
  // não é ADM/DEV neste workspace — a API por trás disso também blinda
  // via requireWorkspaceRole, mas a UI não deve nem tentar abrir.
  if (!isOpen || !canManage) return null;

  // --- Handlers: Membros ---
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newName.trim() || !workspaceId) return;

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
          workspace_id: workspaceId,
          email: emailFormatted,
          name: nameFormatted,
          voice: newVoice,
          role: newRole,
        }),
      });
      const data = await res.json();

      if (!res.ok || data.error || !data.user?.id) {
        toast.error(data.error || 'Erro ao cadastrar novo integrante no Supabase Auth.');
        return;
      }

      const newMember: GroupMember = {
        id: data.user.id,
        email: emailFormatted,
        name: nameFormatted,
        voice: newVoice,
        role: newRole,
      };

      const updated = [newMember, ...membersList];
      setMembersList(updated);
      if (onUpdateMembersList) onUpdateMembersList(updated);

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

  const handleOpenEditModal = (member: GroupMember) => {
    setEditingMember(member);
    setEditName(member.name);
    setEditEmail(member.email);
    setEditPhone(member.phone || '');
    setEditVoice(member.voice);
    setEditRole(member.role);
    setEditIsActive(member.isActive !== false);
    setEditPassword('');
  };

  const handleSaveEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !editName.trim() || !editEmail.trim() || !workspaceId) return;

    setIsSavingEdit(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          id: editingMember.id,
          name: editName.trim(),
          email: editEmail.trim().toLowerCase(),
          phone: editPhone.trim(),
          voice: editVoice,
          role: editRole,
          isActive: editIsActive,
          password: editPassword.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const updatedObj: GroupMember = {
          ...editingMember,
          name: editName.trim(),
          email: editEmail.trim().toLowerCase(),
          phone: editPhone.trim(),
          voice: editVoice,
          role: editRole,
          isActive: editIsActive,
        };

        const updated = membersList.map((m) => (m.id === editingMember.id ? updatedObj : m));
        setMembersList(updated);
        if (onUpdateMembersList) onUpdateMembersList(updated);

        // Atualizar sessão local se for o próprio integrante logado
        if (currentMember?.id === editingMember.id) {
          localStorage.setItem('ellos_current_member', JSON.stringify(updatedObj));
        }

        toast.success(`✨ Dados de ${editName} salvos com sucesso!`);
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

  const handleResetPassword = async (member: GroupMember) => {
    if (!workspaceId) return;
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspaceId, userId: member.id, email: member.email }),
      });
      const data = await res.json();
      if (!res.ok || data.error || !data.tempPassword) {
        toast.error(data.error || 'Erro ao redefinir senha do integrante.');
        return;
      }
      setTempPasswordResult({ name: member.name, pass: data.tempPassword });
      toast.success(`🔑 Senha temporária gerada para ${member.name}!`);
    } catch {
      toast.error('Erro ao redefinir senha do integrante.');
    }
  };

  const handleDeleteMember = async (member: GroupMember) => {
    if (!workspaceId) return;
    try {
      const res = await fetch(
        `/api/admin/users?workspace_id=${workspaceId}&id=${member.id}&email=${encodeURIComponent(member.email)}`,
        { method: 'DELETE' }
      );
      const data = await res.json();

      if (!res.ok || data.error || !data.success) {
        toast.error(data.error || 'Erro ao apagar registro do integrante.');
        return;
      }

      const updated = membersList.filter((m) => m.id !== member.id);
      setMembersList(updated);
      if (onUpdateMembersList) onUpdateMembersList(updated);
      setMemberToDelete(null);
      toast.success(`🗑️ Integrante ${member.name} removido deste workspace.`);
    } catch {
      toast.error('Erro ao apagar registro do integrante.');
    }
  };

  // --- Handlers: Convites OTP ---
  const handleGenerateInviteToken = async () => {
    if (!workspaceId) return;
    try {
      const res = await fetch('/api/admin/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspaceId, createdBy: currentMember?.name || 'ADM', role: 'MEMBER' }),
      });
      const data = await res.json();
      if (!res.ok || data.error || !data.inviteUrl) {
        toast.error(data.error || 'Erro ao gerar convite.');
        return;
      }
      navigator.clipboard.writeText(data.inviteUrl);
      toast.success('✨ Link de convite único gerado e copiado!', {
        description: 'Válido por 48h para auto-cadastro de integrante.',
      });
      fetchInvites();
    } catch {
      toast.error('Erro ao gerar convite.');
    }
  };

  const handleRevokeInviteToken = async (id: string) => {
    if (!workspaceId) return;
    try {
      const res = await fetch(`/api/admin/invites?workspace_id=${workspaceId}&id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || data.error) {
        toast.error(data.error || 'Erro ao revogar convite.');
        return;
      }
      toast.success('Convite revogado com sucesso.');
      fetchInvites();
    } catch {
      toast.error('Erro ao revogar convite.');
    }
  };

  // --- Handlers: Tags ---
  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim() || !workspaceId) return;

    try {
      const res = await fetch('/api/admin/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspaceId, name: newTagName.trim(), colorHex: newTagColor }),
      });
      const data = await res.json();
      if (!res.ok || data.error || !data.tags) {
        toast.error(data.error || 'Erro ao criar tag de repertório.');
        return;
      }
      setTags(data.tags);
      setNewTagName('');
      toast.success(`🏷️ Tag ${newTagName} adicionada!`);
    } catch {
      toast.error('Erro ao criar tag de repertório.');
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (!workspaceId) return;
    try {
      const res = await fetch(`/api/admin/tags?workspace_id=${workspaceId}&id=${tagId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || data.error || !data.tags) {
        toast.error(data.error || 'Erro ao excluir tag.');
        return;
      }
      setTags(data.tags);
      toast.success('🏷️ Tag excluída com sucesso.');
    } catch {
      toast.error('Erro ao excluir tag.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1F2937] border border-gray-800 text-slate-100 rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 relative max-h-[90vh] flex flex-col overflow-hidden font-sans">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-gray-800 pb-4 shrink-0">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Painel de Administração (ADM)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Gestão de Integrantes &amp; Configurações do Grupo
            </h2>
            <p className="text-xs text-slate-300">
              Gerencie os cantores cadastrados, gere convites descartáveis (OTP 48h) e configure as tags de repertório.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-gray-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 border-b border-gray-800 pb-2 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'members'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-slate-950 font-black shadow-md'
                : 'bg-[#111827] text-slate-300 hover:bg-gray-800/60'
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
                : 'bg-[#111827] text-slate-300 hover:bg-gray-800/60'
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
                : 'bg-[#111827] text-slate-300 hover:bg-gray-800/60'
            }`}
          >
            <TagIcon className="w-4 h-4" />
            <span>3. Tags ({tags.length})</span>
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="overflow-y-auto no-scrollbar flex-1 pr-1 space-y-6">
          
          {/* TAB 1: INTEGRANTES */}
          {activeTab === 'members' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Form de Cadastro */}
              <form onSubmit={handleAddMember} className="bg-[#111827] p-5 rounded-2xl border border-gray-800 space-y-4">
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-700 bg-[#1F2937] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-700 bg-[#1F2937] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Naipe Vocal
                    </label>
                    <select
                      value={newVoice}
                      onChange={(e) => setNewVoice(e.target.value as VoiceType)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-700 bg-[#1F2937] text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                    >
                      <option value="Soprano">Soprano</option>
                      <option value="Contralto">Contralto</option>
                      <option value="Tenor">Tenor</option>
                      <option value="Baixo">Baixo</option>
                      <option value="Geral">Geral</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Papel / Responsabilidade (Role)
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as UserRole)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-700 bg-[#1F2937] text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 font-bold text-gold-300"
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
                  {isLoading ? 'Cadastrando integrante...' : 'Salvar Novo Integrante'}
                </button>
              </form>

              {/* Tabela dos Integrantes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gold-400">
                    Integrantes Cadastrados ({membersList.length})
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Servidor Admin Ativo
                  </span>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-gray-800 bg-[#111827]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#1F2937]/90 text-gold-400 font-bold uppercase text-[10px] tracking-wider border-b border-gray-800">
                      <tr>
                        <th className="p-3.5">Nome / Naipe</th>
                        <th className="p-3.5">E-mail</th>
                        <th className="p-3.5">Papel (Role)</th>
                        <th className="p-3.5 text-right">Ações Admin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60">
                      {membersList.map((m) => (
                        <tr key={m.id} className="hover:bg-gray-800/40 transition-colors">
                          <td className="p-3.5 font-bold text-white">
                            {m.name} <span className="text-slate-400 font-normal">({m.voice})</span>
                            {m.isActive === false && (
                              <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] bg-rose-500/20 text-rose-300">
                                Inativo
                              </span>
                            )}
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
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#1F2937] hover:bg-gray-800 text-gold-300 border border-gold-500/20 transition-all cursor-pointer inline-flex items-center gap-1"
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

          {/* TAB 2: CONVITES DESCARTÁVEIS (OTP 48H) */}
          {activeTab === 'invites' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-[#111827] p-5 rounded-2xl border border-gray-800 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      Gerador &amp; Controle de Convites Descartáveis (48h)
                    </h3>
                    <p className="text-xs text-slate-300">
                      Links únicos e descartáveis para auto-cadastro e acesso direto de novos cantores.
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
                <div className="overflow-x-auto rounded-2xl border border-gray-800 bg-[#1F2937]/50 mt-2">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#1F2937] text-gold-400 font-bold uppercase text-[10px] tracking-wider border-b border-gray-800">
                      <tr>
                        <th className="p-3.5">Token / Criador</th>
                        <th className="p-3.5">Validade (48h)</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5">Utilizado Por</th>
                        <th className="p-3.5 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60">
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
                            <tr key={inv.id} className="hover:bg-gray-800/40 transition-colors">
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
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-all cursor-pointer inline-flex items-center gap-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Revogar</span>
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

          {/* TAB 3: TAGS DO REPERTÓRIO */}
          {activeTab === 'tags' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <form onSubmit={handleAddTag} className="bg-[#111827] p-5 rounded-2xl border border-gray-800 space-y-4">
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-700 bg-[#1F2937] text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
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
                        className="h-10 w-12 rounded-lg bg-[#1F2937] border border-gray-700 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={newTagColor}
                        onChange={(e) => setNewTagColor(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-700 bg-[#1F2937] text-slate-100 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-extrabold bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-slate-950 hover:brightness-110 transition-all cursor-pointer shadow-md"
                >
                  Salvar Nova Tag
                </button>
              </form>

              {/* Lista de Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tags.map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-2xl bg-[#111827] border border-gray-800 text-xs flex items-center justify-between"
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

        </div>
      </div>

      {/* Sub-Modal: Confirmação de Exclusão de Integrante */}
      {memberToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#1F2937] border border-rose-500/30 rounded-3xl p-6 max-w-sm w-full space-y-4 text-center text-slate-100 shadow-2xl">
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
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[#111827] text-slate-300 hover:bg-gray-800 border border-gray-700 cursor-pointer"
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

      {/* Sub-Modal: Senha Temporária Gerada */}
      {tempPasswordResult && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#1F2937] border border-gold-500/40 rounded-3xl p-6 max-w-sm w-full space-y-4 text-center text-slate-100 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-gold-500/10 border border-gold-500/20 text-gold-400 flex items-center justify-center mx-auto">
              <KeyRound className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-white">Senha Provisória Gerada!</h3>
              <p className="text-xs text-slate-300">
                Nova senha temporária para <strong className="text-white">{tempPasswordResult.name}</strong>:
              </p>
              <div className="p-3 rounded-xl bg-[#111827] font-mono text-base font-black text-gold-300 border border-gold-500/30 select-all my-2">
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

      {/* Sub-Modal: Edição Completa de Integrante */}
      {editingMember && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-200 font-sans">
          <div className="bg-[#1F2937] border border-gray-700 rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-5 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
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
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-gray-800 cursor-pointer transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditMember} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Nome Completo *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-700 bg-[#111827] text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">E-mail *</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-700 bg-[#111827] text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 font-mono text-[11px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Telefone / WhatsApp</label>
                  <input
                    type="tel"
                    placeholder="(11) 99999-8888"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-700 bg-[#111827] text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Naipe Vocal</label>
                  <select
                    value={editVoice}
                    onChange={(e) => setNewVoice(e.target.value as VoiceType)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-700 bg-[#111827] text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-700 bg-[#111827] text-gold-300 font-bold focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                  >
                    <option value="MEMBER">MEMBER (Membro Padrão)</option>
                    <option value="MEDIA">MEDIA (Duda / Mídia)</option>
                    <option value="ADM">ADM (Rayane / Eloise)</option>
                    <option value="DEV">DEV (Henrique / Engenharia)</option>
                  </select>
                </div>
              </div>

              <div className="pt-1">
                <label className="font-semibold text-slate-300 block mb-1.5">Status de Atividade no Grupo</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditIsActive(true)}
                    className={`flex-1 py-2 px-3 rounded-xl font-bold border transition-all cursor-pointer ${
                      editIsActive
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-xs'
                        : 'bg-[#111827] text-slate-400 border-gray-800'
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
                        : 'bg-[#111827] text-slate-400 border-gray-800'
                    }`}
                  >
                    🔴 Inativo / Afastado
                  </button>
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <label className="font-semibold text-slate-300 flex items-center justify-between">
                  <span>Nova Senha de Acesso (Opcional)</span>
                  <span className="text-[10px] text-slate-400">Deixe em branco para manter a atual</span>
                </label>
                <input
                  type="password"
                  placeholder="•••••••• (deixe em branco se não for alterar)"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-700 bg-[#111827] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                />
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="flex-1 py-2.5 rounded-xl font-bold bg-[#111827] text-slate-300 hover:bg-gray-800 border border-gray-700 transition-all cursor-pointer"
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
};
