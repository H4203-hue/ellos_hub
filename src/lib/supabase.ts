import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Verifica se as credenciais do Supabase foram preenchidas corretamente
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'sua_url_aqui' &&
  supabaseUrl !== 'https://your-supabase-project.supabase.co'
);

// createBrowserClient (não createClient puro) é essencial aqui: ele guarda
// a sessão em cookies, não só em localStorage. src/proxy.ts e
// src/lib/supabase/server.ts leem a sessão via cookie no servidor — com o
// createClient antigo, o login "funcionava" no browser (localStorage) mas
// o proxy nunca via a sessão e mandava todo mundo de volta pro /login,
// mesmo já autenticado.
export const supabase = isSupabaseConfigured
  ? createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
