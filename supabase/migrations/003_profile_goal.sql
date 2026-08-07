-- Persist onboarding goal preference (both | scholarships | jobs)
alter table public.profiles
  add column if not exists goal text not null default 'both'
  check (goal in ('both', 'scholarships', 'jobs'));

-- Backfill from bio text written by older onboarding builds
update public.profiles
set goal = case
  when lower(coalesce(bio, '')) like '%primarily for scholarships%' then 'scholarships'
  when lower(coalesce(bio, '')) like '%mostly scholarships%' then 'scholarships'
  when lower(coalesce(bio, '')) like '%primarily for jobs%' then 'jobs'
  when lower(coalesce(bio, '')) like '%mostly jobs%' then 'jobs'
  else goal
end
where goal = 'both';
