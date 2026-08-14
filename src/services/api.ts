import { supabase } from '@/lib/supabase';
import { EventItem, SongItem, TaskItem } from '@/types';
import { GroupMember } from '@/data/groupMembers';

/**
 * Busca estritamente o perfil do usuário logado na tabela `public.profiles` pelo ID da sessão ativa.
 */
export const fetchUserProfileById = async (userId: string) => {
  if (!supabase) return { profile: null, error: new Error('Supabase não configurado') };

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  return { profile, error };
};

/**
 * Mapeia o registro da tabela public.profiles para o tipo GroupMember.
 */
export const mapProfileToGroupMember = (profile: any): GroupMember => ({
  id: profile.id,
  email: profile.email,
  name: profile.name,
  voice: profile.voice || 'Geral',
  role: profile.role,
  phone: profile.phone,
  isActive: profile.is_active !== false,
});

// Serviços de deleção
export const deleteEventFromSupabase = async (id: string) => {
  console.log(`🚀 [DEBUG EXCLUSÃO API] ID recebido: "${id}" | Tamanho do texto: ${id?.length}`);
  if (!id) {
    console.error("❌ ERRO CRÍTICO: Tentativa de excluir com ID vazio!");
    return { data: null, error: new Error('ID vazio') };
  }
  if (!supabase) return { data: null, error: new Error('Supabase não configurado') };
  return await supabase.from('events').delete().eq('id', id).select();
};

export const deleteSongFromSupabase = async (id: string) => {
  console.log(`🚀 [DEBUG EXCLUSÃO API] ID recebido: "${id}" | Tamanho do texto: ${id?.length}`);
  if (!id) {
    console.error("❌ ERRO CRÍTICO: Tentativa de excluir com ID vazio!");
    return { data: null, error: new Error('ID vazio') };
  }
  if (!supabase) return { data: null, error: new Error('Supabase não configurado') };
  return await supabase.from('songs').delete().eq('id', id).select();
};

export const deleteTaskFromSupabase = async (id: string) => {
  console.log(`🚀 [DEBUG EXCLUSÃO API] ID recebido: "${id}" | Tamanho do texto: ${id?.length}`);
  if (!id) {
    console.error("❌ ERRO CRÍTICO: Tentativa de excluir com ID vazio!");
    return { data: null, error: new Error('ID vazio') };
  }
  if (!supabase) return { data: null, error: new Error('Supabase não configurado') };
  return await supabase.from('tasks').delete().eq('id', id).select();
};

// Serviço de criação de convites públicos
export interface PublicInvitationPayload {
  contactName: string;
  contactPhone: string;
  location: string;
  category: string;
  date?: string;
  period?: string;
  notes?: string;
}

export const createPublicInvitation = async (payload: PublicInvitationPayload) => {
  const fullNotes = [
    payload.period ? `Período: ${payload.period}` : '',
    payload.notes ? `Observações: ${payload.notes}` : '',
  ].filter(Boolean).join(' | ');

  const eventRow = {
    title: payload.location,
    category: payload.category,
    status: 'PROPOSAL',
    date: payload.date || 'A definir',
    time: payload.period || 'A definir',
    location: payload.location,
    contact_name: payload.contactName,
    contact_phone: payload.contactPhone,
    notes: fullNotes || 'Solicitação de convite enviada via formulário público.',
    votes_yes: 1,
    votes_total: 7,
  };

  if (supabase) {
    const { data, error } = await supabase
      .from('events')
      .insert([eventRow])
      .select()
      .single();

    if (error) {
      console.error("❌ ERRO AO CRIAR NO BANCO:", error);
      alert(`Erro ao salvar: ${error.message} \nDetalhes: ${error.details || error.hint || ''}`);
      throw error;
    }
    return [data];
  }

  return [{ ...eventRow, id: `evt-public-${Date.now()}` }];
};
