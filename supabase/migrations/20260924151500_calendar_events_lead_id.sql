-- Link optional site-visit events back to a lead.
-- ON DELETE SET NULL keeps calendar history if a lead is removed.

alter table public.calendar_events
  add column if not exists lead_id uuid references public.leads (id) on delete set null;

create index if not exists calendar_events_lead_id_idx
  on public.calendar_events (lead_id);
