import type { Metadata } from "next";
import { BrandMark } from "@/components/brand/brand-logo";
import { StopEmailsForm } from "@/app/stop-emails/stop-emails-form";
import { leadIdFromStopToken } from "@/lib/follow-ups";
import { sitePhoneDisplay, sitePhoneTel } from "@/lib/site";

export const metadata: Metadata = {
  title: "Stop follow-up emails",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/**
 * Opened from the link at the bottom of a follow-up email. Opening it changes
 * nothing (link scanners open links too); only the button pauses follow-ups.
 */
export default async function StopEmailsPage({ searchParams }: PageProps<"/stop-emails">) {
  const { t } = await searchParams;
  const token = typeof t === "string" ? t : "";
  const isExample = token === "example";
  const valid = !isExample && leadIdFromStopToken(token) !== null;

  return (
    <main className="flex flex-1 items-center justify-center px-5 py-16">
      <div className="w-full max-w-md text-center">
        <BrandMark title="Blue Peak" className="mx-auto h-12 w-auto text-brand" />
        <h1 className="mt-8 font-serif text-[2rem] leading-tight tracking-heading text-ink">Stop follow-up emails</h1>
        {valid ? (
          <StopEmailsForm token={token} />
        ) : (
          <p className="mt-4 text-base leading-relaxed text-ink/80">
            {isExample
              ? "This link came from a test email, so nothing has been changed."
              : "This link doesn't work. It may not have been copied in full."}{" "}
            To ask us to stop emailing you, reply to any of our emails or call us on{" "}
            <a href={`tel:${sitePhoneTel}`} className="font-bold whitespace-nowrap text-accent underline underline-offset-4">
              {sitePhoneDisplay}
            </a>
            .
          </p>
        )}
      </div>
    </main>
  );
}
