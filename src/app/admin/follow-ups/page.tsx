import type { Metadata } from "next";
import { AlertMailIcon, ChevronDownIcon, FollowUpsIcon } from "@/components/admin/icons";
import { FollowUpEditor } from "@/components/admin/follow-up-editor";
import { Card, PageHeader, SectionHeading } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/admin-auth";
import { FOLLOW_UP_STEPS, readFollowUpConfig, type FollowUpSetting } from "@/lib/follow-up-schedule";
import { linkSecretStatus, MIN_LINK_SECRET_LENGTH, missingSendSettings, testSendBlockers } from "@/lib/follow-ups";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const metadata: Metadata = {
  title: "Follow-ups",
};

function SetupRow({ label, name, children }: { label: string; name: string; children: React.ReactNode }) {
  return (
    <div className="py-3 first:pt-0 last:pb-0 sm:grid sm:grid-cols-[13rem_minmax(0,1fr)] sm:gap-4">
      <dt className="text-sm text-ink/80">
        {label}
        <span className="block text-xs text-ink/80">{name}</span>
      </dt>
      <dd className="mt-0.5 text-[0.9375rem] break-words text-ink sm:mt-0">{children}</dd>
    </div>
  );
}

export default async function FollowUpsPage() {
  const { claims } = await requireAdminPage();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("follow_up_settings").select("step, enabled, delay_amount, delay_unit, subject, body");
  if (error) console.error("admin follow-ups: failed to load settings", error.message);
  const rows = (data ?? []) as FollowUpSetting[];
  const settings = FOLLOW_UP_STEPS.map((step) => rows.find((row) => row.step === step)).filter((row): row is FollowUpSetting => Boolean(row));

  const config = readFollowUpConfig(process.env);
  const missing = missingSendSettings();
  const linkSecret = linkSecretStatus();
  const adminEmail = typeof claims.email === "string" ? claims.email : "";

  return (
    <div className="space-y-8 md:space-y-10">
      <PageHeader
        eyebrow="Automatic emails"
        title="Follow-ups"
        lede="Emails sent for you after someone enquires, after they're quoted and after their job is finished, signed from Kyle and Steven. Replies come straight to you."
      />

      {!config.enabled ? (
        <section aria-labelledby="off-heading" className="flex gap-4 rounded-xl border border-ridge-cyan/60 bg-brand/25 px-5 py-5">
          <AlertMailIcon className="mt-0.5 size-6 shrink-0 text-ridge-cyan" />
          <div className="min-w-0">
            <h2 id="off-heading" className="font-sans text-base font-bold text-ink">
              Follow-ups aren&apos;t switched on yet.
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-ink/85">You can still edit the emails and send yourself a test.</p>
          </div>
        </section>
      ) : null}

      {config.enabled && missing.length > 0 ? (
        <section aria-labelledby="blocked-heading" className="flex gap-4 rounded-xl border border-ridge-cyan/60 bg-brand/25 px-5 py-5">
          <AlertMailIcon className="mt-0.5 size-6 shrink-0 text-ridge-cyan" />
          <div className="min-w-0">
            <h2 id="blocked-heading" className="font-sans text-base font-bold text-ink">
              Follow-ups are switched on but can&apos;t send yet.
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-ink/85">Ask your web developer to finish the setup.</p>
          </div>
        </section>
      ) : null}

      {config.testRecipient ? (
        <section aria-labelledby="test-heading" className="flex gap-4 rounded-xl border border-admin-edge bg-admin-surface px-5 py-5">
          <FollowUpsIcon className="mt-0.5 size-6 shrink-0 text-peak-fleet" />
          <div className="min-w-0">
            <h2 id="test-heading" className="font-sans text-base font-bold text-ink">
              Test mode
            </h2>
            <p className="mt-1 text-sm leading-relaxed break-words text-ink/85">
              Every follow-up goes to {config.testRecipient} instead of the customer, with the customer&apos;s address shown at the top.
            </p>
          </div>
        </section>
      ) : null}

      <section aria-labelledby="emails-heading">
        <SectionHeading id="emails-heading">Emails</SectionHeading>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink/80">
          Who gets them: leads with an email address that aren&apos;t spam or paused. Pause a lead from its page, or the customer can stop
          them with the link at the bottom of every email.
        </p>
        <div className="mt-4">
          {error || settings.length === 0 ? (
            <Card className="px-5 py-4 text-sm">The follow-up emails couldn&apos;t be loaded just now. Refresh the page to try again.</Card>
          ) : (
            <FollowUpEditor
              settings={settings}
              reviewUrl={config.reviewUrl}
              adminEmail={adminEmail}
              testBlockers={testSendBlockers(missing)}
              followUpsOn={config.enabled}
            />
          )}
        </div>
      </section>

      <details className="group rounded-xl border border-admin-line bg-admin-surface">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-5 py-4 transition-colors hover:bg-admin-raised/60 [&::-webkit-details-marker]:hidden">
          <h2 className="font-serif text-[1.375rem] leading-tight tracking-heading text-ink">Technical setup (for your web developer)</h2>
          <ChevronDownIcon className="size-5 shrink-0 text-peak-fleet transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none" />
        </summary>
        <div className="border-t border-admin-line px-5 py-5">
          {config.enabled && missing.length > 0 ? (
            <p className="mb-4 text-sm leading-relaxed text-ink/85">
              Nothing is sent until {new Intl.ListFormat("en-GB").format(missing)} {missing.length === 1 ? "is" : "are"} set
              {missing.includes("FOLLOW_UP_LINK_SECRET") && linkSecret === "too-short"
                ? ` (FOLLOW_UP_LINK_SECRET must be at least ${MIN_LINK_SECRET_LENGTH} characters)`
                : ""}
              . Due emails wait and go out once it&apos;s fixed, unless they&apos;re too late by then (more than a day for
              acknowledgements, 3 days for the rest).
            </p>
          ) : null}
          {!config.enabled ? (
            <p className="mb-4 text-sm leading-relaxed text-ink/85">
              Sending starts when FOLLOW_UPS_ENABLED is true. Anything that falls due before then is logged as skipped and isn&apos;t
              sent later.
            </p>
          ) : null}
          <dl className="divide-y divide-admin-line">
            <SetupRow label="Sending" name="FOLLOW_UPS_ENABLED">
              {config.enabled ? "On" : "Off"}
            </SetupRow>
            <SetupRow label="Sent from" name="FOLLOW_UP_FROM">
              {config.from ?? "Not set, so nothing can be sent"}
            </SetupRow>
            <SetupRow label="Replies go to" name="FOLLOW_UP_REPLY_TO">
              {config.replyTo ?? "Not set, so nothing can be sent"}
            </SetupRow>
            <SetupRow label="Stop-link secret" name="FOLLOW_UP_LINK_SECRET">
              {linkSecret === "set"
                ? "Set"
                : linkSecret === "too-short"
                  ? `Too short: it needs at least ${MIN_LINK_SECRET_LENGTH} characters, so nothing can be sent`
                  : "Not set, so nothing can be sent"}
            </SetupRow>
            <SetupRow label="Google review link" name="GOOGLE_REVIEW_URL">
              {config.reviewUrl ? (
                <span className="break-all">{config.reviewUrl}</span>
              ) : (
                "Not set, so review requests are skipped"
              )}
            </SetupRow>
            <SetupRow label="Test address" name="FOLLOW_UP_TEST_RECIPIENT">
              {config.testRecipient ?? "Not set (emails go to customers once sending is on)"}
            </SetupRow>
          </dl>
        </div>
      </details>
    </div>
  );
}
