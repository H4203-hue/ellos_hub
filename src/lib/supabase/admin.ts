import 'server-only';

import { createClient } from '@supabase/supabase-js';

/**
 * Cliente privilegiado exclusivo do servidor.
 *
 * Manter a service-role em um módulo `server-only` reduz o risco de ela ser
 * importada acidentalmente por um Client Component. As rotas que usam este
 * cliente ainda precisam autenticar e autorizar o chamador antes de qualquer
 * operação.
 */
export function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Configuração do Supabase indisponível no servidor.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
