import { VoiceType, UserRole } from '@/types';

export interface GroupMember {
  id: string;
  name: string;
  email: string;
  voice: VoiceType;
  role: UserRole;
  phone?: string;
  isActive?: boolean;
}

export const groupMembers: GroupMember[] = [
  { id: 'prof-henrique', name: 'Henrique', email: 'henrique@ellos.com', voice: 'Tenor', role: 'DEV', phone: '11999990001', isActive: true },
  { id: 'prof-rayane', name: 'Rayane', email: 'rayane@ellos.com', voice: 'Soprano', role: 'ADM', phone: '11999990002', isActive: true },
  { id: 'prof-eloise', name: 'Eloise', email: 'eloise@ellos.com', voice: 'Contralto', role: 'ADM', phone: '11999990003', isActive: true },
  { id: 'prof-duda', name: 'Maria Eduarda (Duda)', email: 'duda@ellos.com', voice: 'Contralto', role: 'MEDIA', phone: '11999990004', isActive: true },
  { id: 'prof-giovanna', name: 'Giovanna', email: 'giovanna@ellos.com', voice: 'Soprano', role: 'MEMBER', phone: '11999990005', isActive: true },
  { id: 'prof-pedro-l', name: 'Pedro L.', email: 'pedrol@ellos.com', voice: 'Tenor', role: 'MEMBER', phone: '11999990006', isActive: true },
  { id: 'prof-pedro-y', name: 'Pedro Y.', email: 'pedroy@ellos.com', voice: 'Baixo', role: 'MEMBER', phone: '11999990007', isActive: true },
  { id: 'prof-laura', name: 'Laura', email: 'laura@ellos.com', voice: 'Soprano', role: 'MEMBER', phone: '11999990008', isActive: true },
  { id: 'prof-samily', name: 'Samily', email: 'samily@ellos.com', voice: 'Contralto', role: 'MEMBER', phone: '11999990009', isActive: true },
];

export const isMember = (member?: { role: UserRole } | null) => {
  if (!member) return false;
  return member.role === 'MEMBER' || member.role === 'MEDIA' || member.role === 'ADM' || member.role === 'DEV';
};

export const isMedia = (member?: { role: UserRole } | null) => {
  if (!member) return false;
  return member.role === 'MEDIA' || member.role === 'ADM' || member.role === 'DEV';
};

export const isAdm = (member?: { role: UserRole } | null) => {
  if (!member) return false;
  return member.role === 'ADM' || member.role === 'DEV';
};

export const isDev = (member?: { role: UserRole } | null) => {
  if (!member) return false;
  return member.role === 'DEV';
};
