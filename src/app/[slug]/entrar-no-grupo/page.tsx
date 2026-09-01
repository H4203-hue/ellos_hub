'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { VoiceType } from '@/types';
import { GroupMember } from '@/data/groupMembers';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { toast } from 'sonner';
import { 
  Music, 
  Sparkles, 
  AlertCircle, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import Image from 'next/image';
import { useTenant } from '@/context/TenantContext';

function RegistrationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const { workspace, tenant, slug } = useTenant();

  const [isValidating, setIsValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [invalidReason, setInvalidReason] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [voice, setVoice] = useState<VoiceType>('Soprano');
  const [password, setPassword] = useState('');
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

  // Submeter cadastro direto e autenticar/redirecionar
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }

    setIsSubmitting(true);

    try {
      const emailClean = email.trim().toLowerCase();
      const res = await fetch('/api/invites/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          name: name.trim(),
          email: emailClean,
          phone: phone.trim(),
          voice,
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (data.success && data.user) {
        const memberObj: GroupMember = {
          id: data.user.id,
          name: data.user.name || name.trim(),
          email: data.user.email || emailClean,
          voice: data.user.voice || voice,
          role: data.user.role || 'MEMBER',
          phone: phone.trim() || undefined,
        };

        localStorage.setItem('ellos_current_member', JSON.stringify(memberObj));

        if (supabase && isSupabaseConfigured) {
          await supabase.auth.signInWithPassword({
            email: emailClean,
            password: password.trim(),
          }).catch((err) => console.warn('Auto-login Supabase Auth notice:', err));
        }

        toast.success(`✨ Bem-vindo ao ${workspace?.name || tenant.name}, ${memberObj.name}!`);
        router.replace(`/${slug || 'ellos'}`);
      } else {
        toast.error(data.error || 'Erro ao concluir o cadastro.');
      }
    } catch {
      toast.error('Erro ao conectar com o servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayName = workspace?.name || tenant.name || 'Grupo Vocal';

  if (isValidating) {
    return (
      <div className="min-h-screen bg-[#0F223D] flex items-center justify-center p-4 text-slate-100 font-sans">
        <div className="flex items-center gap-3 text-xs font-semibold text-theme-primary">
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
          {workspace?.logo_url || tenant.logo ? (
            <Image
              src={workspace?.logo_url || tenant.logo || '/logo-ellos.svg'}
              alt={displayName}
              width={160}
              height={42}
              priority
              className="h-10 w-auto object-contain"
            />
          ) : (
            <span className="font-black text-xl text-white">{displayName}</span>
          )}
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
                className="w-full py-3 px-4 rounded-xl text-xs font-extrabold bg-gradient-to-r from-theme-primary to-theme-primary-dark text-slate-950 hover:brightness-110 shadow-md transition-all cursor-pointer"
              >
                Ir para o Login Principal
              </button>
            </div>
          </div>
        </main>

        <footer className="max-w-md mx-auto w-full text-center text-[10px] text-slate-400 pb-2">
          <p>&copy; {new Date().getFullYear()} {displayName} — Sistema de Convites Protegidos</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F223D] text-slate-100 flex flex-col justify-between p-4 sm:p-6 font-sans">
      <header className="max-w-md mx-auto w-full pt-4 pb-2 flex items-center justify-center">
        {workspace?.logo_url || tenant.logo ? (
          <Image
            src={workspace?.logo_url || tenant.logo || '/logo-ellos.svg'}
            alt={displayName}
            width={160}
            height={42}
            priority
            className="h-10 w-auto object-contain"
          />
        ) : (
          <span className="font-black text-xl text-white">{displayName}</span>
        )}
      </header>

      <main className="max-w-md mx-auto w-full my-auto py-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-navy-900/90 backdrop-blur-md border border-theme-primary/20 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5"
        >
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-theme-primary/10 text-theme-primary border border-theme-primary/30">
              <ShieldCheck className="w-3.5 h-3.5 text-theme-primary" />
              <span>Convite Único para Integrante</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Bem-vindo ao {displayName}
            </h1>
            <p className="text-xs text-slate-300">
              Preencha seus dados pessoais para ativar sua conta no Hub.
            </p>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-3.5 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-200 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-theme-primary" />
                <span>Nome Completo *</span>
              </label>
              <input
                type="text"
                placeholder="Ex: Pedro Henrique"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-navy-700 bg-navy-950/80 text-slate-100 text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-theme-primary/50"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-200 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-theme-primary" />
                <span>E-mail Pessoal *</span>
              </label>
              <input
                type="email"
                placeholder="ex: integrante@ellos.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-navy-700 bg-navy-950/80 text-slate-100 text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-theme-primary/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-semibold text-slate-200 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-theme-primary" />
                  <span>WhatsApp</span>
                </label>
                <input
                  type="tel"
                  placeholder="(11) 99999-8888"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-navy-700 bg-navy-950/80 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-theme-primary/50"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-200 flex items-center gap-1">
                  <Music className="w-3.5 h-3.5 text-theme-primary" />
                  <span>{workspace?.custom_labels?.category || 'Naipe Vocal'}</span>
                </label>
                <select
                  value={voice}
                  onChange={(e) => setVoice(e.target.value as VoiceType)}
                  className="w-full px-3 py-2.5 rounded-xl border border-navy-700 bg-navy-950 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-theme-primary/50"
                >
                  <option value="Soprano">Soprano</option>
                  <option value="Contralto">Contralto</option>
                  <option value="Tenor">Tenor</option>
                  <option value="Baixo">Baixo</option>
                  <option value="Geral">Geral</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-200 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-theme-primary" />
                <span>Criar Senha de Acesso *</span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-navy-700 bg-navy-950/80 text-slate-100 text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-theme-primary/50"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl text-xs font-extrabold bg-gradient-to-r from-theme-primary to-theme-primary-dark text-slate-950 hover:brightness-110 shadow-lg shadow-theme-primary/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {isSubmitting ? (
                <span>Criando conta e acessando...</span>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Criar Conta &amp; Acessar</span>
                </>
              )}
            </button>
          </form>
        </motion.div>
      </main>

      <footer className="max-w-md mx-auto w-full text-center text-[10px] text-slate-400 pb-2">
        <p>&copy; {new Date().getFullYear()} {displayName} — Sistema de Gestão &amp; Convites Restritos</p>
      </footer>
    </div>
  );
}

export default function WorkspaceEntrarNoGrupoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0F223D] flex items-center justify-center text-theme-primary text-xs font-semibold">
          Carregando dados do convite...
        </div>
      }
    >
      <RegistrationContent />
    </Suspense>
  );
}
