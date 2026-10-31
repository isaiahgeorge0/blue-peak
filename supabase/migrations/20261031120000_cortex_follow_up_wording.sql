-- Cortex rebrand: rename Blue Peak in subjects, switch the acknowledgement
-- from a two-person voice to Kyle alone, and refresh the review P.S. Only
-- rows that still match their seeded text (including the P.S. line from
-- 20261011140100_follow_up_ps_lines.sql) are updated, so wording edited in
-- the admin is left alone.
update public.follow_up_settings as s
set subject = v.new_subject,
    body = v.new_body,
    updated_at = now()
from (values
  (
    'acknowledgement',
    'Thanks for your enquiry, {first_name}',
    $body$Hi {first_name},

Thanks for getting in touch about {service}. Your enquiry has come through to both of us, and one of us will be in touch.

Here's what happens next:

1. We read through what you've sent and tell you whether it's a job we can take on.
2. We visit the property, measure up, and send you a written price before any work is booked.
3. If you're happy, we agree a start date, protect the house, and stay on it until the job is finished.

If you'd like to talk it through in the meantime, call us on {phone} or reply to this email.

P.S. Every job starts on paper: a written price before any work is booked.$body$,
    'Thanks for your enquiry, {first_name}',
    $body$Hi {first_name},

Thanks for getting in touch about {service}. Your enquiry has come through to Kyle, and he'll be in touch soon.

Here's what happens next:

1. We read through what you've sent and tell you whether it's a job we can take on.
2. We visit the property, measure up, and send you a written price before any work is booked.
3. If you're happy, we agree a start date, protect the house, and stay on it until the job is finished.

If you'd like to talk it through in the meantime, call us on {phone} or reply to this email.

P.S. Every job starts on paper: a written price before any work is booked.$body$
  ),
  (
    'quote_chaser_1',
    'Your quote from Blue Peak',
    $body$Hi {first_name},

We wanted to check that the quote for {service} reached you and that it all makes sense.

If anything is unclear, or you'd like to change what's included, reply to this email or call us on {phone} and we'll go through it with you.

P.S. You get photos, not surprises.$body$,
    'Your quote from Cortex',
    $body$Hi {first_name},

We wanted to check that the quote for {service} reached you and that it all makes sense.

If anything is unclear, or you'd like to change what's included, reply to this email or call us on {phone} and we'll go through it with you.

P.S. You get photos, not surprises.$body$
  ),
  (
    'review_request',
    'Thank you from Blue Peak',
    $body$Hi {first_name},

Thank you for having us. We hope you're happy with how everything turned out.

If you have a minute, a short Google review would mean a lot to us and helps other people find us.

{review_link}

And if anything isn't right, reply to this email or call us on {phone}.

P.S. From first call to final tidy-up, thank you for having us.$body$,
    'Thank you from Cortex',
    $body$Hi {first_name},

Thank you for having us. We hope you're happy with how everything turned out.

If you have a minute, a short Google review would mean a lot to us and helps other people find us.

{review_link}

And if anything isn't right, reply to this email or call us on {phone}.

P.S. We'd love to see how you settle in, so send us a photo any time.$body$
  )
) as v(step, old_subject, old_body, new_subject, new_body)
where s.step = v.step
  and s.subject = v.old_subject
  and s.body = v.old_body;
