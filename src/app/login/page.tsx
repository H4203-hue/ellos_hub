'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { GroupMember } from '@/data/groupMembers';
import { toast } from 'sonner';
import { 
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

const GoogleIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberDevice, setRememberDevice] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // 🔄 Redirecionamento Automático para Usuários Logados
  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const localSaved = localStorage.getItem('ellos_current_member');
        const sessionSaved = sessionStorage.getItem('ellos_current_member');

        if (localSaved || sessionSaved) {
          router.replace('/');
          return;
        }

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

  // 🌐 Login com o Google OAuth
  const handleGoogleLogin = async () => {
    if (!supabase || !isSupabaseConfigured) {
      toast.error('Serviço de autenticação não configurado.');
      return;
    }

    setIsGoogleLoading(true);

    try {
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message || 'Erro ao iniciar login com o Google.');
        setIsGoogleLoading(false);
      }
    } catch {
      toast.error('Erro ao conectar com o provedor do Google.');
      setIsGoogleLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const emailClean = email.trim().toLowerCase();
    if (!emailClean || !password.trim()) {
      setErrorMessage('Por favor, preencha o e-mail e a senha.');
      toast.error('Preencha o e-mail e a senha para acessar.');
      return;
    }

    setIsLoading(true);

    try {
      if (supabase && isSupabaseConfigured) {
        // 🔒 Autenticação Estrita via Supabase Auth
        const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
          email: emailClean,
          password: password.trim(),
        });

        if (authErr || !authData?.user) {
          setErrorMessage('E-mail ou senha incorretos.');
          toast.error('E-mail ou senha incorretos.');
          setIsLoading(false);
          return;
        }

        // Buscar dados atualizados do perfil em public.profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        const memberObj: GroupMember = profile
          ? {
              id: profile.id,
              email: profile.email,
              name: profile.name,
              voice: profile.voice,
              role: profile.role,
              phone: profile.phone,
              isActive: profile.is_active !== false,
            }
          : {
              id: authData.user.id,
              email: emailClean,
              name: authData.user.user_metadata?.name || 'Integrante',
              voice: authData.user.user_metadata?.voice || 'Soprano',
              role: authData.user.user_metadata?.role || 'MEMBER',
              phone: authData.user.user_metadata?.phone,
              isActive: true,
            };

        // Salvar sessão local conforme preferência
        if (rememberDevice) {
          localStorage.setItem('ellos_current_member', JSON.stringify(memberObj));
          sessionStorage.removeItem('ellos_current_member');
        } else {
          sessionStorage.setItem('ellos_current_member', JSON.stringify(memberObj));
          localStorage.removeItem('ellos_current_member');
        }

        toast.success(`✨ Bem-vindo ao Ellos Hub, ${memberObj.name}!`);
        router.replace('/');
        return;
      }

      setErrorMessage('Ambiente Supabase não configurado. Verifique as chaves de acesso.');
    } catch {
      setErrorMessage('Erro ao autenticar no Supabase Auth. Tente novamente.');
      toast.error('Erro ao conectar com os serviços de autenticação.');
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

          {/* 🌐 BOTÃO OFICIAL DE LOGIN COM O GOOGLE */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || isLoading}
              className="w-full py-3 px-4 rounded-xl text-xs font-extrabold bg-white text-slate-900 hover:bg-slate-100 shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              {isGoogleLoading ? (
                <Sparkles className="w-4 h-4 text-slate-700 animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              <span>{isGoogleLoading ? 'Redirecionando para o Google...' : 'Entrar com o Google'}</span>
            </button>

            {/* ─── DIVISÓRIA VISUAL ELEGANTE ─── */}
            <div className="relative flex items-center justify-center pt-2">
              <div className="w-full border-t border-navy-800" />
              <span className="absolute bg-[#112646] px-3 text-[11px] font-semibold text-slate-400">
                ou entre com e-mail e senha
              </span>
            </div>
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
                placeholder="ex: integrante@ellos.com"
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
                <span>Senha de Acesso *</span>
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

            {/* Checkbox Estilizado: Lembrar deste dispositivo */}
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
                <span>Validando credenciais...</span>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Entrar com E-mail</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-md mx-auto w-full pt-4 pb-2 text-center text-[11px] text-slate-400">
        <p>&copy; {new Date().getFullYear()} Ellos Vocal — Sistema de Gestão Restrita</p>
      </footer>
    </div>
  );
}
