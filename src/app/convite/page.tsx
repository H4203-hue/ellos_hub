'use client';

import React, { useState } from 'react';
import { createPublicInvitation } from '@/services/api';
import { 
  Music, 
  Sparkles, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  CheckCircle2, 
  Send,
  HeartHandshake
} from 'lucide-react';

import Image from 'next/image';

export default function ConvitePage() {
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('Culto de Mandado');
  const [date, setDate] = useState('');
  const [period, setPeriod] = useState('Manhã');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim() || !location.trim()) {
      setErrorMessage('Por favor, preencha os campos obrigatórios (Nome, WhatsApp e Igreja/Local).');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await createPublicInvitation({
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        location: location.trim(),
        category,
        date: date || undefined,
        period,
        notes: notes.trim() || undefined,
      });

      setIsSuccess(true);
    } catch (err) {
      console.error('Erro ao enviar convite:', err);
      setErrorMessage('Ocorreu um erro ao enviar a solicitação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setContactName('');
    setContactPhone('');
    setLocation('');
    setCategory('Culto de Mandado');
    setDate('');
    setPeriod('Manhã');
    setNotes('');
    setIsSuccess(false);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen max-h-screen bg-[#0F223D] text-slate-100 flex flex-col justify-between p-3 sm:p-4 overflow-hidden font-sans no-scrollbar">
      {/* Header Limpo com Logo do Ellos em SVG (Sem Navegação Interna) */}
      <header className="max-w-md mx-auto w-full pt-1 pb-1 flex items-center justify-center shrink-0">
        <Image
          src="/logo-ellos.svg"
          alt="Ellos Grupo Logo"
          width={150}
          height={40}
          priority
          className="h-9 w-auto object-contain"
        />
      </header>

      {/* Main Container Form — Fit to Screen */}
      <main className="max-w-md mx-auto w-full my-auto flex-1 flex flex-col justify-center overflow-hidden">
        {isSuccess ? (
          /* Tela de Sucesso */
          <div className="bg-navy-900/90 border border-gold-500/30 rounded-3xl p-5 sm:p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 my-auto">
            <div className="w-14 h-14 bg-gradient-to-tr from-gold-500 to-gold-300 text-navy-950 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-gold-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-black text-white">
                Solicitação Enviada! ✨
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Recebemos sua solicitação para a igreja/local{' '}
                <strong className="text-gold-300">{location}</strong>. Em breve nossa regência/secretaria entrará em contato via WhatsApp.
              </p>
            </div>

            <div className="pt-3 border-t border-navy-800/80 flex flex-col gap-2.5">
              <button
                onClick={handleReset}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-navy-800 text-gold-300 hover:bg-navy-700 border border-gold-500/20 transition-all cursor-pointer"
              >
                Enviar Outro Convite
              </button>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-slate-950 hover:brightness-110 shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Voltar ao Instagram</span>
              </a>
            </div>
          </div>
        ) : (
          /* Form de Solicitação — Compact Fit to Screen */
          <div className="bg-navy-900/90 backdrop-blur-md border border-amber-500/20 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3 max-h-[92vh] sm:max-h-[620px] flex flex-col justify-between overflow-y-auto no-scrollbar">
            <div className="text-center space-y-1 shrink-0">
              <div className="inline-flex items-center justify-center p-2 rounded-xl bg-gold-500/10 border border-gold-500/20 text-gold-400 mb-0.5">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-black text-white tracking-tight">
                Convide o Ellos Vocal
              </h1>
              <p className="text-[11px] text-slate-300 max-w-xs mx-auto">
                Preencha os dados abaixo para solicitar uma apresentação ou culto especial.
              </p>
            </div>

            {errorMessage && (
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium text-center shrink-0">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-2.5 flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                {/* Nome do Responsável */}
                <div className="space-y-0.5">
                  <label className="text-[11px] font-semibold text-slate-200 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-gold-400" />
                    <span>Seu Nome (Responsável) *</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Pr. Marcelo / Maria Silva"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-navy-700 bg-navy-950/80 text-slate-100 text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                  />
                </div>

                {/* WhatsApp com DDD */}
                <div className="space-y-0.5">
                  <label className="text-[11px] font-semibold text-slate-200 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-gold-400" />
                    <span>WhatsApp com DDD *</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="Ex: (11) 99999-8888"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-navy-700 bg-navy-950/80 text-slate-100 text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                  />
                </div>

                {/* Nome da Igreja / Local */}
                <div className="space-y-0.5">
                  <label className="text-[11px] font-semibold text-slate-200 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gold-400" />
                    <span>Nome da Igreja / Local *</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: IASD Central de Campinas"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-navy-700 bg-navy-950/80 text-slate-100 text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                  />
                </div>

                {/* Tipo de Evento */}
                <div className="space-y-0.5">
                  <label className="text-[11px] font-semibold text-slate-200 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-gold-400" />
                    <span>Tipo de Evento</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-navy-700 bg-navy-950 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                  >
                    <option value="Culto de Mandado">Culto de Mandado / Culto de Sábado</option>
                    <option value="Escola Sabatina">Escola Sabatina</option>
                    <option value="Culto Jovem">Culto Jovem / JA</option>
                    <option value="Cerimônia de Casamento">Cerimônia de Casamento</option>
                    <option value="Evento Corporativo / Saúde">Evento Corporativo / Especial</option>
                    <option value="Outro">Outro Tipo de Programa</option>
                  </select>
                </div>

                {/* Data & Período (2 colunas) */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <label className="text-[11px] font-semibold text-slate-200 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gold-400" />
                      <span>Data Pretendida</span>
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-navy-700 bg-navy-950 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                    />
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[11px] font-semibold text-slate-200 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gold-400" />
                      <span>Período</span>
                    </label>
                    <select
                      value={period}
                      onChange={(e) => setPeriod(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-navy-700 bg-navy-950 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                    >
                      <option value="Manhã">Manhã</option>
                      <option value="Tarde">Tarde</option>
                      <option value="Noite">Noite</option>
                      <option value="Dia Inteiro">Dia Inteiro</option>
                    </select>
                  </div>
                </div>

                {/* Observações (Compact 2 rows) */}
                <div className="space-y-0.5">
                  <label className="text-[11px] font-semibold text-slate-200">
                    Observações (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Expectativas ou horários específicos..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-navy-700 bg-navy-950/80 text-slate-100 text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-gold-500/50 resize-none"
                  />
                </div>
              </div>

              {/* Botão de Envio */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl text-xs font-extrabold bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-slate-950 hover:brightness-110 shadow-lg shadow-gold-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0 mt-1"
              >
                {isSubmitting ? (
                  <span>Enviando convite...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Enviar Solicitação de Convite</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Footer Simples */}
      <footer className="max-w-md mx-auto w-full pt-1 pb-1 text-center text-[10px] text-slate-400 shrink-0">
        <p>&copy; {new Date().getFullYear()} Ellos Vocal — Todos os direitos reservados</p>
      </footer>
    </div>
  );
}
