'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound } from 'lucide-react';
import { toast } from 'sonner';

import { validatePassword } from '@/lib/security/input-validation';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const verifyRecoverySession = async () => {
      if (!supabase || !isSupabaseConfigured) {
        toast.error('Serviço de autenticação indisponível.');
        return;
      }

      const { data } = await supabase.auth.getSession();
      setIsReady(Boolean(data.session));
    };

    void verifyRecoverySession();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const passwordError = validatePassword(password);

    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    if (password !== confirmation) {
      toast.error('As senhas não coincidem.');
      return;
    }

    if (!supabase) return;
    setIsSaving(true);

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error('Não foi possível atualizar a senha. Solicite um novo link.');
      setIsSaving(false);
      return;
    }

    await supabase.auth.signOut();
    localStorage.removeItem('ellos_current_member');
    sessionStorage.removeItem('ellos_current_member');
    toast.success('Senha atualizada. Faça login novamente.');
    router.replace('/login');
  };

  return (
    <main className="min-h-screen bg-[#0F223D] text-slate-100 flex items-center justify-center p-4">
      <section className="w-full max-w-md rounded-3xl border border-amber-500/20 bg-navy-900/90 p-6 sm:p-8 shadow-2xl">
        <div className="mb-6 space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-gold-500/20 bg-gold-500/10 text-gold-400">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-black text-white">Definir nova senha</h1>
          <p className="text-xs leading-relaxed text-slate-300">
            Use pelo menos 12 caracteres, incluindo maiúscula, minúscula, número e símbolo.
          </p>
        </div>

        {!isReady ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-center text-xs text-rose-200">
            O link é inválido ou expirou. Solicite uma nova recuperação de senha.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block space-y-1 text-xs font-semibold text-slate-200">
              <span>Nova senha</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={12}
                maxLength={128}
                autoComplete="new-password"
                required
                className="w-full rounded-xl border border-gray-700 bg-[#111827] px-3.5 py-2.5 text-slate-100 outline-none focus:ring-2 focus:ring-gold-500/50"
              />
            </label>

            <label className="block space-y-1 text-xs font-semibold text-slate-200">
              <span>Confirmar nova senha</span>
              <input
                type="password"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                minLength={12}
                maxLength={128}
                autoComplete="new-password"
                required
                className="w-full rounded-xl border border-gray-700 bg-[#111827] px-3.5 py-2.5 text-slate-100 outline-none focus:ring-2 focus:ring-gold-500/50"
              />
            </label>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B89028] px-4 py-2.5 text-xs font-extrabold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? 'Atualizando...' : 'Atualizar senha'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
