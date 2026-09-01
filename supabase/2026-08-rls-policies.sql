-- ====================================================================
-- PILAR 0 — PASSO 2: RLS real, com GRANT explícito em cada tabela.
--
-- ⚠️ NÃO rode este arquivo inteiro de uma vez em produção. Rode por
-- blocos, na ordem em que aparecem aqui (workspaces/workspace_members →
-- profiles → events → songs/song_voice_kits/tasks/event_responses),
-- testando CRUD completo — create/read/update/DELETE — depois de cada
-- bloco. Isto já causou um incidente de produção uma vez neste projeto
-- (ver supabase/fix-rls-delete.sql): RLS foi ligada sem policy de DELETE,
-- o Postgrest não erra nesse caso, só devolve 0 linhas afetadas, e a UI
-- mostrava "sucesso" com o item voltando depois do F5.
--
-- Se qualquer bloco se comportar assim de novo, rode
-- supabase/fix-rls-delete.sql imediatamente (rollback já pronto no repo)
-- e investigue antes de tentar de novo.
--
-- ⚠️ ANTES DE RODAR: confirme o tipo real de profiles.id em produção.
--   SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'id';
-- supabase/fix-dev-account.sql indica que já é `uuid` (não `text` como o
-- schema.sql do repo, desatualizado, ainda declara) — as policies de
-- profiles abaixo assumem uuid. Se o SELECT acima devolver `text`, troque
-- `auth.uid()` por `auth.uid()::text` nas duas policies de profiles.
-- ====================================================================


-- =========================================================
-- WORKSPACES — leitura pública (branding em páginas sem sessão:
-- /login, /[slug]/convite, /[slug]/entrar-no-grupo); escrita restrita a
-- OWNER/ADMIN. Sem policy de INSERT: criação só via RPC
-- create_workspace_with_owner (Pilar 1, SECURITY DEFINER).
-- =========================================================
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.workspaces TO anon, authenticated;
GRANT UPDATE ON public.workspaces TO authenticated;

CREATE POLICY "workspaces_select_public"
ON public.workspaces FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "workspaces_update_admin_owner"
ON public.workspaces FOR UPDATE
TO authenticated
USING (public.get_user_workspace_role(id) IN ('OWNER', 'ADMIN'))
WITH CHECK (public.get_user_workspace_role(id) IN ('OWNER', 'ADMIN'));


-- =========================================================
-- WORKSPACE_MEMBERS
-- =========================================================
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_members TO authenticated;

CREATE POLICY "workspace_members_select_self_or_peer_admin"
ON public.workspace_members FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.get_user_workspace_role(workspace_id) IN ('OWNER', 'ADMIN')
);

CREATE POLICY "workspace_members_insert_admin_owner"
ON public.workspace_members FOR INSERT
TO authenticated
WITH CHECK (public.get_user_workspace_role(workspace_id) IN ('OWNER', 'ADMIN'));

CREATE POLICY "workspace_members_update_admin_owner"
ON public.workspace_members FOR UPDATE
TO authenticated
USING (public.get_user_workspace_role(workspace_id) IN ('OWNER', 'ADMIN'))
WITH CHECK (public.get_user_workspace_role(workspace_id) IN ('OWNER', 'ADMIN'));

CREATE POLICY "workspace_members_delete_admin_owner"
ON public.workspace_members FOR DELETE
TO authenticated
USING (public.get_user_workspace_role(workspace_id) IN ('OWNER', 'ADMIN'));


-- =========================================================
-- PROFILES — assume id uuid (ver aviso no topo do arquivo)
-- =========================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

GRANT SELECT, UPDATE ON public.profiles TO authenticated;

CREATE POLICY "profiles_select_self_or_workspace_peer"
ON public.profiles FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.workspace_members wm_self
    JOIN public.workspace_members wm_target
      ON wm_target.workspace_id = wm_self.workspace_id
    WHERE wm_self.user_id = auth.uid()
      AND wm_target.user_id = public.profiles.id
  )
);

CREATE POLICY "profiles_update_self"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Sem policy de INSERT/DELETE para authenticated: criação/remoção de
-- perfil continua exclusiva do service role via /api/admin/users
-- (agora blindada por requireWorkspaceRole).


-- =========================================================
-- EVENTS (já tem workspace_id desde saas-multitenant-migration.sql)
-- =========================================================
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT SELECT ON public.events TO anon;

CREATE POLICY "events_select_workspace_member"
ON public.events FOR SELECT
TO authenticated
USING (public.get_user_workspace_role(workspace_id) IS NOT NULL);

CREATE POLICY "events_select_public_invite"
ON public.events FOR SELECT
TO anon
USING (is_public = true);

CREATE POLICY "events_insert_admin_owner"
ON public.events FOR INSERT
TO authenticated
WITH CHECK (public.get_user_workspace_role(workspace_id) IN ('OWNER', 'ADMIN'));

CREATE POLICY "events_update_admin_owner"
ON public.events FOR UPDATE
TO authenticated
USING (public.get_user_workspace_role(workspace_id) IN ('OWNER', 'ADMIN'))
WITH CHECK (public.get_user_workspace_role(workspace_id) IN ('OWNER', 'ADMIN'));

CREATE POLICY "events_delete_admin_owner"
ON public.events FOR DELETE
TO authenticated
USING (public.get_user_workspace_role(workspace_id) IN ('OWNER', 'ADMIN'));


-- =========================================================
-- SONGS
-- =========================================================
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.songs TO authenticated;

CREATE POLICY "songs_select_workspace_member"
ON public.songs FOR SELECT TO authenticated
USING (public.get_user_workspace_role(workspace_id) IS NOT NULL);

CREATE POLICY "songs_insert_admin_owner"
ON public.songs FOR INSERT TO authenticated
WITH CHECK (public.get_user_workspace_role(workspace_id) IN ('OWNER', 'ADMIN'));

CREATE POLICY "songs_update_admin_owner"
ON public.songs FOR UPDATE TO authenticated
USING (public.get_user_workspace_role(workspace_id) IN ('OWNER', 'ADMIN'))
WITH CHECK (public.get_user_workspace_role(workspace_id) IN ('OWNER', 'ADMIN'));

CREATE POLICY "songs_delete_admin_owner"
ON public.songs FOR DELETE TO authenticated
USING (public.get_user_workspace_role(workspace_id) IN ('OWNER', 'ADMIN'));


-- =========================================================
-- SONG_VOICE_KITS (mesmas regras de songs)
-- =========================================================
ALTER TABLE public.song_voice_kits ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.song_voice_kits TO authenticated;

CREATE POLICY "song_voice_kits_select_workspace_member"
ON public.song_voice_kits FOR SELECT TO authenticated
USING (public.get_user_workspace_role(workspace_id) IS NOT NULL);

CREATE POLICY "song_voice_kits_insert_admin_owner"
ON public.song_voice_kits FOR INSERT TO authenticated
WITH CHECK (public.get_user_workspace_role(workspace_id) IN ('OWNER', 'ADMIN'));

CREATE POLICY "song_voice_kits_update_admin_owner"
ON public.song_voice_kits FOR UPDATE TO authenticated
USING (public.get_user_workspace_role(workspace_id) IN ('OWNER', 'ADMIN'))
WITH CHECK (public.get_user_workspace_role(workspace_id) IN ('OWNER', 'ADMIN'));

CREATE POLICY "song_voice_kits_delete_admin_owner"
ON public.song_voice_kits FOR DELETE TO authenticated
USING (public.get_user_workspace_role(workspace_id) IN ('OWNER', 'ADMIN'));


-- =========================================================
-- TASKS — UPDATE liberado pra qualquer membro do workspace (não só
-- admin): hoje qualquer integrante marca a própria tarefa como feita.
-- =========================================================
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;

CREATE POLICY "tasks_select_workspace_member"
ON public.tasks FOR SELECT TO authenticated
USING (public.get_user_workspace_role(workspace_id) IS NOT NULL);

CREATE POLICY "tasks_insert_admin_owner"
ON public.tasks FOR INSERT TO authenticated
WITH CHECK (public.get_user_workspace_role(workspace_id) IN ('OWNER', 'ADMIN'));

CREATE POLICY "tasks_update_workspace_member"
ON public.tasks FOR UPDATE TO authenticated
USING (public.get_user_workspace_role(workspace_id) IS NOT NULL)
WITH CHECK (public.get_user_workspace_role(workspace_id) IS NOT NULL);

CREATE POLICY "tasks_delete_admin_owner"
ON public.tasks FOR DELETE TO authenticated
USING (public.get_user_workspace_role(workspace_id) IN ('OWNER', 'ADMIN'));


-- =========================================================
-- EVENT_RESPONSES (RSVP) — member_id hoje é TEXT livre, sem FK pra
-- auth.users, então a policy de escrita não valida "é o próprio usuário
-- respondendo", só "é membro do workspace do evento". Ownership real de
-- RSVP fica pendente pra quando member_id virar FK de auth.users.id.
-- =========================================================
ALTER TABLE public.event_responses ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_responses TO authenticated;

CREATE POLICY "event_responses_select_workspace_member"
ON public.event_responses FOR SELECT TO authenticated
USING (public.get_user_workspace_role(workspace_id) IS NOT NULL);

CREATE POLICY "event_responses_insert_workspace_member"
ON public.event_responses FOR INSERT TO authenticated
WITH CHECK (public.get_user_workspace_role(workspace_id) IS NOT NULL);

CREATE POLICY "event_responses_update_admin_owner"
ON public.event_responses FOR UPDATE TO authenticated
USING (public.get_user_workspace_role(workspace_id) IN ('OWNER', 'ADMIN'))
WITH CHECK (public.get_user_workspace_role(workspace_id) IN ('OWNER', 'ADMIN'));

CREATE POLICY "event_responses_delete_admin_owner"
ON public.event_responses FOR DELETE TO authenticated
USING (public.get_user_workspace_role(workspace_id) IN ('OWNER', 'ADMIN'));

-- invite_tokens fica de fora deste arquivo de propósito: ainda não tem
-- workspace_id (ganha isso no Pilar 2, quando o convite for reconstruído
-- com signInWithOtp real). Por enquanto continua RLS-desligada, protegida
-- só pela blindagem de sessão/role em /api/admin/invites e
-- /api/invites/validate.
