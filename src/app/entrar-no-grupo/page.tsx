'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { VoiceType } from '@/types';
import { toast } from 'sonner';
import { 
  Music, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  KeyRound, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  UserCheck
} from 'lucide-react';
import Image from 'next/image';

function RegistrationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [isValidating, setIsValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [invalidReason, setInvalidReason] = useState<string | null>(null);
  const [inviteRole, setInviteRole] = useState<string>('MEMBER');

  // Step State: 'form' | 'otp' | 'success'
  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [voice, setVoice] = useState<VoiceType>('Soprano');
  const [password, setPassword] = useState('');

  // OTP 6 Digits State
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validar Token no Mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setTokenValid(false);
        setInvalidReason('Nenhum código de convite foi fornecido na URL.');
        setIsValidating(false);
        return;
      }

      try {
        const res = await fetch('/api/invites/validate?token=' + token);
        const data = await res.json();

        if (data.valid) {
          setTokenValid(true);
          setInviteRole(data.role || data.invite?.role || 'MEMBER');
        } else {
          setTokenValid(false);
          if (data.reason === 'already_used') {
            setInvalidReason('Este convite já foi utilizado para cadastrar outro integrante.');
          } else if (data.reason === 'expired') {
            setInvalidReason('Este convite expirou (a validade de 48 horas foi excedida).');
          } else {
            setInvalidReason('Convite não encontrado ou código inválido na URL.');
          }
        }
      } catch {
        setTokenValid(false);
        setInvalidReason('Erro ao comunicar com o servidor de validação de convites.');
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  // Avançar para tela de OTP
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }
    setStep('otp');
    toast.info('📩 Código de confirmação OTP enviado para o seu e-mail!');
  };

  // Tratar alteração dos dígitos do OTP
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);

    // Auto-avançar para o próximo input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  // Submeter cadastro final
  const handleConfirmOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otpDigits.join('');
    if (otpCode.length < 6) {
      toast.error('Informe o código OTP de 6 dígitos completo.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/invites/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          voice,
          password: password.trim(),
          otpCode,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setStep('success');
        toast.success('✨ Cadastro realizado com sucesso!');
      } else {
        toast.error(data.error || 'Erro ao concluir o cadastro.');
      }
    } catch {
      toast.error('Erro ao conectar com o servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-[#0F223D] flex items-center justify-center p-4 text-slate-100 font-sans">
        <div className="flex items-center gap-3 text-xs font-semibold text-gold-400">
          <Sparkles className="w-5 h-5 animate-spin" />
          <span>Validando credenciais do convite descartável...</span>
        </div>
      </div>
    );
  }

  // Tela de Convite Inválido / Já Utilizado
  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-[#0F223D] text-slate-100 flex flex-col justify-between p-4 sm:p-6 font-sans">
        <header className="max-w-md mx-auto w-full pt-4 pb-2 flex items-center justify-center">
          <Image
            src="/logo-ellos.svg"
            alt="Ellos Grupo Logo"
            width={160}
            height={42}
            priority
            className="h-10 w-auto object-contain"
          />
        </header>

        <main className="max-w-md mx-auto w-full my-auto py-6">
          <div className="bg-navy-900/90 backdrop-blur-md border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-black text-white">
                Convite Inválido ou Já Utilizado
              </h1>
              <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
                {invalidReason || 'Este link de convite expirou ou já foi queimado para o cadastro de outro integrante.'}
              </p>
            </div>

            <div className="pt-4 border-t border-navy-800 flex flex-col gap-2">
              <button
                onClick={() => router.push('/login')}
                className="w-full py-3 px-4 rounded-xl text-xs font-extrabold bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-slate-950 hover:brightness-110 shadow-md transition-all cursor-pointer"
              >
                Ir para o Login Principal
              </button>
            </div>
          </div>
        </main>

        <footer className="max-w-md mx-auto w-full text-center text-[10px] text-slate-400 pb-2">
          <p>&copy; {new Date().getFullYear()} Ellos Vocal — Sistema de Convites Protegidos</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F223D] text-slate-100 flex flex-col justify-between p-4 sm:p-6 font-sans">
      {/* Top Header */}
      <header className="max-w-md mx-auto w-full pt-4 pb-2 flex items-center justify-center">
        <Image
          src="/logo-ellos.svg"
          alt="Ellos Grupo Logo"
          width={160}
          height={42}
          priority
          className="h-10 w-auto object-contain"
        />
      </header>

      {/* Main Form Container */}
      <main className="max-w-md mx-auto w-full my-auto py-4">
        <AnimatePresence mode="wait">
          {/* PASSO 1: FORMULÁRIO DE DADOS */}
          {step === 'form' && (
            <motion.div
              key="step-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-navy-900/90 backdrop-blur-md border border-amber-500/20 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5"
            >
              <div className="text-center space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-gold-500/10 text-gold-300 border border-gold-500/30">
                  <ShieldCheck className="w-3.5 h-3.5 text-gold-400" />
                  <span>Convite Único para Integrante</span>
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight">
                  Bem-vindo ao Ellos Vocal
                </h1>
                <p className="text-xs text-slate-300">
                  Preencha seus dados pessoais para criar sua conta exclusiva no Ellos Hub.
                </p>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-3.5 text-xs">
                {/* Nome */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-200 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-gold-400" />
                    <span>Nome Completo *</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Pedro Henrique"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-navy-700 bg-navy-950/80 text-slate-100 text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                  />
                </div>

                {/* E-mail */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-200 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-gold-400" />
                    <span>E-mail Pessoal *</span>
                  </label>
                  <input
                    type="email"
                    placeholder="ex: integrante@ellos.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-navy-700 bg-navy-950/80 text-slate-100 text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                  />
                </div>

                {/* WhatsApp & Naipe */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-200 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-gold-400" />
                      <span>WhatsApp</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="(11) 99999-8888"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-navy-700 bg-navy-950/80 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-200 flex items-center gap-1">
                      <Music className="w-3.5 h-3.5 text-gold-400" />
                      <span>Naipe Vocal</span>
                    </label>
                    <select
                      value={voice}
                      onChange={(e) => setVoice(e.target.value as VoiceType)}
                      className="w-full px-3 py-2.5 rounded-xl border border-navy-700 bg-navy-950 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                    >
                      <option value="Soprano">Soprano</option>
                      <option value="Contralto">Contralto</option>
                      <option value="Tenor">Tenor</option>
                      <option value="Baixo">Baixo</option>
                    </select>
                  </div>
                </div>

                {/* Senha */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-200 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-gold-400" />
                    <span>Criar Senha de Acesso *</span>
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-navy-700 bg-navy-950/80 text-slate-100 text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl text-xs font-extrabold bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-slate-950 hover:brightness-110 shadow-lg shadow-gold-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <span>Avançar para Confirmação OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          )}

          {/* PASSO 2: CONFIRMAÇÃO OTP 6 DÍGITOS */}
          {step === 'otp' && (
            <motion.div
              key="step-otp"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-navy-900/90 backdrop-blur-md border border-amber-500/20 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5"
            >
              <div className="text-center space-y-1.5">
                <div className="w-12 h-12 rounded-2xl bg-gold-500/10 border border-gold-500/30 text-gold-400 flex items-center justify-center mx-auto mb-1">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black text-white">
                  Código de Confirmação (OTP)
                </h2>
                <p className="text-xs text-slate-300 max-w-xs mx-auto">
                  Digite os 6 dígitos de validação para ativar seu acesso como <strong className="text-gold-300">{voice}</strong>.
                </p>
              </div>

              <form onSubmit={handleConfirmOtp} className="space-y-5">
                {/* Inputs de 6 Dígitos */}
                <div className="flex justify-center gap-2">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-input-${idx}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      className="w-10 h-12 text-center text-lg font-black bg-navy-950 border border-navy-700 rounded-xl text-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                    />
                  ))}
                </div>

                <div className="space-y-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 rounded-xl text-xs font-extrabold bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-slate-950 hover:brightness-110 shadow-lg shadow-gold-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Validando OTP e criando perfil...</span>
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4" />
                        <span>Confirmar &amp; Ativar Conta</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep('form')}
                    className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                  >
                    ← Voltar e alterar dados
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* PASSO 3: SUCESSO */}
          {step === 'success' && (
            <motion.div
              key="step-success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-navy-900/90 border border-gold-500/30 rounded-3xl p-7 shadow-2xl text-center space-y-5"
            >
              <div className="w-16 h-16 bg-gradient-to-tr from-gold-500 to-gold-300 text-navy-950 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-gold-500/20">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white">
                  Seja Bem-Vindo ao Ellos Vocal! ✨
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Seu cadastro foi concluído e seu convite único foi ativado. Sua conta de <strong className="text-gold-300">{name}</strong> ({voice}) já está pronta.
                </p>
              </div>

              <div className="pt-3 border-t border-navy-800">
                <button
                  onClick={() => router.push('/login')}
                  className="w-full py-3.5 px-4 rounded-xl text-xs font-extrabold bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-slate-950 hover:brightness-110 shadow-lg shadow-gold-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Entrar no Ellos Hub Agora</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="max-w-md mx-auto w-full text-center text-[10px] text-slate-400 pb-2">
        <p>&copy; {new Date().getFullYear()} Ellos Vocal — Gestão &amp; Auto-Cadastro com OTP</p>
      </footer>
    </div>
  );
}

export default function EntrarNoGrupoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0F223D] flex items-center justify-center text-gold-400 text-xs font-semibold">
          Carregando dados do convite...
        </div>
      }
    >
      <RegistrationContent />
    </Suspense>
  );
}
