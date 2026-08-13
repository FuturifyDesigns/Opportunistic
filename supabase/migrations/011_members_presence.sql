-- Discoverable members + last seen (presence is client Realtime; last_seen_at is persisted)

alter table public.profiles
  add column if not exists last_seen_at timestamptz;

create index if not exists profiles_last_seen_idx on public.profiles (last_seen_at desc nulls last);

create or replace function public.touch_last_seen()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    return;
  end if;
  update public.profiles
  set last_seen_at = now()
  where user_id = me;
end;
$$;

revoke all on function public.touch_last_seen() from public;
grant execute on function public.touch_last_seen() to authenticated;

create or replace function public.can_view_collab_profile(target uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
begin
  if me is null or target is null then
    return false;
  end if;
  if me = target then
    return true;
  end if;
  return exists (
    select 1 from public.profiles p
    where p.user_id = target and p.onboarding_complete = true
  );
end;
$$;

drop function if exists public.list_opportunistic_members(int);
create or replace function public.list_opportunistic_members(limit_count int default 80)
returns table (
  user_id uuid,
  full_name text,
  headline text,
  country text,
  avatar_url text,
  collab_intent text,
  open_to_collab boolean,
  last_seen_at timestamptz,
  skills text[],
  friendship text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  lim int := greatest(1, least(coalesce(limit_count, 80), 120));
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  return query
  select
    p.user_id,
    coalesce(nullif(trim(p.full_name), ''), 'Member')::text,
    p.headline,
    p.country,
    p.avatar_url,
    p.collab_intent,
    p.open_to_collab,
    p.last_seen_at,
    coalesce((
      select array_agg(s.skill_name order by s.skill_name)
      from public.skills s
      where s.user_id = p.user_id and nullif(trim(s.skill_name), '') is not null
    ), '{}'::text[]),
    case
      when public.are_collab_friends(me, p.user_id) then 'friends'
      when exists (
        select 1 from public.collab_friendships f
        where f.status = 'pending' and f.requester_id = me and f.addressee_id = p.user_id
      ) then 'outgoing'
      when exists (
        select 1 from public.collab_friendships f
        where f.status = 'pending' and f.requester_id = p.user_id and f.addressee_id = me
      ) then 'incoming'
      else 'none'
    end
  from public.profiles p
  where p.onboarding_complete = true
    and p.user_id <> me
  order by p.last_seen_at desc nulls last, p.full_name nulls last
  limit lim;
end;
$$;

revoke all on function public.list_opportunistic_members(int) from public;
grant execute on function public.list_opportunistic_members(int) to authenticated;

drop function if exists public.get_collab_profile(uuid);
create or replace function public.get_collab_profile(p_user_id uuid)
returns table (
  user_id uuid,
  full_name text,
  headline text,
  bio text,
  country text,
  avatar_url text,
  collab_intent text,
  open_to_collab boolean,
  last_seen_at timestamptz,
  skills text[],
  friendship text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  rel text := 'none';
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;
  if p_user_id is null then
    raise exception 'Invalid user';
  end if;
  if me = p_user_id then
    rel := 'self';
  elsif not public.can_view_collab_profile(p_user_id) then
    raise exception 'Profile is not available';
  elsif public.are_collab_friends(me, p_user_id) then
    rel := 'friends';
  elsif exists (
    select 1 from public.collab_friendships f
    where f.status = 'pending' and f.requester_id = me and f.addressee_id = p_user_id
  ) then
    rel := 'outgoing';
  elsif exists (
    select 1 from public.collab_friendships f
    where f.status = 'pending' and f.requester_id = p_user_id and f.addressee_id = me
  ) then
    rel := 'incoming';
  else
    rel := 'none';
  end if;

  return query
  select
    p.user_id,
    coalesce(nullif(trim(p.full_name), ''), 'Member')::text,
    p.headline,
    left(coalesce(p.bio, ''), 800)::text,
    p.country,
    p.avatar_url,
    p.collab_intent,
    p.open_to_collab,
    p.last_seen_at,
    coalesce((
      select array_agg(s.skill_name order by s.skill_name)
      from public.skills s
      where s.user_id = p.user_id and nullif(trim(s.skill_name), '') is not null
    ), '{}'::text[]),
    rel
  from public.profiles p
  where p.user_id = p_user_id;
end;
$$;

revoke all on function public.get_collab_profile(uuid) from public;
grant execute on function public.get_collab_profile(uuid) to authenticated;

drop function if exists public.list_collab_friends();
create or replace function public.list_collab_friends()
returns table (
  user_id uuid,
  full_name text,
  headline text,
  country text,
  avatar_url text,
  last_seen_at timestamptz
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
    p.user_id,
    coalesce(nullif(trim(p.full_name), ''), 'Member')::text,
    p.headline,
    p.country,
    p.avatar_url,
    p.last_seen_at
  from public.collab_friendships f
  join public.profiles p
    on p.user_id = case when f.requester_id = me then f.addressee_id else f.requester_id end
  where f.status = 'accepted'
    and (f.requester_id = me or f.addressee_id = me)
  order by p.last_seen_at desc nulls last, p.full_name nulls last;
end;
$$;

revoke all on function public.list_collab_friends() from public;
grant execute on function public.list_collab_friends() to authenticated;

drop function if exists public.list_friend_requests();
create or replace function public.list_friend_requests()
returns table (
  user_id uuid,
  full_name text,
  headline text,
  country text,
  avatar_url text,
  last_seen_at timestamptz
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
    p.user_id,
    coalesce(nullif(trim(p.full_name), ''), 'Member')::text,
    p.headline,
    p.country,
    p.avatar_url,
    p.last_seen_at
  from public.collab_friendships f
  join public.profiles p on p.user_id = f.requester_id
  where f.addressee_id = me and f.status = 'pending'
  order by f.created_at desc;
end;
$$;

revoke all on function public.list_friend_requests() from public;
grant execute on function public.list_friend_requests() to authenticated;

drop function if exists public.list_collab_peers(int);
create or replace function public.list_collab_peers(limit_count int default 40)
returns table (
  user_id uuid,
  full_name text,
  headline text,
  country text,
  bio text,
  collab_intent text,
  avatar_url text,
  last_seen_at timestamptz,
  skills text[],
  overlap_count int,
  shared_skills text[]
)
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  lim int := greatest(1, least(coalesce(limit_count, 40), 100));
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  return query
  with my_skills as (
    select lower(trim(s.skill_name)) as skill_key
    from public.skills s
    where s.user_id = me
      and nullif(trim(s.skill_name), '') is not null
  ),
  peer_skills as (
    select
      s.user_id,
      array_agg(distinct s.skill_name order by s.skill_name) as all_skills,
      array_agg(distinct s.skill_name order by s.skill_name)
        filter (where lower(trim(s.skill_name)) in (select skill_key from my_skills)) as shared,
      count(*) filter (where lower(trim(s.skill_name)) in (select skill_key from my_skills))::int as overlaps
    from public.skills s
    where s.user_id <> me
      and nullif(trim(s.skill_name), '') is not null
    group by s.user_id
  )
  select
    p.user_id,
    coalesce(nullif(trim(p.full_name), ''), 'Member')::text,
    p.headline,
    p.country,
    left(coalesce(p.bio, ''), 280)::text,
    p.collab_intent,
    p.avatar_url,
    p.last_seen_at,
    coalesce(ps.all_skills, '{}'::text[]),
    coalesce(ps.overlaps, 0),
    coalesce(ps.shared, '{}'::text[])
  from public.profiles p
  join peer_skills ps on ps.user_id = p.user_id
  where p.onboarding_complete = true
    and p.open_to_collab = true
    and p.user_id <> me
    and coalesce(ps.overlaps, 0) > 0
  order by ps.overlaps desc, p.last_seen_at desc nulls last
  limit lim;
end;
$$;

revoke all on function public.list_collab_peers(int) from public;
grant execute on function public.list_collab_peers(int) to authenticated;

drop function if exists public.list_collab_thread_people(uuid);
create or replace function public.list_collab_thread_people(p_thread_id uuid)
returns table (
  user_id uuid,
  full_name text,
  avatar_url text,
  last_seen_at timestamptz
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
  if not public.is_collab_thread_member(p_thread_id) then
    raise exception 'Not a member';
  end if;

  return query
  select
    p.user_id,
    coalesce(nullif(trim(p.full_name), ''), 'Member')::text,
    p.avatar_url,
    p.last_seen_at
  from public.collab_thread_members m
  join public.profiles p on p.user_id = m.user_id
  where m.thread_id = p_thread_id;
end;
$$;

revoke all on function public.list_collab_thread_people(uuid) from public;
grant execute on function public.list_collab_thread_people(uuid) to authenticated;

drop function if exists public.list_collab_threads();
create or replace function public.list_collab_threads()
returns table (
  thread_id uuid,
  kind text,
  skill_key text,
  title text,
  last_body text,
  last_at timestamptz,
  peer_name text,
  peer_user_id uuid,
  peer_avatar text,
  peer_last_seen timestamptz,
  unread_count bigint
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
    t.id,
    t.kind,
    t.skill_key,
    coalesce(
      nullif(t.title, ''),
      case
        when t.kind = 'skill' then initcap(replace(coalesce(t.skill_key, 'skill'), '-', ' ')) || ' room'
        else 'Conversation'
      end
    )::text,
    (
      select m.body from public.collab_messages m
      where m.thread_id = t.id
      order by m.created_at desc
      limit 1
    ),
    (
      select m.created_at from public.collab_messages m
      where m.thread_id = t.id
      order by m.created_at desc
      limit 1
    ),
    case
      when t.kind = 'dm' then (
        select coalesce(nullif(trim(p.full_name), ''), 'Member')
        from public.collab_thread_members tm
        join public.profiles p on p.user_id = tm.user_id
        where tm.thread_id = t.id and tm.user_id <> me
        limit 1
      )
      else null
    end,
    case
      when t.kind = 'dm' then (
        select tm.user_id
        from public.collab_thread_members tm
        where tm.thread_id = t.id and tm.user_id <> me
        limit 1
      )
      else null
    end,
    case
      when t.kind = 'dm' then (
        select p.avatar_url
        from public.collab_thread_members tm
        join public.profiles p on p.user_id = tm.user_id
        where tm.thread_id = t.id and tm.user_id <> me
        limit 1
      )
      else null
    end,
    case
      when t.kind = 'dm' then (
        select p.last_seen_at
        from public.collab_thread_members tm
        join public.profiles p on p.user_id = tm.user_id
        where tm.thread_id = t.id and tm.user_id <> me
        limit 1
      )
      else null
    end,
    (
      select count(*)
      from public.collab_messages m
      join public.collab_thread_members mem
        on mem.thread_id = m.thread_id and mem.user_id = me
      where m.thread_id = t.id
        and m.user_id <> me
        and (mem.last_read_at is null or m.created_at > mem.last_read_at)
    )
  from public.collab_threads t
  join public.collab_thread_members mine
    on mine.thread_id = t.id and mine.user_id = me and mine.archived_at is null
  order by coalesce(
    (select m.created_at from public.collab_messages m where m.thread_id = t.id order by m.created_at desc limit 1),
    t.created_at
  ) desc;
end;
$$;

revoke all on function public.list_collab_threads() from public;
grant execute on function public.list_collab_threads() to authenticated;

create or replace function public.start_collab_dm(other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  existing uuid;
  new_id uuid;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;
  if other_user_id is null or other_user_id = me then
    raise exception 'Invalid peer';
  end if;
  if not public.can_view_collab_profile(other_user_id) then
    raise exception 'Profile is not available';
  end if;

  select t.id into existing
  from public.collab_threads t
  where t.kind = 'dm'
    and exists (
      select 1 from public.collab_thread_members a
      where a.thread_id = t.id and a.user_id = me
    )
    and exists (
      select 1 from public.collab_thread_members b
      where b.thread_id = t.id and b.user_id = other_user_id
    )
    and (
      select count(*) from public.collab_thread_members c where c.thread_id = t.id
    ) = 2
  limit 1;

  if existing is not null then
    update public.collab_thread_members
    set archived_at = null
    where thread_id = existing and user_id = me;
    return existing;
  end if;

  insert into public.collab_threads (kind, title, created_by)
  values ('dm', 'Direct message', me)
  returning id into new_id;

  insert into public.collab_thread_members (thread_id, user_id)
  values (new_id, me), (new_id, other_user_id);

  return new_id;
end;
$$;

revoke all on function public.start_collab_dm(uuid) from public;
grant execute on function public.start_collab_dm(uuid) to authenticated;
