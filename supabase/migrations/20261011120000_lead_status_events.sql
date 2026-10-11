-- Status history for leads, written only by a trigger on public.leads.
-- Admins can read it; no role can insert, update or delete rows directly.

create table if not exists public.lead_status_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  from_status text,
  to_status text not null,
  -- Null when the change was made with the service role (no signed-in user).
  changed_by uuid references auth.users (id) on delete set null,
  changed_at timestamptz not null default now()
);

create index if not exists lead_status_events_lead_id_changed_at_idx
  on public.lead_status_events (lead_id, changed_at desc);

alter table public.lead_status_events enable row level security;

revoke all on table public.lead_status_events from anon, authenticated;
grant select on table public.lead_status_events to authenticated;

drop policy if exists "Admins can select lead status events"
  on public.lead_status_events;
create policy "Admins can select lead status events"
  on public.lead_status_events
  for select
  to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- security definer so the insert works without granting anyone write access.
-- auth.uid() still reads the caller's JWT claims.
create or replace function public.record_lead_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.lead_status_events (lead_id, from_status, to_status, changed_by)
  values (new.id, old.status, new.status, auth.uid());
  return new;
end;
$$;

revoke execute on function public.record_lead_status_change()
  from public, anon, authenticated;

drop trigger if exists leads_record_status_change on public.leads;
create trigger leads_record_status_change
  after update of status on public.leads
  for each row
  when (old.status is distinct from new.status)
  execute function public.record_lead_status_change();
