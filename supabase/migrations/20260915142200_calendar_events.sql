-- Internal planning calendar events (admin-only via authenticated RLS).

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  notes text,
  start_date date not null,
  start_time time,
  end_time time,
  recurrence text not null default 'none',
  recurrence_days_of_week integer[],
  recurrence_end_date date,
  created_at timestamptz not null default now(),
  constraint calendar_events_recurrence_check
    check (recurrence in ('none', 'weekly', 'biweekly', 'monthly')),
  constraint calendar_events_recurrence_days_of_week_check
    check (
      recurrence_days_of_week is null
      or recurrence_days_of_week <@ array[0, 1, 2, 3, 4, 5, 6]::integer[]
    )
);

create index if not exists calendar_events_start_date_idx
  on public.calendar_events (start_date);

create index if not exists calendar_events_recurrence_idx
  on public.calendar_events (recurrence);

alter table public.calendar_events enable row level security;

revoke all on table public.calendar_events from anon, authenticated;
grant select, insert, update, delete on table public.calendar_events to authenticated;

drop policy if exists "Authenticated users can select calendar events"
  on public.calendar_events;
create policy "Authenticated users can select calendar events"
  on public.calendar_events
  for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can insert calendar events"
  on public.calendar_events;
create policy "Authenticated users can insert calendar events"
  on public.calendar_events
  for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated users can update calendar events"
  on public.calendar_events;
create policy "Authenticated users can update calendar events"
  on public.calendar_events
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated users can delete calendar events"
  on public.calendar_events;
create policy "Authenticated users can delete calendar events"
  on public.calendar_events
  for delete
  to authenticated
  using (true);
