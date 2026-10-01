-- Spam status + admin bulk delete, and stalled-lead reminder tracking.

-- 1. Allow 'spam' as a lead status (bulk "mark as spam" in admin).
alter table public.leads drop constraint if exists leads_status_check;
alter table public.leads
  add constraint leads_status_check
  check (status in ('new', 'contacted', 'quoted', 'won', 'lost', 'spam'));

drop policy if exists "Admins can update lead status" on public.leads;
create policy "Admins can update lead status"
  on public.leads
  for update
  to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check (
    (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    and status in ('new', 'contacted', 'quoted', 'won', 'lost', 'spam')
  );

-- 2. Admins may delete leads (bulk delete). lead_notes cascade;
-- calendar_events.lead_id is set null.
grant delete on table public.leads to authenticated;

drop policy if exists "Admins can delete leads" on public.leads;
create policy "Admins can delete leads"
  on public.leads
  for delete
  to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- 3. Reminder tracking. Only status 'new' counts as unactioned; any other
-- status stops reminders.
alter table public.leads
  add column if not exists last_reminded_at timestamptz,
  add column if not exists reminder_count integer not null default 0;

create index if not exists leads_unactioned_created_at_idx
  on public.leads (created_at)
  where status = 'new';
