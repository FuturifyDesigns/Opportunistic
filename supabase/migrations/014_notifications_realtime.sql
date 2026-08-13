-- Friends-only recommendations + realtime for hub notifications

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
  if not public.are_collab_friends(me, p_to_user) then
    raise exception 'You can only recommend matches to friends';
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

alter table public.collab_friendships replica identity full;
alter table public.match_recommendations replica identity full;
alter table public.collab_messages replica identity full;

do $$
begin
  begin
    alter publication supabase_realtime add table public.collab_friendships;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.match_recommendations;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.collab_messages;
  exception when duplicate_object then null;
  end;
end $$;
