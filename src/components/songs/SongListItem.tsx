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
  Sparkles,
  Pencil,
  Trash2
} from 'lucide-react';

interface SongListItemProps {
  song: SongItem;
  onEditSong?: (song: SongItem) => void;
  onDeleteSong?: (songId: string) => void;
}

export const SongListItem: React.FC<SongListItemProps> = ({ song, onEditSong, onDeleteSong }) => {
  const getStatusBadge = () => {
    switch (song.status) {
      case 'READY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Pronta
          </span>
        );
      case 'REHEARSING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-navy-500/10 text-navy-700 dark:text-navy-300 border border-navy-500/30">
            <Clock className="w-3.5 h-3.5 text-navy-600 dark:text-navy-400" />
            Em Ensaio
          </span>
        );
      case 'TO_LEARN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5 text-theme-primary dark:text-theme-primary" />
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

  const isHighlightTag = (tag: string) => /autoral|ellos/i.test(tag);

  return (
    <div className="relative bg-white dark:bg-[#1B365D] border border-slate-200/90 dark:border-amber-500/20 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-navy-600/30 dark:hover:border-theme-primary/40 transition-all duration-200 flex flex-col md:flex-row md:items-start justify-between gap-5">
      {/* Botões de Editar & Excluir no Canto Superior Direito */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1">
        {onEditSong && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEditSong(song);
            }}
            title="Editar Música"
            className="p-2 rounded-lg bg-slate-800/60 hover:bg-amber-400/20 text-slate-400 hover:text-amber-400 border border-slate-700/50 hover:border-amber-400/40 transition-all cursor-pointer shadow-xs"
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}
        {onDeleteSong && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDeleteSong(song.id);
            }}
            title="Excluir Música"
            className="p-2 rounded-lg bg-slate-800/60 hover:bg-rose-400/20 text-slate-400 hover:text-rose-400 border border-slate-700/50 hover:border-rose-400/40 transition-all cursor-pointer shadow-xs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Coluna Esquerda: Informações da Música, Badges & Tags */}
      <div className="flex-1 space-y-3 pr-2 sm:pr-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Music className="w-5 h-5 text-navy-700 dark:text-theme-primary shrink-0" />
            <span>{song.title}</span>
          </h3>
          {song.artistOrGroup && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Arranjo / Grupo: <span className="font-medium text-slate-700 dark:text-slate-300">{song.artistOrGroup}</span>
            </p>
          )}
        </div>

        {/* Badges de Status, Tom e BPM */}
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
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

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {song.tags.map((tag) => (
            <span
              key={tag}
              className={
                isHighlightTag(tag)
                  ? 'px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                  : 'px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Coluna Direita: Links de Ação (Drive/Cifra) & Kits de Voz por Naipe */}
      {/* pr-24: os botões de Editar/Excluir ficam absolutos no canto (top-4 right-4),
          essa folga é a reserva pra eles não colidirem com "Pasta Drive"/"Cifra / PDF" */}
      <div className="flex flex-col gap-3 min-w-[260px] shrink-0 pr-24">
        {/* Botoes de Ação Principais */}
        <div className="flex items-center gap-2">
          {song.generalDriveFolderUrl && (
            <a
              href={song.generalDriveFolderUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(song.generalDriveFolderUrl, '_blank');
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-navy-700 bg-navy-500/10 hover:bg-navy-500/20 dark:text-navy-300 rounded-xl border border-navy-500/30 transition-colors"
            >
              <Folder className="w-4 h-4 text-navy-600 dark:text-navy-400" />
              <span>Pasta Drive</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          )}

          {song.sheetMusicUrl && (
            <a
              href={song.sheetMusicUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(song.sheetMusicUrl, '_blank');
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <span>Cifra / PDF</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          )}
        </div>

        {/* Pílulas de Kits por Naipe (Soprano, Contralto, Tenor, Baixo) */}
        {song.voiceKits && song.voiceKits.length > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-navy-800/60">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1.5">
              <Headphones className="w-3.5 h-3.5 text-navy-600 dark:text-theme-primary" />
              Kits por Naipe:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {song.voiceKits.map((stem: VoiceStem) => (
                <a
                  key={stem.label}
                  href={stem.driveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (stem.driveUrl) {
                      window.open(stem.driveUrl, '_blank');
                    }
                  }}
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
