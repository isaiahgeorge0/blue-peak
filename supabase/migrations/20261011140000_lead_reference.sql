-- Customer-facing reference per lead (shown as BP-0001), in order of arrival. Never reused.
create sequence if not exists public.lead_reference_seq as integer;
revoke all on sequence public.lead_reference_seq from anon, authenticated;

alter table public.leads add column reference_number integer;

-- Backfill: oldest lead first. (The status-history trigger only fires on status changes.)
with ordered as (
  select id, row_number() over (order by created_at, id) as n from public.leads
)
update public.leads l set reference_number = o.n from ordered o where o.id = l.id;

select setval('public.lead_reference_seq',
  coalesce((select max(reference_number) from public.leads), 0) + 1, false);

alter table public.leads
  alter column reference_number set default nextval('public.lead_reference_seq'),
  alter column reference_number set not null,
  add constraint leads_reference_number_key unique (reference_number);

alter sequence public.lead_reference_seq owned by public.leads.reference_number;
