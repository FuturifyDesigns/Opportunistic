-- Live board: other hub viewers see new/closed posts without refresh.
alter table public.collab_posts replica identity full;

do $$
begin
  begin
    alter publication supabase_realtime add table public.collab_posts;
  exception when duplicate_object then null;
  end;
end $$;
