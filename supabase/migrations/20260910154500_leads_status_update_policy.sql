-- Constrain lead status values and allow authenticated admins
-- to update only the status column.

alter table public.leads
  drop constraint if exists leads_status_check;

alter table public.leads
  add constraint leads_status_check
  check (status in ('new', 'contacted', 'quoted', 'won', 'lost'));

-- Column-level privilege: authenticated role may only update status.
revoke update on table public.leads from authenticated;
grant update (status) on table public.leads to authenticated;

drop policy if exists "Authenticated users can update lead status" on public.leads;

create policy "Authenticated users can update lead status"
  on public.leads
  for update
  to authenticated
  using (true)
  with check (status in ('new', 'contacted', 'quoted', 'won', 'lost'));

-- PostgREST PATCH needs SELECT to locate rows under RLS.
grant select on table public.leads to authenticated;

drop policy if exists "Authenticated users can select leads" on public.leads;

create policy "Authenticated users can select leads"
  on public.leads
  for select
  to authenticated
  using (true);
