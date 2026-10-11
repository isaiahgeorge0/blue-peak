-- One row per lead per follow-up step, written by /api/cron/follow-ups with
-- the service role. The unique (lead_id, step) constraint means a step can be
-- claimed once, so no follow-up is ever sent twice to the same lead.
--
-- status:
--   sending  claimed by a run, email in flight
--   sent     delivered to Resend
--   skipped  due but deliberately not sent (reason in error)
--   failed   Resend rejected it; retried on later runs until attempts = 3

create table if not exists public.follow_up_sends (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  step text not null,
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  status text not null,
  error text,
  recipient text,
  attempts integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint follow_up_sends_lead_step_key unique (lead_id, step),
  constraint follow_up_sends_step_check
    check (step in ('acknowledgement', 'quote_chaser_1', 'quote_chaser_2', 'review_request')),
  constraint follow_up_sends_status_check
    check (status in ('sending', 'sent', 'skipped', 'failed')),
  constraint follow_up_sends_lengths_check
    check (
      (error is null or char_length(error) <= 500)
      and (recipient is null or char_length(recipient) <= 254)
    )
);

create index if not exists follow_up_sends_status_idx
  on public.follow_up_sends (status, updated_at desc);

alter table public.follow_up_sends enable row level security;

revoke all on table public.follow_up_sends from anon, authenticated;
grant select on table public.follow_up_sends to authenticated;

drop policy if exists "Admins can select follow-up sends"
  on public.follow_up_sends;
create policy "Admins can select follow-up sends"
  on public.follow_up_sends
  for select
  to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
