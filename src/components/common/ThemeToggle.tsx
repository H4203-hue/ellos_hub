'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-xl border border-slate-200 dark:border-gold-500/20 bg-slate-100 dark:bg-navy-950/60 flex items-center justify-center text-slate-400 shrink-0" />
    );
  }

  const isDark = (theme === 'system' ? resolvedTheme : theme) === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label="Alternar tema"
      title={isDark ? 'Alternar para Tema Claro' : 'Alternar para Tema Escuro'}
      className="p-2 sm:px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-navy-950/60 dark:hover:bg-navy-800 text-navy-900 dark:text-gold-400 border border-slate-200/80 dark:border-gold-500/30 transition-all active:scale-95 shadow-sm flex items-center gap-1.5 shrink-0"
    >
      {isDark ? (
        <>
          <Sun className="w-4 h-4 text-gold-400 transition-transform duration-300 hover:rotate-45" />
          <span className="text-xs font-semibold hidden md:inline text-gold-300">Tema Claro</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-navy-900 transition-transform duration-300" />
          <span className="text-xs font-semibold hidden md:inline text-navy-900">Tema Escuro</span>
        </>
      )}
    </button>
  );
};
