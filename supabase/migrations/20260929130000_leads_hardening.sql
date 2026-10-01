-- Rate limiting, notification tracking, and tighter privileges on leads.

-- Salted SHA-256 of the submitter IP, used by /api/leads to rate limit.
alter table public.leads add column if not exists submitter_hash text;

-- Set when the new-lead email is delivered. Null means the notification
-- failed and the admin dashboard flags the lead.
alter table public.leads add column if not exists notified_at timestamptz;

create index if not exists leads_submitter_hash_created_at_idx
  on public.leads (submitter_hash, created_at desc)
  where submitter_hash is not null;

create index if not exists leads_created_at_idx
  on public.leads (created_at desc);

-- Mirrors the input caps in /api/leads so oversized rows are rejected even
-- if the API check is bypassed.
alter table public.leads drop constraint if exists leads_field_lengths_check;
alter table public.leads
  add constraint leads_field_lengths_check
  check (
    char_length(name) <= 100
    and char_length(phone) <= 30
    and (email is null or char_length(email) <= 254)
    and (postcode is null or char_length(postcode) <= 12)
    and (service_type is null or char_length(service_type) <= 60)
    and (message is null or char_length(message) <= 2000)
    and (source is null or char_length(source) <= 40)
  );

-- The site never touches leads with the anon key, and admins only read and
-- update status. TRUNCATE in particular is not covered by RLS.
revoke all on table public.leads from anon;
revoke insert, delete, truncate, references, trigger
  on table public.leads from authenticated;
