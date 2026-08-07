-- Opportunistic initial schema
-- Run this in Supabase SQL Editor if CLI/MCP cannot reach the project.

create extension if not exists "pgcrypto";

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  headline text,
  bio text,
  country text,
  onboarding_complete boolean not null default false,
  digest_frequency text not null default 'weekly'
    check (digest_frequency in ('off', 'weekly', 'monthly')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.qualifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('degree', 'certificate')),
  field text not null,
  institution text,
  year int,
  created_at timestamptz not null default now()
);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  skill_name text not null,
  proficiency text not null default 'intermediate'
    check (proficiency in ('beginner', 'intermediate', 'advanced', 'expert')),
  created_at timestamptz not null default now()
);

create table if not exists public.scholarship_matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  url text not null,
  source text,
  reasoning text not null,
  match_score numeric(5,2) not null default 0,
  deadline date,
  found_at timestamptz not null default now(),
  dismissed boolean not null default false,
  saved boolean not null default false
);

create table if not exists public.job_matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  url text not null,
  company text,
  source text,
  reasoning text not null,
  match_score numeric(5,2) not null default 0,
  found_at timestamptz not null default now(),
  dismissed boolean not null default false,
  saved boolean not null default false
);

create table if not exists public.search_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('job', 'scholarship')),
  status text not null default 'queued'
    check (status in ('queued', 'running', 'done', 'failed')),
  run_at timestamptz not null default now(),
  notes text
);

create index if not exists qualifications_user_id_idx on public.qualifications (user_id);
create index if not exists skills_user_id_idx on public.skills (user_id);
create index if not exists scholarship_matches_user_id_idx on public.scholarship_matches (user_id);
create index if not exists job_matches_user_id_idx on public.job_matches (user_id);
create index if not exists search_runs_user_id_idx on public.search_runs (user_id);

alter table public.profiles enable row level security;
alter table public.qualifications enable row level security;
alter table public.skills enable row level security;
alter table public.scholarship_matches enable row level security;
alter table public.job_matches enable row level security;
alter table public.search_runs enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = user_id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = user_id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own" on public.profiles for delete using (auth.uid() = user_id);

drop policy if exists "qualifications_all_own" on public.qualifications;
create policy "qualifications_all_own" on public.qualifications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "skills_all_own" on public.skills;
create policy "skills_all_own" on public.skills for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "scholarship_matches_all_own" on public.scholarship_matches;
create policy "scholarship_matches_all_own" on public.scholarship_matches for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "job_matches_all_own" on public.job_matches;
create policy "job_matches_all_own" on public.job_matches for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "search_runs_all_own" on public.search_runs;
create policy "search_runs_all_own" on public.search_runs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
