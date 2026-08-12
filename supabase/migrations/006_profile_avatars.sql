-- Profile avatars: column + Storage bucket tuned for Supabase free tier
-- Client compresses to ~512px JPEG before upload; bucket caps at 512KB.

alter table public.profiles
  add column if not exists avatar_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  524288,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Path layout: {user_id}/avatar.jpg (one object per user — no version pile-up)
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');

drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Expose avatar on collab peer cards
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

-- Author avatar on board posts
drop function if exists public.list_collab_posts(int);
create or replace function public.list_collab_posts(limit_count int default 50)
returns table (
  id uuid,
  user_id uuid,
  author_name text,
  author_country text,
  author_avatar text,
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
    p.avatar_url,
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
