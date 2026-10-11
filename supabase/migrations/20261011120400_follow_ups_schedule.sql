-- Follow-up email runner, every 5 minutes so the acknowledgement goes out
-- within minutes of an enquiry. Same pattern as 'lead-reminders': Supabase
-- calls the app's /api/cron/follow-ups endpoint with the shared cron secret.
-- The endpoint decides what is due, applies the sending window
-- (08:00-19:00 UK time, Monday to Saturday) and records every send in
-- follow_up_sends, so extra or overlapping runs are harmless.
--
-- The job does nothing until the URL secret exists. Add it at launch:
--   select vault.create_secret(
--     'https://<site>/api/cron/follow-ups', 'follow_ups_url');
-- The bearer token reuses lead_reminders_cron_secret (CRON_SECRET in Vercel).

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

select cron.unschedule('follow-ups')
where exists (select 1 from cron.job where jobname = 'follow-ups');

select cron.schedule(
  'follow-ups',
  '*/5 * * * *',
  $job$
  select net.http_get(
    url := url_secret.decrypted_secret,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || token_secret.decrypted_secret
    ),
    timeout_milliseconds := 30000
  )
  from vault.decrypted_secrets as url_secret,
       vault.decrypted_secrets as token_secret
  where url_secret.name = 'follow_ups_url'
    and token_secret.name = 'lead_reminders_cron_secret';
  $job$
);
