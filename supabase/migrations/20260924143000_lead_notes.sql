-- Append-only activity notes on leads (admin-only via authenticated RLS).

create table if not exists public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now()
);

create index if not exists lead_notes_lead_id_idx
  on public.lead_notes (lead_id);

alter table public.lead_notes enable row level security;

revoke all on table public.lead_notes from anon, authenticated;
grant select, insert on table public.lead_notes to authenticated;

drop policy if exists "Authenticated users can select lead notes"
  on public.lead_notes;
create policy "Authenticated users can select lead notes"
  on public.lead_notes
  for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can insert lead notes"
  on public.lead_notes;
create policy "Authenticated users can insert lead notes"
  on public.lead_notes
  for insert
  to authenticated
  with check (true);
