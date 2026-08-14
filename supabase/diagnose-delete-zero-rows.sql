-- ====================================================================
-- DIAGNÓSTICO: DELETE afeta 0 linhas mesmo sem erro e com RLS desligado
-- ====================================================================

-- 1. RLS está mesmo desligado (e não "forçado" pro dono da tabela)?
select relname, relrowsecurity, relforcerowsecurity
from pg_class
where relname in ('events', 'songs', 'tasks');

-- 2. Existe alguma trigger de DELETE nessas tabelas? (pode estar cancelando
-- a exclusão silenciosamente com "RETURN NULL" dentro da função)
select event_object_table, trigger_name, action_timing, event_manipulation, action_statement
from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table in ('events', 'songs', 'tasks');

-- 3. Os roles anon/authenticated (usados pelo app com a anon key) têm
-- permissão de DELETE de fato na tabela?
select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('events', 'songs', 'tasks')
order by table_name, grantee;

-- 4. Confirma que o registro realmente existe com esse id exato
-- (troque 'evt-1' se for testar outro):
select id, title from public.events where id = 'evt-1';
