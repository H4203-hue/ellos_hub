-- ====================================================================
-- SEGURANÇA — Convites vinculados a workspace e acesso exclusivo do servidor
-- Execute depois de saas-multitenant-migration.sql.
-- ====================================================================

BEGIN;

ALTER TABLE public.invite_tokens
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Invalida convites antigos: eles não tinham workspace e armazenavam o token
-- utilizável em texto puro. Novos registros guardam somente SHA-256(token).
DELETE FROM public.invite_tokens;

ALTER TABLE public.invite_tokens
  ALTER COLUMN workspace_id SET NOT NULL;

ALTER TABLE public.invite_tokens
  DROP CONSTRAINT IF EXISTS invite_tokens_role_check;

ALTER TABLE public.invite_tokens
  ADD CONSTRAINT invite_tokens_role_check CHECK (role IN ('ADMIN', 'MEMBER'));

CREATE INDEX IF NOT EXISTS idx_invite_tokens_workspace
  ON public.invite_tokens(workspace_id);

CREATE INDEX IF NOT EXISTS idx_invite_tokens_active_lookup
  ON public.invite_tokens(workspace_id, token, is_used, expires_at);

-- Nenhum cliente acessa tokens diretamente. Todas as operações passam por
-- Route Handlers que autenticam o administrador ou validam o token e usam a
-- service-role exclusivamente no servidor.
ALTER TABLE public.invite_tokens ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.invite_tokens FROM anon, authenticated;

-- Corrige IDOR nas confirmações de presença. Antes, qualquer membro podia
-- inserir uma resposta usando o member_id de outra pessoa.
DROP POLICY IF EXISTS "event_responses_insert_workspace_member" ON public.event_responses;
DROP POLICY IF EXISTS "event_responses_update_admin_owner" ON public.event_responses;
DROP POLICY IF EXISTS "event_responses_delete_admin_owner" ON public.event_responses;
DROP POLICY IF EXISTS "event_responses_update_own_or_admin" ON public.event_responses;
DROP POLICY IF EXISTS "event_responses_delete_own_or_admin" ON public.event_responses;

CREATE POLICY "event_responses_insert_workspace_member"
ON public.event_responses FOR INSERT TO authenticated
WITH CHECK (
  public.get_user_workspace_role(workspace_id) IS NOT NULL
  AND member_id = auth.uid()::text
);

CREATE POLICY "event_responses_update_own_or_admin"
ON public.event_responses FOR UPDATE TO authenticated
USING (
  member_id = auth.uid()::text
  OR public.get_user_workspace_role(workspace_id) IN ('OWNER', 'ADMIN')
)
WITH CHECK (
  member_id = auth.uid()::text
  OR public.get_user_workspace_role(workspace_id) IN ('OWNER', 'ADMIN')
);

CREATE POLICY "event_responses_delete_own_or_admin"
ON public.event_responses FOR DELETE TO authenticated
USING (
  member_id = auth.uid()::text
  OR public.get_user_workspace_role(workspace_id) IN ('OWNER', 'ADMIN')
);

-- Perfis contêm telefone e e-mail. Membros comuns não recebem mais linhas de
-- outros integrantes diretamente pela API do Supabase; somente o próprio
-- usuário ou administradores de um workspace compartilhado podem lê-las.
DROP POLICY IF EXISTS "profiles_select_self_or_workspace_peer" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_self_or_workspace_admin" ON public.profiles;

CREATE POLICY "profiles_select_self_or_workspace_admin"
ON public.profiles FOR SELECT TO authenticated
USING (
  id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.workspace_members wm_self
    JOIN public.workspace_members wm_target
      ON wm_target.workspace_id = wm_self.workspace_id
    WHERE wm_self.user_id = auth.uid()
      AND wm_self.role IN ('OWNER', 'ADMIN')
      AND wm_self.is_active = true
      AND wm_target.user_id = public.profiles.id
  )
);

COMMIT;
