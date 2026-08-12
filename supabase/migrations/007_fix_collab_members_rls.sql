-- Fix infinite recursion in collab_thread_members RLS.
-- Policies must not SELECT the same table under RLS; use a security-definer helper.

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

drop policy if exists "collab_thread_members_select" on public.collab_thread_members;
create policy "collab_thread_members_select" on public.collab_thread_members
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "collab_threads_select" on public.collab_threads;
create policy "collab_threads_select" on public.collab_threads
  for select to authenticated
  using (public.is_collab_thread_member(id));

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
