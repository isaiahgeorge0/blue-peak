-- Hourly stalled-lead reminder trigger.
-- The Vercel Hobby plan only allows daily crons, so Supabase calls the app's
-- /api/cron/lead-reminders endpoint every hour instead. The endpoint decides
-- which leads are due (4h after arrival, then every 24h while still 'new').
--
-- Both values live in Vault, not in this file:
--   lead_reminders_url          https://<site>/api/cron/lead-reminders
--   lead_reminders_cron_secret  same value as CRON_SECRET in Vercel
-- To move domains, update the URL secret:
--   select vault.update_secret(
--     (select id from vault.secrets where name = 'lead_reminders_url'),
--     'https://new-domain/api/cron/lead-reminders');

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

select cron.unschedule('lead-reminders')
where exists (select 1 from cron.job where jobname = 'lead-reminders');

select cron.schedule(
  'lead-reminders',
  '5 * * * *',
  $job$
  select net.http_get(
    url := url_secret.decrypted_secret,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || token_secret.decrypted_secret
    ),
    timeout_milliseconds := 20000
  )
  from vault.decrypted_secrets as url_secret,
       vault.decrypted_secrets as token_secret
  where url_secret.name = 'lead_reminders_url'
    and token_secret.name = 'lead_reminders_cron_secret';
  $job$
);
