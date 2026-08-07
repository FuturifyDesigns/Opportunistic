-- CHUNK 2: RLS + triggers
-- Run this second, after CHUNK 1 succeeds

alter table public.profiles enable row level security;
alter table public.qualifications enable row level security;
alter table public.skills enable row level security;
alter table public.scholarship_matches enable row level security;
alter table public.job_matches enable row level security;
alter table public.search_runs enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own" on public.profiles
  for delete using (auth.uid() = user_id);

drop policy if exists "qualifications_all_own" on public.qualifications;
create policy "qualifications_all_own" on public.qualifications
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "skills_all_own" on public.skills;
create policy "skills_all_own" on public.skills
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "scholarship_matches_all_own" on public.scholarship_matches;
create policy "scholarship_matches_all_own" on public.scholarship_matches
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "job_matches_all_own" on public.job_matches;
create policy "job_matches_all_own" on public.job_matches
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "search_runs_all_own" on public.search_runs;
create policy "search_runs_all_own" on public.search_runs
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  insert into public.profiles (user_id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$fn$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $fn$
begin
  new.updated_at = now();
  return new;
end;
$fn$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute procedure public.set_updated_at();
