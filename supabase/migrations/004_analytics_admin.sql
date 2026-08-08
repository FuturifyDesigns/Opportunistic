-- Analytics + admin read access for Opportunistic
-- Admin email: futurifydesigns@gmail.com

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  session_id text not null,
  event_type text not null,
  path text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_created_at_idx
  on public.analytics_events (created_at desc);
create index if not exists analytics_events_type_idx
  on public.analytics_events (event_type);
create index if not exists analytics_events_session_idx
  on public.analytics_events (session_id);
create index if not exists analytics_events_user_idx
  on public.analytics_events (user_id);

alter table public.analytics_events enable row level security;

create or replace function public.is_site_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(lower(auth.jwt() ->> 'email') = 'futurifydesigns@gmail.com', false);
$$;

revoke all on function public.is_site_admin() from public;
grant execute on function public.is_site_admin() to authenticated;

-- Anyone (anon or signed-in) can write telemetry; only admin can read it.
drop policy if exists "analytics_insert_all" on public.analytics_events;
create policy "analytics_insert_all" on public.analytics_events
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "analytics_select_admin" on public.analytics_events;
create policy "analytics_select_admin" on public.analytics_events
  for select
  to authenticated
  using (public.is_site_admin());

-- Admin can read engagement tables for live dashboards
drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin" on public.profiles
  for select to authenticated
  using (public.is_site_admin());

drop policy if exists "scholarship_matches_select_admin" on public.scholarship_matches;
create policy "scholarship_matches_select_admin" on public.scholarship_matches
  for select to authenticated
  using (public.is_site_admin());

drop policy if exists "job_matches_select_admin" on public.job_matches;
create policy "job_matches_select_admin" on public.job_matches
  for select to authenticated
  using (public.is_site_admin());

drop policy if exists "search_runs_select_admin" on public.search_runs;
create policy "search_runs_select_admin" on public.search_runs
  for select to authenticated
  using (public.is_site_admin());

-- Aggregated snapshot for the admin UI
create or replace function public.admin_overview()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.is_site_admin() then
    raise exception 'not authorized';
  end if;

  select jsonb_build_object(
    'generated_at', now(),
    'users_total', (select count(*)::int from public.profiles),
    'users_onboarded', (select count(*)::int from public.profiles where onboarding_complete),
    'users_today', (
      select count(*)::int from public.profiles
      where created_at >= date_trunc('day', now())
    ),
    'users_7d', (
      select count(*)::int from public.profiles
      where created_at >= now() - interval '7 days'
    ),
    'active_now', (
      select count(distinct session_id)::int
      from public.analytics_events
      where created_at >= now() - interval '5 minutes'
        and event_type in ('page_view', 'heartbeat', 'engage')
    ),
    'active_today', (
      select count(distinct coalesce(user_id::text, session_id))::int
      from public.analytics_events
      where created_at >= date_trunc('day', now())
    ),
    'active_7d', (
      select count(distinct coalesce(user_id::text, session_id))::int
      from public.analytics_events
      where created_at >= now() - interval '7 days'
    ),
    'page_views_today', (
      select count(*)::int from public.analytics_events
      where event_type = 'page_view'
        and created_at >= date_trunc('day', now())
    ),
    'page_views_7d', (
      select count(*)::int from public.analytics_events
      where event_type = 'page_view'
        and created_at >= now() - interval '7 days'
    ),
    'events_today', (
      select count(*)::int from public.analytics_events
      where created_at >= date_trunc('day', now())
    ),
    'saves_total', (
      select
        (select count(*)::int from public.scholarship_matches where saved)
        + (select count(*)::int from public.job_matches where saved)
    ),
    'dismisses_total', (
      select
        (select count(*)::int from public.scholarship_matches where dismissed)
        + (select count(*)::int from public.job_matches where dismissed)
    ),
    'matches_total', (
      select
        (select count(*)::int from public.scholarship_matches)
        + (select count(*)::int from public.job_matches)
    ),
    'search_runs_7d', (
      select count(*)::int from public.search_runs
      where run_at >= now() - interval '7 days'
    ),
    'top_paths', coalesce((
      select jsonb_agg(row_to_json(t))
      from (
        select path, count(*)::int as views
        from public.analytics_events
        where event_type = 'page_view'
          and created_at >= now() - interval '7 days'
          and path is not null
        group by path
        order by views desc
        limit 8
      ) t
    ), '[]'::jsonb),
    'events_by_type_7d', coalesce((
      select jsonb_agg(row_to_json(t))
      from (
        select event_type, count(*)::int as count
        from public.analytics_events
        where created_at >= now() - interval '7 days'
        group by event_type
        order by count desc
        limit 12
      ) t
    ), '[]'::jsonb),
    'daily_active_14d', coalesce((
      select jsonb_agg(row_to_json(t) order by t.day)
      from (
        select date_trunc('day', created_at)::date as day,
               count(distinct coalesce(user_id::text, session_id))::int as active
        from public.analytics_events
        where created_at >= now() - interval '14 days'
        group by 1
        order by 1
      ) t
    ), '[]'::jsonb),
    'recent_events', coalesce((
      select jsonb_agg(row_to_json(t))
      from (
        select id, user_id, session_id, event_type, path, meta, created_at
        from public.analytics_events
        order by created_at desc
        limit 40
      ) t
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke all on function public.admin_overview() from public;
grant execute on function public.admin_overview() to authenticated;

-- Realtime (ignore if already members)
do $$
begin
  begin
    alter publication supabase_realtime add table public.analytics_events;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.profiles;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.scholarship_matches;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.job_matches;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.search_runs;
  exception when duplicate_object then null;
  end;
end $$;
