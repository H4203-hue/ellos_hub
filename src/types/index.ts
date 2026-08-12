export type EventStatus = 'CONFIRMED' | 'PROPOSAL' | 'INTERNAL';
export type SongStatus = 'READY' | 'REHEARSING' | 'TO_LEARN';
export type VoiceType = 'Soprano' | 'Contralto' | 'Tenor' | 'Baixo' | 'Geral';
export type UserRole = 'MEMBER' | 'MEDIA' | 'ADM' | 'DEV';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  voice: VoiceType;
  role: UserRole;
}

export interface RepertoireTag {
  id: string;
  name: string;
  colorHex: string;
  description?: string;
}

export interface GlobalSettings {
  appDomain: string;
  driveRootUrl: string;
  instagramBio: string;
}

export interface VoiceStem {
  label: VoiceType;
  driveUrl: string;
}

export interface CarpoolDriver {
  name: string;
  spots: number;
}

export interface ScheduleItem {
  time: string;
  activity: string;
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
  dressCode?: string;
  drivers?: CarpoolDriver[];
  passengers?: string[];
  schedule?: ScheduleItem[];
  microphonesCount?: number;
  songIds?: string[];
  votingDeadline?: string;
  isVotingClosed?: boolean;
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
