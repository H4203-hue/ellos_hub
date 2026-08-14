-- ====================================================================
-- FIX: exclusão "zumbi" (item some da tela mas volta após F5)
-- Causa: RLS ligado nessas tabelas sem policy de DELETE. O Postgrest não
-- retorna erro nesse caso, só devolve 0 linhas afetadas — por isso o
-- frontend achava que tinha dado certo. O schema.sql do repo desliga RLS
-- nessas tabelas, mas o banco em produção divergiu do arquivo.
-- ====================================================================

-- 1. Diagnóstico: quais tabelas estão com RLS ligado?
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('events', 'songs', 'tasks', 'song_voice_kits', 'event_responses', 'invite_tokens', 'profiles');

-- Se "rowsecurity" vier "true" para events/songs/tasks, é essa a causa.
-- 2. Fix: religa o comportamento original do schema.sql (RLS desligado,
-- app confia no controle de acesso feito no próprio Next.js/RBAC).
alter table public.events disable row level security;
alter table public.songs disable row level security;
alter table public.tasks disable row level security;
alter table public.song_voice_kits disable row level security;
alter table public.event_responses disable row level security;
alter table public.invite_tokens disable row level security;
alter table public.profiles disable row level security;

-- 3. Confirme que ficou desligado em todas:
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('events', 'songs', 'tasks', 'song_voice_kits', 'event_responses', 'invite_tokens', 'profiles');
