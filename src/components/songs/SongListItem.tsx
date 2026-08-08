'use client';

import React from 'react';
import { SongItem, VoiceStem } from '@/types';
import { 
  Music, 
  Folder, 
  FileText, 
  Headphones, 
  ExternalLink,
  Mic,
  Tag,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';

interface SongListItemProps {
  song: SongItem;
}

export const SongListItem: React.FC<SongListItemProps> = ({ song }) => {
  const getStatusBadge = () => {
    switch (song.status) {
      case 'READY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Pronta
          </span>
        );
      case 'REHEARSING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            Em Ensaio
          </span>
        );
      case 'TO_LEARN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            A Aprender
          </span>
        );
      default:
        return null;
    }
  };

  const getVoicePillColor = (label: string) => {
    switch (label) {
      case 'Soprano':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800/60 hover:bg-rose-100 dark:hover:bg-rose-900/60';
      case 'Contralto':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800/60 hover:bg-purple-100 dark:hover:bg-purple-900/60';
      case 'Tenor':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800/60 hover:bg-blue-100 dark:hover:bg-blue-900/60';
      case 'Baixo':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60';
      default:
        return 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-5">
      {/* Left: Info */}
      <div className="flex-1 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {getStatusBadge()}
          {song.keySignature && (
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              Tom: {song.keySignature}
            </span>
          )}
          {song.bpm && (
            <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {song.bpm} BPM
            </span>
          )}
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Music className="w-5 h-5 text-indigo-500 shrink-0" />
            <span>{song.title}</span>
          </h3>
          {song.artistOrGroup && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Arrranjo / Artista: {song.artistOrGroup}
            </p>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-slate-400" />
          {song.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Right: Drive links & Voice Stem Pills */}
      <div className="flex flex-col gap-3 min-w-[280px]">
        {/* Main Drive Action Buttons */}
        <div className="flex items-center gap-2">
          {song.generalDriveFolderUrl && (
            <a
              href={song.generalDriveFolderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 rounded-lg border border-indigo-200/80 dark:border-indigo-800/60 transition-colors"
            >
              <Folder className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Pasta Drive</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          )}

          {song.sheetMusicUrl && (
            <a
              href={song.sheetMusicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <span>Partitura / Cifra</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          )}
        </div>

        {/* Vocal Stems / Kits Section */}
        {song.voiceKits && song.voiceKits.length > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1.5">
              <Headphones className="w-3.5 h-3.5 text-indigo-500" />
              Kits de Ensaio por Naipe:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {song.voiceKits.map((stem: VoiceStem) => (
                <a
                  key={stem.label}
                  href={stem.driveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors ${getVoicePillColor(
                    stem.label
                  )}`}
                >
                  <Mic className="w-3 h-3 opacity-75" />
                  <span>{stem.label}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
