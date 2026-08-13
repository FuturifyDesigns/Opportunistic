-- Remove internal [opp_…] markers from public bios; keep goal on the goal column

update public.profiles
set goal = lower((regexp_match(bio, '\[opp_goal:(both|scholarships|jobs)\]', 'i'))[1])
where bio ~* '\[opp_goal:(both|scholarships|jobs)\]';

update public.profiles
set bio = nullif(trim(regexp_replace(coalesce(bio, ''), '\[opp_[^\]]+\]\s*', '', 'gi')), '')
where bio ~* '\[opp_';
