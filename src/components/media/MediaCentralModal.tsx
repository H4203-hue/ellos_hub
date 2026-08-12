'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EventItem } from '@/types';
import { toast } from 'sonner';
import { 
  X, 
  Sparkles, 
  Copy, 
  Check, 
  Download, 
  Share2, 
  Camera, 
  Palette, 
  FileText, 
  Image as ImageIcon
} from 'lucide-react';
import Image from 'next/image';

interface MediaCentralModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: EventItem[];
}

export const MediaCentralModal: React.FC<MediaCentralModalProps> = ({
  isOpen,
  onClose,
  events,
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || '');
  const [copiedText, setCopiedText] = useState(false);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedEvent = events.find((e) => e.id === selectedEventId) || events[0];

  // Gerador de Legenda para Instagram
  const generateInstagramCopy = (evt?: EventItem) => {
    if (!evt) return 'Selecione um evento para gerar a legenda.';

    return `✨ COMPROMISSO CONFIRMADO — ELLOS VOCAL ✨

🎵 Evento: ${evt.title}
📍 Local: ${evt.location || 'A definir'}
📅 Data: ${evt.date || 'A definir'}
⏰ Horário: ${evt.time || 'A definir'}
👔 Traje: ${evt.dressCode || 'Social'}

Venha louvar a Deus conosco neste programa especial! Guarde essa data e compartilhe com seus amigos.

#EllosVocal #GrupoVocal #MusicaSacra #Adoracao #EllosHub`;
  };

  const handleCopyCopyText = () => {
    const copyText = generateInstagramCopy(selectedEvent);
    navigator.clipboard.writeText(copyText);
    setCopiedText(true);
    toast.success('📱 Copy formatada copiada para a área de transferência!', {
      description: 'Pronta para colar na legenda do Instagram.',
    });
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleCopyColorHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedColor(hex);
    toast.success(`🎨 Código de cor ${hex} copiado!`);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const brandColors = [
    { name: 'Navy Principal', hex: '#0F223D', bgClass: 'bg-[#0F223D]' },
    { name: 'Dourado Champagne', hex: '#D4AF37', bgClass: 'bg-[#D4AF37]' },
    { name: 'Navy Card', hex: '#1B365D', bgClass: 'bg-[#1B365D]' },
    { name: 'Dourado Claro', hex: '#F3E0AA', bgClass: 'bg-[#F3E0AA]' },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 font-sans no-scrollbar">
        {/* Backdrop Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/65 backdrop-blur-md"
        />

        {/* Modal Panel */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-[#1B365D] border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[88vh] z-10"
        >
          {/* Top Header */}
          <div className="bg-gradient-to-r from-navy-900 via-navy-950 to-navy-900 p-5 border-b border-amber-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gold-500/10 border border-gold-500/20 text-gold-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  Central de Mídia &amp; Imprensa
                </h2>
                <p className="text-xs text-slate-300">
                  Kit de Marca, Gerador de Copys para Instagram e Recursos Gráficos
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-6 overflow-y-auto no-scrollbar space-y-6 flex-1">
            {/* Seção 1: Gerador de Copys / Legendas para Instagram */}
            <div className="bg-navy-950/70 p-5 rounded-2xl border border-amber-500/20 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gold-400 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  Gerador de Copys &amp; Legendas (Instagram)
                </span>
              </div>

              {/* Seletor de Evento */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Selecione o compromisso para gerar a legenda:
                </label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-navy-700 bg-navy-900 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/50 font-semibold"
                >
                  {events.map((evt) => (
                    <option key={evt.id} value={evt.id}>
                      {evt.title} — {evt.date || 'Sem data'} ({evt.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Caixa de Texto Gerado */}
              <div className="relative">
                <textarea
                  readOnly
                  rows={7}
                  value={generateInstagramCopy(selectedEvent)}
                  className="w-full px-4 py-3 rounded-2xl border border-navy-700 bg-navy-900 text-slate-200 text-xs font-mono leading-relaxed resize-none focus:outline-none select-all"
                />

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCopyCopyText}
                  className="absolute bottom-3 right-3 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-slate-950 hover:brightness-110 shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedText ? (
                    <>
                      <Check className="w-4 h-4 text-slate-950" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Legenda em 1-Clique</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>

            {/* Seção 2: Kit de Imprensa (Logo & Identidade Visual) */}
            <div className="bg-navy-950/70 p-5 rounded-2xl border border-amber-500/20 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-gold-400 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4" />
                Kit de Imprensa &amp; Vetor Oficial
              </span>

              <div className="flex flex-col sm:flex-row items-center justify-between bg-navy-900 p-4 rounded-xl border border-navy-800 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#0F223D] border border-gold-500/20">
                    <Image
                      src="/logo-ellos.svg"
                      alt="Ellos Logo"
                      width={120}
                      height={32}
                      className="h-7 w-auto object-contain"
                    />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-white">Logo Vetorial SVG</h4>
                    <p className="text-[11px] text-slate-400">
                      Identidade oficial em vetor de alta resolução para cartazes e artes.
                    </p>
                  </div>
                </div>

                <a
                  href="/logo-ellos.svg"
                  download="logo-ellos.svg"
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-navy-800 hover:bg-navy-700 text-gold-300 border border-gold-500/30 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Download className="w-4 h-4 text-gold-400" />
                  <span>Download SVG</span>
                </a>
              </div>
            </div>

            {/* Seção 3: Paleta de Cores Oficiais */}
            <div className="bg-navy-950/70 p-5 rounded-2xl border border-amber-500/20 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gold-400 flex items-center gap-1.5">
                <Palette className="w-4 h-4" />
                Paleta de Cores do Ellos Hub
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                {brandColors.map((col) => (
                  <button
                    key={col.hex}
                    onClick={() => handleCopyColorHex(col.hex)}
                    className="p-3 rounded-xl bg-navy-900 border border-navy-800 text-left hover:border-gold-500/40 transition-all cursor-pointer group"
                  >
                    <div className={`h-8 w-full rounded-lg ${col.bgClass} border border-white/10 mb-2 shadow-xs`} />
                    <span className="text-[11px] font-bold text-white block truncate">
                      {col.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
                      <span>{col.hex}</span>
                      {copiedColor === col.hex ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
