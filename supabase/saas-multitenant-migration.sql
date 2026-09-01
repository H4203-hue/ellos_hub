-- ====================================================================
-- MIGRATION: SAAS MULTITENANT & WORKSPACES ARCHITECTURE (SUPABASE)
-- ====================================================================
-- Este script transforma o banco de dados em uma arquitetura White-label
-- com isolamento rigoroso por Workspaces e controle RBAC desacoplado.
-- ====================================================================

-- 1. CRIAÇÃO DA TABELA DE WORKSPACES (Tenants / Grupos / Bandas)
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  primary_color TEXT DEFAULT '#D4AF37',
  logo_url TEXT,
  custom_labels JSONB DEFAULT '{"member": "Membro", "category": "Naipe"}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de performance para busca rápida por subdomínio/slug
CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON public.workspaces(slug);

-- 2. CRIAÇÃO DA TABELA WORKSPACE_MEMBERS (Vínculo Usuário <-> Workspace)
-- Aqui residem o Papel (Role) e o Naipe/Categoria contextualizados por Workspace
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER')) DEFAULT 'MEMBER',
  voice TEXT DEFAULT 'Geral', -- Naipe vocal ou categoria do integrante no workspace
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT workspace_user_unique UNIQUE (workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON public.workspace_members(workspace_id);

-- 3. SEED DO WORKSPACE PADRÃO (Para retrocompatibilidade do Grupo Ellos)
INSERT INTO public.workspaces (id, slug, name, primary_color, logo_url, custom_labels)
VALUES (
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'ellos',
  'Grupo Vocal Ellos',
  '#D4AF37',
  '/logo-ellos.svg',
  '{"member": "Integrante", "category": "Naipe Vocal"}'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  primary_color = EXCLUDED.primary_color;

-- 4. ALTERAÇÃO NA TABELA DE EVENTOS (Isolamento por Workspace & Visibilidade Externa)
-- 4.1 Adiciona workspace_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'workspace_id'
  ) THEN
    ALTER TABLE public.events ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 4.2 Vincula os eventos existentes ao Workspace padrão antes de aplicar NOT NULL
UPDATE public.events 
SET workspace_id = 'a0000000-0000-0000-0000-000000000001'::uuid 
WHERE workspace_id IS NULL;

-- 4.3 Torna a chave estrangeira workspace_id obrigatória
ALTER TABLE public.events ALTER COLUMN workspace_id SET NOT NULL;

-- 4.4 Adiciona coluna booleana is_public para páginas públicas de convite / agenda
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE public.events ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_events_workspace ON public.events(workspace_id);

-- 5. REESTRUTURAÇÃO DO PERFIL GLOBAL (PROFILES) & MIGRAÇÃO
-- A tabela profiles mantém dados de identificação global do usuário (Auth)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
  END IF;
END $$;

-- 5.1 Migra dados existentes de public.profiles para public.workspace_members
-- Mapeando: DEV -> OWNER, ADM -> ADMIN, MEMBER/MEDIA -> MEMBER
INSERT INTO public.workspace_members (workspace_id, user_id, role, voice, is_active)
SELECT 
  'a0000000-0000-0000-0000-000000000001'::uuid AS workspace_id,
  u.id AS user_id,
  CASE 
    WHEN p.role = 'DEV' THEN 'OWNER'
    WHEN p.role = 'ADM' THEN 'ADMIN'
    ELSE 'MEMBER'
  END AS role,
  p.voice,
  COALESCE(p.is_active, true) AS is_active
FROM public.profiles p
JOIN auth.users u ON lower(u.email) = lower(p.email)
ON CONFLICT (workspace_id, user_id) 
DO UPDATE SET 
  role = EXCLUDED.role,
  voice = EXCLUDED.voice,
  is_active = EXCLUDED.is_active;

-- 6. HABILITAR SUPABASE REALTIME PARA AS NOVAS TABELAS
DO $$
BEGIN
  -- Workspaces
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'workspaces'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.workspaces;
  END IF;

  -- Workspace Members
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'workspace_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.workspace_members;
  END IF;
END $$;

-- 7. FUNÇÃO AUXILIAR DE SEGURANÇA (RLS HELPER)
-- Permite verificar de forma rápida o papel do usuário logado no workspace
CREATE OR REPLACE FUNCTION public.get_user_workspace_role(w_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM public.workspace_members 
  WHERE workspace_id = w_id AND user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;
