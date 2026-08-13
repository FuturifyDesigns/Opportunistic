-- Friends + public collab profiles + avatars on threads

create table if not exists public.collab_friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users (id) on delete cascade,
  addressee_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint collab_friendships_not_self check (requester_id <> addressee_id)
);

create unique index if not exists collab_friendships_pair_uidx
  on public.collab_friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));

create index if not exists collab_friendships_requester_idx on public.collab_friendships (requester_id, status);
create index if not exists collab_friendships_addressee_idx on public.collab_friendships (addressee_id, status);

drop trigger if exists collab_friendships_updated_at on public.collab_friendships;
create trigger collab_friendships_updated_at
  before update on public.collab_friendships
  for each row
  execute procedure public.set_updated_at();

alter table public.collab_friendships enable row level security;

drop policy if exists "collab_friendships_select" on public.collab_friendships;
create policy "collab_friendships_select" on public.collab_friendships
  for select to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

create or replace function public.are_collab_friends(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.collab_friendships f
    where f.status = 'accepted'
      and (
        (f.requester_id = a and f.addressee_id = b)
        or (f.requester_id = b and f.addressee_id = a)
      )
  );
$$;

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
  if exists (
    select 1 from public.profiles p
    where p.user_id = target and p.open_to_collab = true and p.onboarding_complete = true
  ) then
    return true;
  end if;
  if public.are_collab_friends(me, target) then
    return true;
  end if;
  if exists (
    select 1 from public.collab_posts cp
    where cp.user_id = target and cp.active = true
  ) then
    return true;
  end if;
  if exists (
    select 1
    from public.collab_thread_members a
    join public.collab_thread_members b on b.thread_id = a.thread_id
    where a.user_id = me and b.user_id = target
  ) then
    return true;
  end if;
  return false;
end;
$$;

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

create or replace function public.send_friend_request(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  existing public.collab_friendships%rowtype;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;
  if p_user_id is null or p_user_id = me then
    raise exception 'Invalid user';
  end if;
  if not public.can_view_collab_profile(p_user_id) then
    raise exception 'Profile is not available';
  end if;

  select * into existing
  from public.collab_friendships f
  where least(f.requester_id, f.addressee_id) = least(me, p_user_id)
    and greatest(f.requester_id, f.addressee_id) = greatest(me, p_user_id)
  limit 1;

  if existing.id is not null then
    if existing.status = 'accepted' then
      return 'friends';
    end if;
    if existing.requester_id = p_user_id and existing.addressee_id = me then
      update public.collab_friendships
      set status = 'accepted'
      where id = existing.id;
      return 'friends';
    end if;
    return 'outgoing';
  end if;

  insert into public.collab_friendships (requester_id, addressee_id, status)
  values (me, p_user_id, 'pending');
  return 'outgoing';
end;
$$;

revoke all on function public.send_friend_request(uuid) from public;
grant execute on function public.send_friend_request(uuid) to authenticated;

create or replace function public.respond_friend_request(p_user_id uuid, accept boolean)
returns text
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

  if accept then
    update public.collab_friendships
    set status = 'accepted'
    where requester_id = p_user_id
      and addressee_id = me
      and status = 'pending';
    if not found then
      raise exception 'No request to accept';
    end if;
    return 'friends';
  end if;

  delete from public.collab_friendships
  where requester_id = p_user_id
    and addressee_id = me
    and status = 'pending';
  return 'none';
end;
$$;

revoke all on function public.respond_friend_request(uuid, boolean) from public;
grant execute on function public.respond_friend_request(uuid, boolean) to authenticated;

create or replace function public.cancel_friend_request(p_user_id uuid)
returns text
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

  delete from public.collab_friendships
  where requester_id = me
    and addressee_id = p_user_id
    and status = 'pending';
  return 'none';
end;
$$;

revoke all on function public.cancel_friend_request(uuid) from public;
grant execute on function public.cancel_friend_request(uuid) to authenticated;

create or replace function public.unfriend_collab(p_user_id uuid)
returns text
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

  delete from public.collab_friendships
  where status = 'accepted'
    and (
      (requester_id = me and addressee_id = p_user_id)
      or (requester_id = p_user_id and addressee_id = me)
    );
  return 'none';
end;
$$;

revoke all on function public.unfriend_collab(uuid) from public;
grant execute on function public.unfriend_collab(uuid) to authenticated;

create or replace function public.list_collab_friends()
returns table (
  user_id uuid,
  full_name text,
  headline text,
  country text,
  avatar_url text
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
    p.avatar_url
  from public.collab_friendships f
  join public.profiles p
    on p.user_id = case when f.requester_id = me then f.addressee_id else f.requester_id end
  where f.status = 'accepted'
    and (f.requester_id = me or f.addressee_id = me)
  order by p.full_name nulls last;
end;
$$;

revoke all on function public.list_collab_friends() from public;
grant execute on function public.list_collab_friends() to authenticated;

create or replace function public.list_friend_requests()
returns table (
  user_id uuid,
  full_name text,
  headline text,
  country text,
  avatar_url text
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
    p.avatar_url
  from public.collab_friendships f
  join public.profiles p on p.user_id = f.requester_id
  where f.addressee_id = me and f.status = 'pending'
  order by f.created_at desc;
end;
$$;

revoke all on function public.list_friend_requests() from public;
grant execute on function public.list_friend_requests() to authenticated;

create or replace function public.list_collab_thread_people(p_thread_id uuid)
returns table (
  user_id uuid,
  full_name text,
  avatar_url text
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
    p.avatar_url
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
  other_open boolean;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;
  if other_user_id is null or other_user_id = me then
    raise exception 'Invalid peer';
  end if;

  select open_to_collab into other_open
  from public.profiles
  where user_id = other_user_id;

  if other_open is distinct from true
     and not public.are_collab_friends(me, other_user_id)
     and not exists (
       select 1 from public.collab_posts p
       where p.user_id = other_user_id and p.active = true
     )
  then
    raise exception 'Peer is not open to collab';
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
