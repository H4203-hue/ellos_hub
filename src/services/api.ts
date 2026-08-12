import { supabase } from '@/lib/supabase';
import { EventItem, SongItem, TaskItem } from '@/types';

// Serviço de deleção de eventos
export const deleteEventFromSupabase = async (id: string) => {
  if (!supabase) return null;
  return await supabase.from('events').delete().eq('id', id);
};

// Serviço de deleção de músicas
export const deleteSongFromSupabase = async (id: string) => {
  if (!supabase) return null;
  return await supabase.from('songs').delete().eq('id', id);
};

// Serviço de deleção de tarefas
export const deleteTaskFromSupabase = async (id: string) => {
  if (!supabase) return null;
  return await supabase.from('tasks').delete().eq('id', id);
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
  const newId = `evt-public-${Date.now()}`;
  
  const fullNotes = [
    payload.period ? `Período: ${payload.period}` : '',
    payload.notes ? `Observações: ${payload.notes}` : '',
  ].filter(Boolean).join(' | ');

  const eventRow = {
    id: newId,
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
    const { data, error } = await supabase.from('events').insert(eventRow).select();
    if (error) throw error;
    return data;
  }

  return [eventRow];
};
