-- Restrict lead and calendar data to admins only.
-- A signed-in session is no longer enough: the JWT must carry
-- app_metadata.role = 'admin'. app_metadata is only writable with the
-- service role, so users cannot grant it to themselves.

-- leads
drop policy if exists "Authenticated users can select leads" on public.leads;
drop policy if exists "Admins can select leads" on public.leads;
create policy "Admins can select leads"
  on public.leads
  for select
  to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Authenticated users can update lead status" on public.leads;
drop policy if exists "Admins can update lead status" on public.leads;
create policy "Admins can update lead status"
  on public.leads
  for update
  to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check (
    (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    and status in ('new', 'contacted', 'quoted', 'won', 'lost')
  );

-- lead_notes
drop policy if exists "Authenticated users can select lead notes" on public.lead_notes;
drop policy if exists "Admins can select lead notes" on public.lead_notes;
create policy "Admins can select lead notes"
  on public.lead_notes
  for select
  to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Authenticated users can insert lead notes" on public.lead_notes;
drop policy if exists "Admins can insert lead notes" on public.lead_notes;
create policy "Admins can insert lead notes"
  on public.lead_notes
  for insert
  to authenticated
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- calendar_events
drop policy if exists "Authenticated users can select calendar events" on public.calendar_events;
drop policy if exists "Admins can select calendar events" on public.calendar_events;
create policy "Admins can select calendar events"
  on public.calendar_events
  for select
  to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Authenticated users can insert calendar events" on public.calendar_events;
drop policy if exists "Admins can insert calendar events" on public.calendar_events;
create policy "Admins can insert calendar events"
  on public.calendar_events
  for insert
  to authenticated
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Authenticated users can update calendar events" on public.calendar_events;
drop policy if exists "Admins can update calendar events" on public.calendar_events;
create policy "Admins can update calendar events"
  on public.calendar_events
  for update
  to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Authenticated users can delete calendar events" on public.calendar_events;
drop policy if exists "Admins can delete calendar events" on public.calendar_events;
create policy "Admins can delete calendar events"
  on public.calendar_events
  for delete
  to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
