-- ====================================================================
-- MIGRATION SCHEMA SQL — ELLOS HUB (SUPABASE v2.5)
-- ====================================================================
-- Execute este script no SQL Editor do seu Dashboard no Supabase
-- ====================================================================

-- 1. TABELA DE PERFIS DE INTEGRANTES E PERMISSÕES (RBAC)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  voice TEXT NOT NULL CHECK (voice IN ('Soprano', 'Contralto', 'Tenor', 'Baixo', 'Geral')),
  role TEXT NOT NULL CHECK (role IN ('MEMBER', 'MEDIA', 'ADM', 'DEV')) DEFAULT 'MEMBER',
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE EVENTOS
CREATE TABLE IF NOT EXISTS public.events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('CONFIRMED', 'PROPOSAL', 'INTERNAL')),
  date TEXT,
  time TEXT,
  period TEXT,
  location TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  dress_code TEXT,
  mic_count INTEGER DEFAULT 4,
  notes TEXT,
  schedule JSONB,
  drivers JSONB,
  passengers JSONB,
  votes_yes INTEGER DEFAULT 1,
  votes_total INTEGER DEFAULT 7,
  voting_deadline TEXT,
  is_voting_closed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELA DE RESPOSTAS / CONFIRMAÇÕES DE INTEGRANTES
CREATE TABLE IF NOT EXISTS public.event_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT REFERENCES public.events(id) ON DELETE CASCADE,
  member_id TEXT,
  member_name TEXT NOT NULL,
  voice TEXT CHECK (voice IN ('Soprano', 'Contralto', 'Tenor', 'Baixo', 'Geral')),
  status TEXT CHECK (status IN ('YES', 'NO', 'MAYBE')),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABELA DE MÚSICAS DO REPERTÓRIO
CREATE TABLE IF NOT EXISTS public.songs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  artist_or_group TEXT,
  key_signature TEXT,
  bpm INTEGER,
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('READY', 'REHEARSING', 'TO_LEARN')),
  requires_full_group BOOLEAN DEFAULT false,
  general_drive_url TEXT,
  sheet_music_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABELA DE KITS DE VOZ POR NAIPE (KITS DE ENSAIO)
CREATE TABLE IF NOT EXISTS public.song_voice_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id TEXT REFERENCES public.songs(id) ON DELETE CASCADE,
  label TEXT NOT NULL CHECK (label IN ('Soprano', 'Contralto', 'Tenor', 'Baixo', 'Geral')),
  drive_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABELA DE TAREFAS ADMINISTRATIVAS
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('DIVULGACAO', 'LOGISTICA', 'CONFRAS', 'CONTATOS')),
  due_date TEXT,
  is_done BOOLEAN DEFAULT false,
  assigned_to TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABELA DE TOKENS DE CONVITE DESCARTÁVEIS
CREATE TABLE IF NOT EXISTS public.invite_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  created_by TEXT,
  role TEXT NOT NULL DEFAULT 'MEMBER',
  is_used BOOLEAN DEFAULT false,
  used_by_email TEXT,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '48 hours'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DESABILITAR RLS EM DEV
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.song_voice_kits DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_tokens DISABLE ROW LEVEL SECURITY;

-- HABILITAR SUPABASE REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.songs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.song_voice_kits;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.invite_tokens;

-- ====================================================================
-- SEED DATA — PERFIS E DADOS INICIAIS (9 INTEGRANTES OFICIAIS)
-- ====================================================================

INSERT INTO public.profiles (id, email, name, voice, role)
VALUES
('prof-henrique', 'henrique@ellos.com', 'Henrique', 'Tenor', 'DEV'),
('prof-rayane', 'rayane@ellos.com', 'Rayane', 'Soprano', 'ADM'),
('prof-eloise', 'eloise@ellos.com', 'Eloise', 'Contralto', 'ADM'),
('prof-duda', 'duda@ellos.com', 'Maria Eduarda (Duda)', 'Contralto', 'MEDIA'),
('prof-giovanna', 'giovanna@ellos.com', 'Giovanna', 'Soprano', 'MEMBER'),
('prof-pedro-l', 'pedrol@ellos.com', 'Pedro L.', 'Tenor', 'MEMBER'),
('prof-pedro-y', 'pedroy@ellos.com', 'Pedro Y.', 'Baixo', 'MEMBER'),
('prof-laura', 'laura@ellos.com', 'Laura', 'Soprano', 'MEMBER'),
('prof-samily', 'samily@ellos.com', 'Samily', 'Contralto', 'MEMBER')
ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, name = EXCLUDED.name, voice = EXCLUDED.voice;

INSERT INTO public.events (id, title, category, status, date, time, location, contact_name, contact_phone, notes, dress_code, mic_count, schedule, drivers, passengers, votes_yes, votes_total)
VALUES
('evt-1', 'IASD Itapecerica', 'Culto de Mandado', 'CONFIRMED', '2026-10-24', '10:00', 'Igreja Adventista do Sétimo Dia - Itapecerica da Serra, SP', 'Secretaria IASD Itapecerica', '11988887777', 'Chegada da equipe às 08:30 para passagem de som e alinhamento dos microfones.', '👔 Social Dourado/Azul (Gravata Dourada & Terno Azul)', 4, '[{"time": "08:30", "activity": "Passagem de Som e Teste de Mics"}, {"time": "09:15", "activity": "Oração & Concentração da Equipe"}, {"time": "10:00", "activity": "Apresentação Principal no Culto"}]'::jsonb, '[{"name": "Henrique", "spots": 4}, {"name": "Pedro L.", "spots": 3}]'::jsonb, '["Giovanna", "Duda", "Pedro Y.", "Laura"]'::jsonb, 9, 9),
('evt-2', 'IASD UNASP-SP', 'Escola Sabatina', 'CONFIRMED', '2026-10-31', '09:30', 'Campus UNASP-SP - Igreja Central', 'Pr. Responsável', '11977776666', 'Apresentação no programa especial de jovens.', '👔 Esporte Fino (Camisa Branca & Calça Escura)', 4, '[{"time": "08:40", "activity": "Passagem de Som"}, {"time": "09:15", "activity": "Momento de Oração"}, {"time": "09:30", "activity": "Abertura do Programa Jovem"}]'::jsonb, '[{"name": "Henrique", "spots": 4}]'::jsonb, '["Eloise", "Samily"]'::jsonb, 9, 9),
('evt-3', 'Casamento Mãe da Gi', 'Cerimônia de Casamento', 'PROPOSAL', '2027-01-23', '17:00', 'Chácara das Flores - Cotia, SP', 'Giovanna / Família', NULL, 'Requer repertório especial para entrada e bênção.', '👗 Social Completo / Traje de Gala', 4, '[{"time": "16:00", "activity": "Passagem de som no local"}, {"time": "16:45", "activity": "Oração em grupo"}, {"time": "17:00", "activity": "Entrada dos noivos & Cerimônia"}]'::jsonb, '[{"name": "Henrique", "spots": 3}]'::jsonb, '["Giovanna"]'::jsonb, 6, 9)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.songs (id, title, artist_or_group, key_signature, bpm, tags, status, general_drive_url, sheet_music_url)
VALUES
('song-1', 'Música Especial CTJ', 'Ellos Vocal', 'F', 105, ARRAY['Ellos', 'Musical CTJ'], 'REHEARSING', 'https://drive.google.com/drive/folders/ellos-ctj-geral', 'https://drive.google.com/file/d/ellos-ctj-partitura/view'),
('song-2', 'Música do Ellos', 'Ellos', 'D', 72, ARRAY['Ellos', 'Autoral'], 'READY', 'https://drive.google.com/drive/folders/ellos-autoral-geral', 'https://drive.google.com/file/d/ellos-autoral-partitura/view'),
('song-3', 'Mais Vocal - Dar um Help', 'Mais Vocal', 'G', 90, ARRAY['Mais Vocal', 'Help'], 'TO_LEARN', 'https://drive.google.com/drive/folders/mais-vocal-help', 'https://drive.google.com/file/d/mais-vocal-help-cifra/view')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.song_voice_kits (song_id, label, drive_url)
VALUES
('song-1', 'Soprano', 'https://drive.google.com/drive/folders/ctj-soprano'),
('song-1', 'Contralto', 'https://drive.google.com/drive/folders/ctj-contralto'),
('song-1', 'Tenor', 'https://drive.google.com/drive/folders/ctj-tenor'),
('song-1', 'Baixo', 'https://drive.google.com/drive/folders/ctj-baixo'),
('song-2', 'Soprano', 'https://drive.google.com/drive/folders/autoral-soprano'),
('song-2', 'Contralto', 'https://drive.google.com/drive/folders/autoral-contralto'),
('song-2', 'Tenor', 'https://drive.google.com/drive/folders/autoral-tenor'),
('song-2', 'Baixo', 'https://drive.google.com/drive/folders/autoral-baixo')
ON CONFLICT DO NOTHING;

INSERT INTO public.tasks (id, description, category, due_date, is_done, assigned_to)
VALUES
('task-1', 'Divulgação das datas disponíveis no 2º semestre', 'DIVULGACAO', '2026-08-30', false, 'Mídia / Comunicação'),
('task-2', 'Alinhar volta dos ensaios', 'LOGISTICA', '2026-08-15', true, 'Regência'),
('task-3', 'Planejar Confra de 3 Anos', 'CONFRAS', '2026-09-20', false, 'Social'),
('task-4', 'Planejar Confras de início/fim de semestre', 'CONFRAS', '2026-12-10', false, 'Social'),
('task-5', 'Contatar mulher da igreja: 11996554353', 'CONTATOS', '2026-08-12', false, 'Secretaria')
ON CONFLICT (id) DO NOTHING;
