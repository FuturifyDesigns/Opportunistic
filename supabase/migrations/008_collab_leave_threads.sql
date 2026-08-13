-- Leave / hide collab chats without recursive RLS.
-- Skill rooms: actually leave (drop membership). DMs: archive so history can reopen.

alter table public.collab_thread_members
  add column if not exists archived_at timestamptz;

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

  insert into public.collab_thread_members (thread_id, user_id, archived_at)
  values (room_id, me, null)
  on conflict (thread_id, user_id) do update
    set archived_at = null;

  return room_id;
end;
$$;

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
  join public.collab_thread_members mine
    on mine.thread_id = t.id and mine.user_id = me and mine.archived_at is null
  order by coalesce(
    (select m.created_at from public.collab_messages m where m.thread_id = t.id order by m.created_at desc limit 1),
    t.created_at
  ) desc;
end;
$$;

create or replace function public.leave_collab_thread(p_thread_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  thread_kind text;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  select kind into thread_kind
  from public.collab_threads
  where id = p_thread_id;

  if thread_kind is null then
    return;
  end if;

  if not exists (
    select 1 from public.collab_thread_members
    where thread_id = p_thread_id and user_id = me
  ) then
    return;
  end if;

  if thread_kind = 'skill' then
    delete from public.collab_thread_members
    where thread_id = p_thread_id and user_id = me;
  else
    update public.collab_thread_members
    set archived_at = now()
    where thread_id = p_thread_id and user_id = me;
  end if;
end;
$$;

revoke all on function public.leave_collab_thread(uuid) from public;
grant execute on function public.leave_collab_thread(uuid) to authenticated;

create or replace function public.unarchive_collab_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.collab_thread_members
  set archived_at = null
  where thread_id = new.thread_id
    and archived_at is not null;
  return new;
end;
$$;

drop trigger if exists collab_messages_unarchive on public.collab_messages;
create trigger collab_messages_unarchive
  after insert on public.collab_messages
  for each row
  execute procedure public.unarchive_collab_on_message();
