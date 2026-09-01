-- ====================================================================
-- PILAR 1 — RPC atômica para criar um workspace + tornar o criador OWNER.
-- Necessária porque não há policy de INSERT direta em public.workspaces
-- para usuários comuns (ver supabase/2026-08-rls-policies.sql) e porque
-- as duas inserções (workspaces + workspace_members) precisam ser
-- atômicas — se a segunda falhasse depois de uma inserção solta em
-- workspaces, sobraria um workspace órfão sem dono.
-- Depende de supabase/2026-08-rls-policies.sql já ter rodado (RLS em
-- workspaces/workspace_members ligada).
-- ====================================================================

CREATE OR REPLACE FUNCTION public.create_workspace_with_owner(
  p_name TEXT,
  p_slug TEXT,
  p_primary_color TEXT DEFAULT '#D4AF37',
  p_logo_url TEXT DEFAULT NULL
)
RETURNS public.workspaces
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workspace public.workspaces;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  INSERT INTO public.workspaces (slug, name, primary_color, logo_url)
  VALUES (lower(trim(p_slug)), trim(p_name), COALESCE(p_primary_color, '#D4AF37'), p_logo_url)
  RETURNING * INTO v_workspace;

  INSERT INTO public.workspace_members (workspace_id, user_id, role, is_active)
  VALUES (v_workspace.id, auth.uid(), 'OWNER', true);

  RETURN v_workspace;
END;
$$;

REVOKE ALL ON FUNCTION public.create_workspace_with_owner(TEXT, TEXT, TEXT, TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.create_workspace_with_owner(TEXT, TEXT, TEXT, TEXT) TO authenticated;
