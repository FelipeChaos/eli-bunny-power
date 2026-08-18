-- ELI BUNNY POWER
-- Ejecutar completo en Supabase > SQL Editor.
-- Después crea una cuenta en Authentication > Users o desde la aplicación.

create extension if not exists pgcrypto;

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  child_name text not null default 'Eli',
  week_start integer not null default 1,
  level1_min integer not null default 50,
  level1_max integer not null default 79,
  level2_min integer not null default 80,
  level2_max integer not null default 120,
  level3_min integer not null default 121,
  youtube_penalty integer not null default 50,
  updated_at timestamptz not null default now()
);

create table if not exists public.rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  points integer not null check (points > 0),
  type text not null check (type in ('earning','penalty')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  level integer not null check (level between 1 and 3),
  name text not null,
  description text not null default '',
  duration text not null default '',
  frequency text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.point_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  rule_id uuid references public.rules(id) on delete set null,
  event_date date not null default current_date,
  points integer not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

alter table public.settings enable row level security;
alter table public.rules enable row level security;
alter table public.rewards enable row level security;
alter table public.point_events enable row level security;

drop policy if exists "settings own rows" on public.settings;
create policy "settings own rows" on public.settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "rules own rows" on public.rules;
create policy "rules own rows" on public.rules for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "rewards own rows" on public.rewards;
create policy "rewards own rows" on public.rewards for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "events own rows" on public.point_events;
create policy "events own rows" on public.point_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists point_events_user_date_idx on public.point_events(user_id, event_date);
create index if not exists rules_user_type_idx on public.rules(user_id, type);
create index if not exists rewards_user_level_idx on public.rewards(user_id, level);

-- Nota:
-- Las tablas están protegidas por RLS. El error "new row violates row-level security policy"
-- aparece normalmente cuando una inserción no lleva user_id válido o no existe una sesión
-- autenticada. Esta aplicación inserta user_id = auth.uid() y trabaja con la sesión del adulto.
