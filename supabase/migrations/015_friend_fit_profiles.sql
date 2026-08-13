-- Friends' skills/quals for intelligent match recommendations (friends only)

create or replace function public.list_friend_fit_profiles()
returns table (
  user_id uuid,
  full_name text,
  headline text,
  bio text,
  country text,
  avatar_url text,
  goal text,
  skills jsonb,
  qualifications jsonb
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
    left(coalesce(p.bio, ''), 400)::text,
    p.country,
    p.avatar_url,
    coalesce(p.goal, 'both')::text,
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'skill_name', s.skill_name,
          'proficiency', s.proficiency
        )
        order by s.skill_name
      )
      from public.skills s
      where s.user_id = p.user_id
        and nullif(trim(s.skill_name), '') is not null
    ), '[]'::jsonb),
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'type', q.type,
          'field', q.field,
          'year', q.year,
          'institution', q.institution
        )
        order by q.year desc nulls last
      )
      from public.qualifications q
      where q.user_id = p.user_id
        and nullif(trim(q.field), '') is not null
    ), '[]'::jsonb)
  from public.collab_friendships f
  join public.profiles p
    on p.user_id = case when f.requester_id = me then f.addressee_id else f.requester_id end
  where f.status = 'accepted'
    and (f.requester_id = me or f.addressee_id = me)
    and coalesce(p.onboarding_complete, false) = true
  order by p.full_name nulls last;
end;
$$;

revoke all on function public.list_friend_fit_profiles() from public;
grant execute on function public.list_friend_fit_profiles() to authenticated;
