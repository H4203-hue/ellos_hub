export type EventStatus = 'CONFIRMED' | 'PROPOSAL' | 'INTERNAL';
export type SongStatus = 'READY' | 'REHEARSING' | 'TO_LEARN';
export type VoiceType = 'Soprano' | 'Contralto' | 'Tenor' | 'Baixo' | 'Geral';

export interface VoiceStem {
  label: VoiceType;
  driveUrl: string;
}

export interface EventItem {
  id: string;
  title: string;
  category: string;
  status: EventStatus;
  date?: string;
  time?: string;
  location?: string;
  contactName?: string;
  contactPhone?: string;
  notes?: string;
  votesCount?: { yes: number; total: number };
  userVoted?: boolean;
}

export interface SongItem {
  id: string;
  title: string;
  artistOrGroup?: string;
  keySignature?: string;
  bpm?: number;
  tags: string[];
  status: SongStatus;
  generalDriveFolderUrl: string;
  sheetMusicUrl?: string;
  voiceKits: VoiceStem[];
}

export interface TaskItem {
  id: string;
  description: string;
  category: 'DIVULGACAO' | 'LOGISTICA' | 'CONFRAS' | 'CONTATOS';
  dueDate?: string;
  isDone: boolean;
  assignedTo?: string;
}
