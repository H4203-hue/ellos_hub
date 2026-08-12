'use client';

import React, { useState } from 'react';
import { GroupMember, groupMembers } from '@/data/groupMembers';
import { UserRole, VoiceType } from '@/types';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, UserPlus, Shield, Sparkles, X, Mail } from 'lucide-react';

interface DevMemberManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  membersList: GroupMember[];
  onUpdateMembersList: (updated: GroupMember[]) => void;
  showToast: (msg: string) => void;
}

export const DevMemberManagementModal: React.FC<DevMemberManagementModalProps> = ({
  isOpen,
  onClose,
  membersList,
  onUpdateMembersList,
  showToast,
}) => {
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newVoice, setNewVoice] = useState<VoiceType>('Soprano');
  const [newRole, setNewRole] = useState<UserRole>('MEMBER');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newName.trim()) return;

    const emailFormatted = newEmail.trim().toLowerCase();
    const nameFormatted = newName.trim();

    // Check if email already exists
    if (membersList.some((m) => m.email.toLowerCase() === emailFormatted)) {
      showToast('⚠️ Este e-mail já está cadastrado.');
      return;
    }

    setIsSubmitting(true);

    const newMember: GroupMember = {
      id: `prof-${Date.now()}`,
      email: emailFormatted,
      name: nameFormatted,
      voice: newVoice,
      role: newRole,
    };

    const updated = [newMember, ...membersList];
    onUpdateMembersList(updated);

    if (supabase) {
      await supabase.from('profiles').upsert({
        id: newMember.id,
        email: newMember.email,
        name: newMember.name,
        voice: newMember.voice,
        role: newMember.role,
      });
    }

    showToast(`✨ Membro ${nameFormatted} cadastrado como ${newRole}!`);
    setNewEmail('');
    setNewName('');
    setIsSubmitting(false);
  };

  const handleChangeRole = async (memberId: string, role: UserRole) => {
    const updated = membersList.map((m) => (m.id === memberId ? { ...m, role } : m));
    onUpdateMembersList(updated);

    if (supabase) {
      await supabase.from('profiles').update({ role }).eq('id', memberId);
    }
    showToast(`👑 Permissão atualizada para ${role}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1B365D] border border-slate-200 dark:border-gold-500/30 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 relative max-h-[85vh] flex flex-col justify-between overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between shrink-0">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-800 dark:text-gold-300 border border-amber-500/20">
              <ShieldCheck className="w-3.5 h-3.5 text-gold-500" />
              <span>Painel do Desenvolvedor (DEV Mode)</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Gestão de Integrantes & Permissões (RBAC)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-300">
              Cadastre novos e-mails autorizados e altere a hierarquia de acesso (MEMBER, ADM, DEV).
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-5 overflow-y-auto no-scrollbar flex-1 pr-1">
          {/* Add New Member Form */}
          <form onSubmit={handleAddMember} className="bg-slate-50 dark:bg-navy-950/60 p-4 rounded-2xl border border-slate-200 dark:border-amber-500/20 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-gold-400 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4" />
              Cadastrar Novo Integrante
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  E-mail do Integrante *
                </label>
                <input
                  type="email"
                  placeholder="ex: integrante@ellos.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Nome do Integrante *
                </label>
                <input
                  type="text"
                  placeholder="ex: Gabriel Santos"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Naipe Vocal
                </label>
                <select
                  value={newVoice}
                  onChange={(e) => setNewVoice(e.target.value as VoiceType)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-900 text-slate-900 dark:text-white"
                >
                  <option value="Soprano">Soprano</option>
                  <option value="Contralto">Contralto</option>
                  <option value="Tenor">Tenor</option>
                  <option value="Baixo">Baixo</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Nível de Permissão (Role)
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-900 text-slate-900 dark:text-white"
                >
                  <option value="MEMBER">MEMBER (Membro padrão)</option>
                  <option value="ADM">ADM / REGÊNCIA (Gestão)</option>
                  <option value="DEV">DEV (Desenvolvedor)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !newEmail.trim() || !newName.trim()}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-extrabold bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-slate-950 hover:brightness-110 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              + Salvar Novo Integrante
            </button>
          </form>

          {/* Members List with Role Switcher */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-gold-400 flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              Integrantes Cadastrados ({membersList.length})
            </h3>

            <div className="space-y-1.5">
              {membersList.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-navy-950/40 border border-slate-200/80 dark:border-slate-800 text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {m.name} <span className="font-normal text-slate-500">({m.voice})</span>
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Mail className="w-3 h-3 opacity-60" />
                      {m.email}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={m.role}
                      onChange={(e) => handleChangeRole(m.id, e.target.value as UserRole)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-900 text-slate-900 dark:text-white"
                    >
                      <option value="MEMBER">MEMBER</option>
                      <option value="ADM">ADM</option>
                      <option value="DEV">DEV</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
