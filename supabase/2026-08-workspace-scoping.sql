-- ====================================================================
-- PILAR 0 — PASSO 1: Isolamento por workspace em songs/tasks/
-- song_voice_kits/event_responses (hoje globais, sem filtro nenhum).
-- Rodar ANTES de supabase/2026-08-rls-policies.sql. Sem RLS ainda —
-- só schema, seguro de rodar com o app em produção sem quebrar nada.
-- ====================================================================

-- 1. songs
ALTER TABLE public.songs ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
UPDATE public.songs SET workspace_id = 'a0000000-0000-0000-0000-000000000001'::uuid WHERE workspace_id IS NULL;
ALTER TABLE public.songs ALTER COLUMN workspace_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_songs_workspace ON public.songs(workspace_id);

-- 2. tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
UPDATE public.tasks SET workspace_id = 'a0000000-0000-0000-0000-000000000001'::uuid WHERE workspace_id IS NULL;
ALTER TABLE public.tasks ALTER COLUMN workspace_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_workspace ON public.tasks(workspace_id);

-- 3. song_voice_kits (herda o workspace da música-mãe)
ALTER TABLE public.song_voice_kits ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
UPDATE public.song_voice_kits svk SET workspace_id = s.workspace_id
  FROM public.songs s WHERE svk.song_id = s.id AND svk.workspace_id IS NULL;
ALTER TABLE public.song_voice_kits ALTER COLUMN workspace_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_song_voice_kits_workspace ON public.song_voice_kits(workspace_id);

-- 4. event_responses (herda o workspace do evento)
ALTER TABLE public.event_responses ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
UPDATE public.event_responses er SET workspace_id = e.workspace_id
  FROM public.events e WHERE er.event_id = e.id AND er.workspace_id IS NULL;

-- Antes do NOT NULL: confirme que não sobrou nenhuma resposta órfã
-- (event_id apagado/nulo). Se o count abaixo for > 0, decida manualmente
-- (apagar as órfãs ou vinculá-las a um workspace) antes de continuar:
--   SELECT count(*) FROM public.event_responses WHERE workspace_id IS NULL;

ALTER TABLE public.event_responses ALTER COLUMN workspace_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_event_responses_workspace ON public.event_responses(workspace_id);

-- 5. workspace_members ganha o flag de "equipe de mídia" (MEDIA legado não
-- tem equivalente direto em OWNER/ADMIN/MEMBER — ver src/lib/rbac.ts)
ALTER TABLE public.workspace_members ADD COLUMN IF NOT EXISTS is_media_team BOOLEAN DEFAULT false;
