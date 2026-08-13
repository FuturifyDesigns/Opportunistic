-- Seen state for rec notifications + mark-all-read (chats + recs)

alter table public.match_recommendations
  add column if not exists seen_at timestamptz;

drop function if exists public.list_match_recommendations();
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
  seen_at timestamptz,
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
    r.seen_at,
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

create or replace function public.mark_notifications_read()
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
  set seen_at = now()
  where to_user = me
    and dismissed_at is null
    and seen_at is null;

  update public.collab_thread_members
  set last_read_at = now()
  where user_id = me
    and (archived_at is null);
end;
$$;

revoke all on function public.mark_notifications_read() from public;
grant execute on function public.mark_notifications_read() to authenticated;
