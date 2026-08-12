'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { groupMembers, GroupMember } from '@/data/groupMembers';
import { 
  Music, 
  Mail, 
  Lock, 
  KeyRound, 
  AlertCircle, 
  CheckSquare, 
  Square,
  Sparkles,
  UserCheck
} from 'lucide-react';

import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberDevice, setRememberDevice] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // 🔄 Redirecionamento Automático para Usuários Logados
  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        // Verificar no localStorage/sessionStorage
        const localSaved = localStorage.getItem('ellos_current_member');
        const sessionSaved = sessionStorage.getItem('ellos_current_member');

        if (localSaved || sessionSaved) {
          router.replace('/');
          return;
        }

        // Verificar sessão oficial do Supabase Auth
        if (supabase && isSupabaseConfigured) {
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            router.replace('/');
            return;
          }
        }
      } catch (err) {
        console.warn('Erro ao verificar sessão salva:', err);
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkActiveSession();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const emailClean = email.trim().toLowerCase();
    if (!emailClean) {
      setErrorMessage('Por favor, informe seu e-mail cadastrado.');
      return;
    }

    setIsLoading(true);

    try {
      let matchedMember: GroupMember | undefined;

      // 1. Buscar perfil na tabela public.profiles do Supabase
      if (supabase && isSupabaseConfigured) {
        const { data: profileData, error: profileErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', emailClean)
          .single();

        if (!profileErr && profileData) {
          matchedMember = {
            id: profileData.id,
            email: profileData.email,
            name: profileData.name,
            voice: profileData.voice,
            role: profileData.role,
          };
        }
      }

      // Fallback para lista padrão se offline/mock
      if (!matchedMember) {
        matchedMember = groupMembers.find((m) => m.email.toLowerCase() === emailClean);
      }

      // 🛑 Se o e-mail não estiver cadastrado no banco/lista, rejeitar!
      if (!matchedMember) {
        setErrorMessage('Acesso restrito a integrantes cadastrados pelo desenvolvedor.');
        setIsLoading(false);
        return;
      }

      // Tentar autenticação no Supabase Auth se senha preenchida
      if (supabase && isSupabaseConfigured && password.trim()) {
        const { error: authErr } = await supabase.auth.signInWithPassword({
          email: emailClean,
          password: password.trim(),
        });
        if (authErr) {
          console.warn('Supabase auth password warning:', authErr);
        }
      }

      // 📱 Tratar opção "Lembrar deste dispositivo"
      if (rememberDevice) {
        localStorage.setItem('ellos_current_member', JSON.stringify(matchedMember));
        sessionStorage.removeItem('ellos_current_member');
      } else {
        sessionStorage.setItem('ellos_current_member', JSON.stringify(matchedMember));
        localStorage.removeItem('ellos_current_member');
      }

      router.replace('/');
    } catch (err) {
      console.error('Erro no login:', err);
      setErrorMessage('Ocorreu um erro ao realizar login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-[#0F223D] flex items-center justify-center p-4 text-slate-100 font-sans">
        <div className="flex items-center gap-3 text-xs font-semibold text-gold-400">
          <Sparkles className="w-5 h-5 animate-spin" />
          <span>Verificando sessão ativa...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F223D] text-slate-100 flex flex-col justify-between p-4 sm:p-6 font-sans">
      {/* Top Bar Header */}
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

      {/* Main Login Card */}
      <main className="max-w-md mx-auto w-full my-auto py-6">
        <div className="bg-navy-900/90 backdrop-blur-md border border-amber-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gold-500/10 border border-gold-500/20 text-gold-400 mb-1">
              <UserCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Acesso ao Ellos Hub
            </h1>
            <p className="text-xs text-slate-300 max-w-xs mx-auto">
              Área exclusiva para integrantes do grupo Ellos Vocal.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Campo E-mail */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-gold-400" />
                <span>E-mail do Integrante *</span>
              </label>
              <input
                type="email"
                placeholder="ex: henrique@ellos.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-navy-700 bg-navy-950/80 text-slate-100 text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
              />
            </div>

            {/* Campo Senha */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-gold-400" />
                <span>Senha de Acesso</span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-navy-700 bg-navy-950/80 text-slate-100 text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
              />
            </div>

            {/* 📱 Checkbox Estilizado: Lembrar deste dispositivo */}
            <div className="pt-1 pb-1">
              <button
                type="button"
                onClick={() => setRememberDevice(!rememberDevice)}
                className="flex items-start gap-2.5 text-left group cursor-pointer"
              >
                <div className="mt-0.5 text-gold-400">
                  {rememberDevice ? (
                    <CheckSquare className="w-4 h-4 text-gold-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-500 group-hover:text-slate-400" />
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-200 block group-hover:text-gold-300 transition-colors">
                    Lembrar deste dispositivo
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Mantenha sua conta aberta neste navegador
                  </span>
                </div>
              </button>
            </div>

            {/* Botão de Entrar */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl text-xs font-extrabold bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-slate-950 hover:brightness-110 shadow-lg shadow-gold-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <span>Validando acesso...</span>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Entrar no Ellos Hub</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Select Shortcut for Dev / Demo */}
          <div className="pt-4 border-t border-navy-800/80 text-center">
            <p className="text-[11px] text-slate-400 mb-2">Integrantes cadastrados para login direto:</p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {groupMembers.slice(0, 4).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setEmail(m.email)}
                  className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-navy-950 text-gold-300 border border-gold-500/20 hover:bg-navy-800 cursor-pointer"
                >
                  {m.name} ({m.role})
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-md mx-auto w-full pt-4 pb-2 text-center text-[11px] text-slate-400">
        <p>&copy; {new Date().getFullYear()} Ellos Vocal — Gestão Musical Restrita</p>
      </footer>
    </div>
  );
}
