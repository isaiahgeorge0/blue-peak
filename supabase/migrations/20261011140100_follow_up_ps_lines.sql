-- Adds a closing P.S. line to each follow-up template, only where the template
-- still matches its original seeded text, so wording edited in the admin is
-- never overwritten. The email layout places a final "P.S." paragraph after
-- the sign-off.
update public.follow_up_settings as s
set body = s.body || E'\n\n' || ps.line,
    updated_at = now()
from (values
  (
    'acknowledgement',
    $body$Hi {first_name},

Thanks for getting in touch about {service}. Your enquiry has come through to both of us, and one of us will be in touch.

Here's what happens next:

1. We read through what you've sent and tell you whether it's a job we can take on.
2. We visit the property, measure up, and send you a written price before any work is booked.
3. If you're happy, we agree a start date, protect the house, and stay on it until the job is finished.

If you'd like to talk it through in the meantime, call us on {phone} or reply to this email.$body$,
    'P.S. Every job starts on paper: a written price before any work is booked.'
  ),
  (
    'quote_chaser_1',
    $body$Hi {first_name},

We wanted to check that the quote for {service} reached you and that it all makes sense.

If anything is unclear, or you'd like to change what's included, reply to this email or call us on {phone} and we'll go through it with you.$body$,
    'P.S. You get photos, not surprises.'
  ),
  (
    'quote_chaser_2',
    $body$Hi {first_name},

We're getting in touch one last time about the quote for {service}.

If you'd like to go ahead, or talk anything through first, call us on {phone} or reply to this email. If you've decided not to, that's completely fine, and a quick reply to let us know is always appreciated.

We won't send any more reminders about this quote.$body$,
    'P.S. The same team runs your job from the first visit to the final tidy-up.'
  ),
  (
    'review_request',
    $body$Hi {first_name},

Thank you for having us. We hope you're happy with how everything turned out.

If you have a minute, a short Google review would mean a lot to us and helps other people find us.

{review_link}

And if anything isn't right, reply to this email or call us on {phone}.$body$,
    'P.S. From first call to final tidy-up, thank you for having us.'
  )
) as ps(step, seeded_body, line)
where s.step = ps.step
  and s.body = ps.seeded_body;
