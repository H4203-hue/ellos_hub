'use client';

import React from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { TenantLogo } from '@/components/common/TenantLogo';
import { useTenant } from '@/context/TenantContext';
import { Calendar, Sparkles, LogIn } from 'lucide-react';

export default function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { tenant } = useTenant();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Header Minimalista para Convidados (Sem Sidebar Administrativa) */}
      <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-200 dark:border-gray-800 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/guest/dashboard" className="flex items-center gap-3 group">
            <TenantLogo compact showTagline={false} />
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1 rounded-xl bg-slate-100 dark:bg-gray-800/80 border border-slate-200 dark:border-gray-700/60">
              <ThemeToggle />
            </div>

            <Link
              href="/convite"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-theme-primary text-slate-950 hover:brightness-110 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Solicitar Convite</span>
              <span className="sm:hidden">Convite</span>
            </Link>

            <Link
              href="/login"
              title="Acesso de Integrantes"
              className="p-2 rounded-xl text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
            >
              <LogIn className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal do Convidado */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>

      {/* Rodapé Limpo */}
      <footer className="w-full border-t border-slate-200 dark:border-gray-800/80 py-6 text-center text-xs text-slate-500 dark:text-gray-400">
        <div className="max-w-5xl mx-auto px-4 space-y-1">
          <p className="font-semibold text-slate-700 dark:text-slate-300">
            {tenant.name} {tenant.tagline ? `— ${tenant.tagline}` : ''}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-gray-500">
            © {new Date().getFullYear()} Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
