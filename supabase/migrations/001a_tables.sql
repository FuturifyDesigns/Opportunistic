-- CHUNK 1: tables + indexes
-- Run this first in Supabase SQL Editor

create extension if not exists "pgcrypto";

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
