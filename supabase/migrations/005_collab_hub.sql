-- Collab Hub: skill-matched peers, opportunity board, and chat threads

alter table public.profiles
  add column if not exists open_to_collab boolean not null default false;

alter table public.profiles
  add column if not exists collab_intent text
    check (collab_intent is null or collab_intent in ('collaborate', 'mentor', 'study', 'project', 'other'));

create table if not exists public.collab_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  body text not null,
  skills text[] not null default '{}',
  intent text not null default 'collaborate'
    check (intent in ('collaborate', 'mentor', 'study', 'project', 'other')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.collab_threads (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'dm'
    check (kind in ('dm', 'skill', 'post')),
  skill_key text,
  post_id uuid references public.collab_posts (id) on delete set null,
  title text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.collab_thread_members (
  thread_id uuid not null references public.collab_threads (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  primary key (thread_id, user_id)
);

create table if not exists public.collab_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.collab_threads (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0 and char_length(body) <= 4000),
  created_at timestamptz not null default now()
);

create index if not exists collab_posts_active_idx on public.collab_posts (active, created_at desc);
create index if not exists collab_posts_user_id_idx on public.collab_posts (user_id);
create index if not exists collab_threads_skill_key_idx on public.collab_threads (skill_key) where kind = 'skill';
create index if not exists collab_thread_members_user_id_idx on public.collab_thread_members (user_id);
create index if not exists collab_messages_thread_id_idx on public.collab_messages (thread_id, created_at);

create unique index if not exists collab_threads_skill_unique
  on public.collab_threads (skill_key)
  where kind = 'skill' and skill_key is not null;

drop trigger if exists collab_posts_updated_at on public.collab_posts;
create trigger collab_posts_updated_at
  before update on public.collab_posts
  for each row
  execute procedure public.set_updated_at();

alter table public.collab_posts enable row level security;
alter table public.collab_threads enable row level security;
alter table public.collab_thread_members enable row level security;
alter table public.collab_messages enable row level security;

-- Posts: signed-in users can read active posts; authors manage their own
drop policy if exists "collab_posts_select" on public.collab_posts;
create policy "collab_posts_select" on public.collab_posts
  for select to authenticated
  using (active = true or auth.uid() = user_id);

drop policy if exists "collab_posts_insert" on public.collab_posts;
create policy "collab_posts_insert" on public.collab_posts
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "collab_posts_update" on public.collab_posts;
create policy "collab_posts_update" on public.collab_posts
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "collab_posts_delete" on public.collab_posts;
create policy "collab_posts_delete" on public.collab_posts
  for delete to authenticated
  using (auth.uid() = user_id);

-- Threads / members / messages: membership checks via security-definer helper
-- (avoids infinite recursion when policies query collab_thread_members under RLS)
create or replace function public.is_collab_thread_member(p_thread_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.collab_thread_members m
    where m.thread_id = p_thread_id
      and m.user_id = auth.uid()
  );
$$;

revoke all on function public.is_collab_thread_member(uuid) from public;
grant execute on function public.is_collab_thread_member(uuid) to authenticated;

drop policy if exists "collab_threads_select" on public.collab_threads;
create policy "collab_threads_select" on public.collab_threads
  for select to authenticated
  using (public.is_collab_thread_member(id));

drop policy if exists "collab_thread_members_select" on public.collab_thread_members;
create policy "collab_thread_members_select" on public.collab_thread_members
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "collab_thread_members_update" on public.collab_thread_members;
create policy "collab_thread_members_update" on public.collab_thread_members
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "collab_messages_select" on public.collab_messages;
create policy "collab_messages_select" on public.collab_messages
  for select to authenticated
  using (public.is_collab_thread_member(thread_id));

drop policy if exists "collab_messages_insert" on public.collab_messages;
create policy "collab_messages_insert" on public.collab_messages
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and public.is_collab_thread_member(thread_id)
  );

-- Peer discovery (limited profile fields for opted-in users)
create or replace function public.list_collab_peers(limit_count int default 40)
returns table (
  user_id uuid,
  full_name text,
  headline text,
  country text,
  bio text,
  collab_intent text,
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
    select lower(trim(s.skill_name)) as skill_key, s.skill_name
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
    coalesce(ps.all_skills, '{}'::text[]),
    coalesce(ps.overlaps, 0),
    coalesce(ps.shared, '{}'::text[])
  from public.profiles p
  join peer_skills ps on ps.user_id = p.user_id
  where p.open_to_collab = true
    and p.onboarding_complete = true
    and p.user_id <> me
    and coalesce(ps.overlaps, 0) > 0
  order by ps.overlaps desc, p.updated_at desc nulls last
  limit lim;
end;
$$;

revoke all on function public.list_collab_peers(int) from public;
grant execute on function public.list_collab_peers(int) to authenticated;

-- Start or reuse a DM with another opted-in user
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

-- Join or create a skill room
create or replace function public.join_skill_room(skill_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  key text := lower(trim(skill_name));
  label text := trim(skill_name);
  room_id uuid;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;
  if key is null or key = '' or char_length(key) < 2 then
    raise exception 'Invalid skill';
  end if;

  select id into room_id
  from public.collab_threads
  where kind = 'skill' and skill_key = key
  limit 1;

  if room_id is null then
    insert into public.collab_threads (kind, skill_key, title, created_by)
    values ('skill', key, label || ' room', me)
    returning id into room_id;
  end if;

  insert into public.collab_thread_members (thread_id, user_id)
  values (room_id, me)
  on conflict do nothing;

  return room_id;
end;
$$;

revoke all on function public.join_skill_room(text) from public;
grant execute on function public.join_skill_room(text) to authenticated;

-- Thread inbox for the current user
create or replace function public.list_collab_threads()
returns table (
  thread_id uuid,
  kind text,
  skill_key text,
  title text,
  last_body text,
  last_at timestamptz,
  peer_name text,
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
  join public.collab_thread_members mine on mine.thread_id = t.id and mine.user_id = me
  order by coalesce(
    (select m.created_at from public.collab_messages m where m.thread_id = t.id order by m.created_at desc limit 1),
    t.created_at
  ) desc;
end;
$$;

revoke all on function public.list_collab_threads() from public;
grant execute on function public.list_collab_threads() to authenticated;

create or replace function public.mark_collab_thread_read(p_thread_id uuid)
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

  update public.collab_thread_members
  set last_read_at = now()
  where thread_id = p_thread_id and user_id = me;
end;
$$;

revoke all on function public.mark_collab_thread_read(uuid) from public;
grant execute on function public.mark_collab_thread_read(uuid) to authenticated;

-- Author names on posts without exposing full profiles
create or replace function public.list_collab_posts(limit_count int default 50)
returns table (
  id uuid,
  user_id uuid,
  author_name text,
  author_country text,
  title text,
  body text,
  skills text[],
  intent text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  lim int := greatest(1, least(coalesce(limit_count, 50), 100));
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  return query
  select
    cp.id,
    cp.user_id,
    coalesce(nullif(trim(p.full_name), ''), 'Member')::text,
    p.country,
    cp.title,
    cp.body,
    cp.skills,
    cp.intent,
    cp.created_at
  from public.collab_posts cp
  left join public.profiles p on p.user_id = cp.user_id
  where cp.active = true
  order by cp.created_at desc
  limit lim;
end;
$$;

revoke all on function public.list_collab_posts(int) from public;
grant execute on function public.list_collab_posts(int) to authenticated;
