-- Job completion (starts the review request) and a per-lead follow-up pause.

alter table public.leads
  add column if not exists completed_at timestamptz,
  add column if not exists follow_ups_paused boolean not null default false;

-- Admins could only update status; they also set these two from the lead
-- page. The existing "Admins can update lead status" policy still limits
-- which rows they can touch.
grant update (completed_at, follow_ups_paused) on table public.leads to authenticated;
