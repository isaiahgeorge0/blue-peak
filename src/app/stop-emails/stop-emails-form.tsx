"use client";

import { useActionState } from "react";
import { stopFollowUpEmails, type StopEmailsState } from "@/app/stop-emails/actions";
import { primaryCtaClassName } from "@/components/cta-styles";
import { sitePhoneDisplay, sitePhoneTel } from "@/lib/site";

export function StopEmailsForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<StopEmailsState, FormData>(stopFollowUpEmails, { status: "idle" });

  if (state.status === "stopped") {
    return (
      <div role="status">
        <p className="mt-4 text-base leading-relaxed text-ink/80">
          Done. We won&apos;t send you any more follow-up emails. If you&apos;d like to talk to us, call{" "}
          <a href={`tel:${sitePhoneTel}`} className="font-bold whitespace-nowrap text-accent underline underline-offset-4">
            {sitePhoneDisplay}
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form action={action}>
      <p className="mt-4 text-base leading-relaxed text-ink/80">
        Press the button and we won&apos;t send you any more follow-up emails about your enquiry.
      </p>
      <input type="hidden" name="t" value={token} />
      <button type="submit" disabled={pending} className={`${primaryCtaClassName} mt-8 min-h-11 disabled:opacity-60`}>
        <span className="cta-label">{pending ? "Stopping…" : "Stop these emails"}</span>
      </button>
      {state.status === "invalid" || state.status === "error" ? (
        <p role="alert" className="mt-4 text-sm font-bold text-ink">
          {state.status === "invalid"
            ? "This link doesn't work any more."
            : "That didn't work just now. Please try again, or reply to any of our emails."}
        </p>
      ) : null}
    </form>
  );
}
