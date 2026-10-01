-- Baseline for public.leads, which was originally created in the dashboard.
-- Matches the live table so the schema can be rebuilt from migrations.
-- The status check and admin policies are added by later migrations.

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  phone text not null,
  email text,
  postcode text,
  service_type text,
  message text,
  status text not null default 'new',
  source text default 'website'
);

-- No anon/authenticated policies here: website inserts go through the
-- service role in /api/leads, so RLS denies every direct client request.
alter table public.leads enable row level security;
