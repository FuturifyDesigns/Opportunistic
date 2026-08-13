-- Share job / scholarship matches with other Opportunistic members

create table if not exists public.match_recommendations (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null references auth.users (id) on delete cascade,
  to_user uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('job', 'scholarship')),
  title text not null,
  url text not null,
  company text,
  location text,
  source text,
  deadline text,
  match_score numeric(5,2),
  note text,
  created_at timestamptz not null default now(),
  dismissed_at timestamptz,
  constraint match_rec_not_self check (from_user <> to_user)
);

create unique index if not exists match_rec_pair_url_uidx
  on public.match_recommendations (from_user, to_user, url);

create index if not exists match_rec_to_user_idx
  on public.match_recommendations (to_user, created_at desc);

alter table public.match_recommendations enable row level security;

drop policy if exists "match_rec_select" on public.match_recommendations;
create policy "match_rec_select" on public.match_recommendations
  for select to authenticated
  using (auth.uid() = from_user or auth.uid() = to_user);

drop policy if exists "match_rec_insert" on public.match_recommendations;
create policy "match_rec_insert" on public.match_recommendations
  for insert to authenticated
  with check (auth.uid() = from_user);

drop policy if exists "match_rec_update" on public.match_recommendations;
create policy "match_rec_update" on public.match_recommendations
  for update to authenticated
  using (auth.uid() = from_user or auth.uid() = to_user)
  with check (auth.uid() = from_user or auth.uid() = to_user);

drop policy if exists "match_rec_delete" on public.match_recommendations;
create policy "match_rec_delete" on public.match_recommendations
  for delete to authenticated
  using (auth.uid() = from_user or auth.uid() = to_user);

create or replace function public.recommend_match(
  p_to_user uuid,
  p_kind text,
  p_title text,
  p_url text,
  p_company text default null,
  p_location text default null,
  p_source text default null,
  p_deadline text default null,
  p_match_score numeric default null,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  rec_id uuid;
  kind_n text := lower(trim(coalesce(p_kind, '')));
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;
  if p_to_user is null or p_to_user = me then
    raise exception 'Pick someone else to recommend this to';
  end if;
  if kind_n not in ('job', 'scholarship') then
    raise exception 'Invalid match type';
  end if;
  if nullif(trim(p_title), '') is null or nullif(trim(p_url), '') is null then
    raise exception 'Missing listing';
  end if;
  if not public.can_view_collab_profile(p_to_user) then
    raise exception 'That member is not available';
  end if;

  insert into public.match_recommendations (
    from_user, to_user, kind, title, url, company, location, source, deadline, match_score, note, dismissed_at
  )
  values (
    me,
    p_to_user,
    kind_n,
    left(trim(p_title), 240),
    left(trim(p_url), 2000),
    nullif(left(trim(coalesce(p_company, '')), 160), ''),
    nullif(left(trim(coalesce(p_location, '')), 160), ''),
    nullif(left(trim(coalesce(p_source, '')), 120), ''),
    nullif(left(trim(coalesce(p_deadline, '')), 80), ''),
    p_match_score,
    nullif(left(trim(coalesce(p_note, '')), 400), ''),
    null
  )
  on conflict (from_user, to_user, url) do update
    set kind = excluded.kind,
        title = excluded.title,
        company = excluded.company,
        location = excluded.location,
        source = excluded.source,
        deadline = excluded.deadline,
        match_score = excluded.match_score,
        note = excluded.note,
        created_at = now(),
        dismissed_at = null
  returning id into rec_id;

  return rec_id;
end;
$$;

revoke all on function public.recommend_match(uuid, text, text, text, text, text, text, text, numeric, text) from public;
grant execute on function public.recommend_match(uuid, text, text, text, text, text, text, text, numeric, text) to authenticated;

create or replace function public.list_match_recommendations()
returns table (
  id uuid,
  kind text,
  title text,
  url text,
  company text,
  location text,
  source text,
  deadline text,
  match_score numeric,
  note text,
  created_at timestamptz,
  from_user_id uuid,
  from_name text,
  from_avatar text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  return query
  select
    r.id,
    r.kind,
    r.title,
    r.url,
    r.company,
    r.location,
    r.source,
    r.deadline,
    r.match_score,
    r.note,
    r.created_at,
    r.from_user,
    coalesce(nullif(trim(p.full_name), ''), 'Member')::text,
    p.avatar_url
  from public.match_recommendations r
  join public.profiles p on p.user_id = r.from_user
  where r.to_user = me
    and r.dismissed_at is null
  order by r.created_at desc
  limit 40;
end;
$$;

revoke all on function public.list_match_recommendations() from public;
grant execute on function public.list_match_recommendations() to authenticated;

create or replace function public.dismiss_match_recommendation(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;
  update public.match_recommendations
  set dismissed_at = now()
  where id = p_id and to_user = me and dismissed_at is null;
end;
$$;

revoke all on function public.dismiss_match_recommendation(uuid) from public;
grant execute on function public.dismiss_match_recommendation(uuid) to authenticated;
