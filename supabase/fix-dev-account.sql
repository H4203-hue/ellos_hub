-- ====================================================================
-- FIX: destrava e reconstrói a conta DEV (henriqueslima09@gmail.com)
-- Execute no SQL Editor do Supabase, seção por seção, na ordem abaixo.
-- ====================================================================

-- ── ETAPA 1: limpar vestígios em auth.* para destravar o GoTrue ──────
-- Se alguma linha der erro "relation ... does not exist", pule só ela
-- e continue com as próximas (algumas tabelas variam por versão do Auth).

-- Nota: comparamos sempre como ::text porque, dependendo da versão do Auth,
-- algumas colunas user_id são uuid e outras são varchar (ver erro 42883).

delete from auth.mfa_amr_claims
where session_id::text in (
  select id::text from auth.sessions
  where user_id::text in (select id::text from auth.users where email = 'henriqueslima09@gmail.com')
);

delete from auth.mfa_challenges
where factor_id::text in (
  select id::text from auth.mfa_factors
  where user_id::text in (select id::text from auth.users where email = 'henriqueslima09@gmail.com')
);

delete from auth.mfa_factors
where user_id::text in (select id::text from auth.users where email = 'henriqueslima09@gmail.com');

delete from auth.one_time_tokens
where user_id::text in (select id::text from auth.users where email = 'henriqueslima09@gmail.com');

delete from auth.refresh_tokens
where user_id::text in (select id::text from auth.users where email = 'henriqueslima09@gmail.com');

delete from auth.sessions
where user_id::text in (select id::text from auth.users where email = 'henriqueslima09@gmail.com');

delete from auth.identities
where user_id::text in (select id::text from auth.users where email = 'henriqueslima09@gmail.com');

-- Remove qualquer perfil antigo/órfão ligado a esse e-mail (ids sintéticos "prof-...")
delete from public.profiles where email = 'henriqueslima09@gmail.com';

-- Só agora remove o usuário em auth.users
delete from auth.users where email = 'henriqueslima09@gmail.com';

-- ── ETAPA 2: recrie a conta pelo Dashboard oficial ────────────────────
-- Authentication → Users → Add user → henriqueslima09@gmail.com
-- defina a senha e marque "Auto Confirm User". Depois rode a etapa 3.

-- ── ETAPA 3: religar/gerar o perfil DEV com o UUID real do Auth ──────
-- Usa ON CONFLICT (email), não (id): o id novo do Auth é sempre
-- diferente do id antigo, então é o e-mail que precisa ser a chave.
insert into public.profiles (id, name, email, role, voice)
select id, 'Henrique Soares', email, 'DEV', 'Tenor'
from auth.users
where email = 'henriqueslima09@gmail.com'
on conflict (email) do update set
  id = excluded.id,
  role = 'DEV',
  name = excluded.name,
  voice = excluded.voice;

-- Confirme o resultado:
select id, email, name, role from public.profiles where email = 'henriqueslima09@gmail.com';

-- ── DIAGNÓSTICO: por que o login não acha o perfil ────────────────────
-- profiles.id nesta instância é uuid (não text, como o schema.sql do repo
-- descreve — o banco divergiu do arquivo depois de ajustes manuais).

-- 1. Quantos usuários existem em auth.users com esse e-mail?
select id, email, created_at from auth.users where email = 'henriqueslima09@gmail.com';

-- 2. Quantos perfis existem com esse e-mail?
select id, email, role from public.profiles where email = 'henriqueslima09@gmail.com';

-- 3. Os ids batem?
select
  u.id as auth_id,
  p.id as profile_id,
  p.role
from auth.users u
left join public.profiles p on p.id = u.id
where u.email = 'henriqueslima09@gmail.com';
