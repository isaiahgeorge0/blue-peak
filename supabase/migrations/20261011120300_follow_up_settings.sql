-- One row per follow-up step: on/off, delay and the editable template.
-- Templates support {first_name}, {service} and {phone}; the review request
-- also supports {review_link}, shown as a button. Blank lines separate
-- paragraphs and lines starting "1. ", "2. " become a numbered list.
-- The sign-off ("Kyle and Steven, Blue Peak") and the stop link are added
-- by the app, not stored here.

create table if not exists public.follow_up_settings (
  step text primary key,
  enabled boolean not null default true,
  delay_amount integer not null,
  delay_unit text not null,
  subject text not null,
  body text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  constraint follow_up_settings_step_check
    check (step in ('acknowledgement', 'quote_chaser_1', 'quote_chaser_2', 'review_request')),
  constraint follow_up_settings_delay_check
    check (
      (delay_unit = 'hours' and delay_amount between 0 and 720)
      or (delay_unit = 'days' and delay_amount between 0 and 90)
    ),
  constraint follow_up_settings_lengths_check
    check (
      char_length(btrim(subject)) between 1 and 150
      and char_length(btrim(body)) between 1 and 4000
    )
);

alter table public.follow_up_settings enable row level security;

-- Rows are fixed (seeded below): admins read and edit them, never add or remove.
revoke all on table public.follow_up_settings from anon, authenticated;
grant select on table public.follow_up_settings to authenticated;
grant update (enabled, delay_amount, delay_unit, subject, body, updated_at, updated_by)
  on table public.follow_up_settings to authenticated;

drop policy if exists "Admins can select follow-up settings"
  on public.follow_up_settings;
create policy "Admins can select follow-up settings"
  on public.follow_up_settings
  for select
  to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can update follow-up settings"
  on public.follow_up_settings;
create policy "Admins can update follow-up settings"
  on public.follow_up_settings
  for update
  to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

insert into public.follow_up_settings (step, enabled, delay_amount, delay_unit, subject, body)
values
  (
    'acknowledgement', true, 0, 'hours',
    'Thanks for your enquiry, {first_name}',
    $body$Hi {first_name},

Thanks for getting in touch about {service}. Your enquiry has come through to both of us, and one of us will be in touch.

Here's what happens next:

1. We read through what you've sent and tell you whether it's a job we can take on.
2. We visit the property, measure up, and send you a written price before any work is booked.
3. If you're happy, we agree a start date, protect the house, and stay on it until the job is finished.

If you'd like to talk it through in the meantime, call us on {phone} or reply to this email.$body$
  ),
  (
    'quote_chaser_1', true, 3, 'days',
    'Your quote from Blue Peak',
    $body$Hi {first_name},

We wanted to check that the quote for {service} reached you and that it all makes sense.

If anything is unclear, or you'd like to change what's included, reply to this email or call us on {phone} and we'll go through it with you.$body$
  ),
  (
    'quote_chaser_2', true, 10, 'days',
    'Any questions about your quote?',
    $body$Hi {first_name},

We're getting in touch one last time about the quote for {service}.

If you'd like to go ahead, or talk anything through first, call us on {phone} or reply to this email. If you've decided not to, that's completely fine, and a quick reply to let us know is always appreciated.

We won't send any more reminders about this quote.$body$
  ),
  (
    'review_request', true, 3, 'days',
    'Thank you from Blue Peak',
    $body$Hi {first_name},

Thank you for having us. We hope you're happy with how everything turned out.

If you have a minute, a short Google review would mean a lot to us and helps other people find us.

{review_link}

And if anything isn't right, reply to this email or call us on {phone}.$body$
  )
on conflict (step) do nothing;
