import type { Metadata } from "next";
import Link from "next/link";
import type { CalendarEventRow } from "@/app/admin/calendar/actions";
import { CountUp, CountUpDone } from "@/components/admin/count-up";
import {
  AlertMailIcon,
  ArrowRightIcon,
  CalendarIcon,
  ChartIllustration,
  ClockIcon,
  FollowUpsIcon,
  LevelIllustration,
  MailIcon,
  PhoneIcon,
  PlannerIllustration,
  RepeatIcon,
} from "@/components/admin/icons";
import { ArrowLink, Card, EmptyState, PageHeader, SectionHeading, secondaryButton } from "@/components/admin/ui";
import { LeadVolumeChart } from "@/components/lead-volume-chart";
import { requireAdminPage } from "@/lib/admin-auth";
import {
  CALENDAR_EVENT_SELECT,
  dayLabel,
  mailHref,
  SERVICE_NAMES,
  telHref,
  timeRange,
  upcomingOccurrences,
  upcomingRange,
} from "@/lib/admin-data";
import {
  firstNameFromClaims,
  greetingFor,
  leadSource,
  normalizeStatus,
  serviceLabel,
  STATUS_LABELS,
  TEST_LEAD_IDS,
  VOLUME_MIN_DAYS,
  waitedFor,
  weeklyVolume,
} from "@/lib/admin-leads";
import { recurrenceLabel } from "@/lib/calendar-recurrence";
import { followUpOverview } from "@/lib/follow-up-admin";
import { SPAM_STATUS, type LeadStatus } from "@/lib/lead-status";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const metadata: Metadata = {
  title: "Dashboard",
};

type LeadRow = {
  id: string;
  created_at: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  service_type: string | null;
  message: string | null;
  status: string | null;
  notified_at: string | null;
};

const PIPELINE: LeadStatus[] = ["new", "contacted", "quoted", "won"];
const CLOSED: LeadStatus[] = ["lost", "spam"];

function leadName(lead: Pick<LeadRow, "name">) {
  return lead.name?.trim() || "Unnamed lead";
}

function plural(count: number, one: string, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`;
}

export default async function AdminDashboardPage() {
  const { claims } = await requireAdminPage();
  const now = new Date();
  const range = upcomingRange(now);
  const supabase = await createSupabaseServerClient();

  // Service-role read bypasses RLS, so it must stay behind the admin check above.
  const [leadsResult, oneOffResult, recurringResult, followUps] = await Promise.all([
    getSupabaseAdmin()
      .from("leads")
      .select("id, created_at, name, phone, email, service_type, message, status, notified_at")
      .order("created_at", { ascending: true }),
    supabase
      .from("calendar_events")
      .select(CALENDAR_EVENT_SELECT)
      .eq("recurrence", "none")
      .gte("start_date", range.from)
      .lte("start_date", range.to)
      .order("start_date", { ascending: true })
      .order("start_time", { ascending: true }),
    supabase
      .from("calendar_events")
      .select(CALENDAR_EVENT_SELECT)
      .neq("recurrence", "none")
      .lte("start_date", range.to)
      .or(`recurrence_end_date.is.null,recurrence_end_date.gte.${range.from}`),
    followUpOverview(now).catch((error: Error) => {
      console.error("admin dashboard: failed to load follow-ups", error.message);
      return null;
    }),
  ]);

  if (leadsResult.error) console.error("admin dashboard: failed to load leads", leadsResult.error.message);
  const eventsError = oneOffResult.error ?? recurringResult.error;
  if (eventsError) console.error("admin dashboard: failed to load events", eventsError.message);

  // The two test leads never count on the dashboard.
  const leads = ((leadsResult.data ?? []) as LeadRow[]).filter((lead) => !TEST_LEAD_IDS.has(lead.id));
  const counts = Object.fromEntries(
    [...PIPELINE, ...CLOSED].map((status) => [status, leads.filter((lead) => normalizeStatus(lead.status) === status).length]),
  ) as Record<LeadStatus, number>;
  const waiting = leads.filter((lead) => normalizeStatus(lead.status) === "new");
  const unnotified = waiting.filter((lead) => !lead.notified_at);
  const realLeads = leads.filter((lead) => normalizeStatus(lead.status) !== SPAM_STATUS);
  const volume = weeklyVolume(
    realLeads.map((lead) => lead.created_at),
    now,
  );
  const chartFrom = realLeads[0]
    ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone: "Europe/London" }).format(
        new Date(new Date(realLeads[0].created_at).getTime() + VOLUME_MIN_DAYS * 86_400_000),
      )
    : null;
  const upcoming = upcomingOccurrences(
    [...((oneOffResult.data ?? []) as CalendarEventRow[]), ...((recurringResult.data ?? []) as CalendarEventRow[])],
    now,
  );

  const firstName = firstNameFromClaims(claims);
  const greeting = firstName ? `${greetingFor(now)}, ${firstName}` : greetingFor(now);
  const today = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);

  return (
    <div className="space-y-8 md:space-y-10">
      <PageHeader
        eyebrow={today}
        title={greeting}
        lede={
          leadsResult.error
            ? null
            : waiting.length === 0
              ? "Nothing is waiting for a reply."
              : `${plural(waiting.length, "lead")} ${waiting.length === 1 ? "is" : "are"} waiting for a reply.`
        }
      />

      {leadsResult.error ? (
        <Card className="px-5 py-4 text-sm">Leads couldn&apos;t be loaded just now. Refresh the page to try again.</Card>
      ) : null}

      {unnotified.length > 0 ? (
        <section
          aria-labelledby="unnotified-heading"
          className="flex gap-4 rounded-xl border border-ridge-cyan/60 bg-brand/25 px-5 py-5"
        >
          <AlertMailIcon className="mt-0.5 size-6 shrink-0 text-ridge-cyan" />
          <div className="min-w-0">
            <h2 id="unnotified-heading" className="text-base font-bold text-ink">
              {unnotified.length === 1 ? "An email alert didn't send" : `${unnotified.length} email alerts didn't send`}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-ink/85">
              {unnotified.length === 1 ? "A new lead arrived" : "These leads arrived"} but the email telling you about{" "}
              {unnotified.length === 1 ? "it" : "them"} failed, so {unnotified.length === 1 ? "it" : "they"} may not have
              been seen. Open each one and get in touch, then change its status. This notice stays until none are left at
              New.
            </p>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
              {unnotified.map((lead) => (
                <li key={lead.id}>
                  <ArrowLink href={`/admin/leads/${lead.id}`}>{leadName(lead)}</ArrowLink>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <div className="grid gap-8 md:gap-10 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] xl:gap-6">
        <section aria-labelledby="reply-heading">
          <SectionHeading
            id="reply-heading"
            action={waiting.length > 0 ? <ArrowLink href="/admin/leads?status=new">All new leads</ArrowLink> : null}
          >
            Needs a reply
          </SectionHeading>
          <Card className="mt-4">
            {waiting.length === 0 ? (
              <EmptyState illustration={<LevelIllustration />} title="You're all caught up.">
                New leads appear here, oldest first, until their status changes.
              </EmptyState>
            ) : (
              <ul className="divide-y divide-admin-line">
                {waiting.map((lead) => {
                  const call = telHref(lead.phone);
                  const email = mailHref(lead.email);
                  return (
                    <li key={lead.id} className="px-5 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                        <Link
                          href={`/admin/leads/${lead.id}`}
                          className="group min-w-0 rounded-sm text-base font-bold text-ink hover:text-ridge-cyan"
                        >
                          <span className="break-words underline-offset-4 group-hover:underline">{leadName(lead)}</span>
                        </Link>
                        <span className="inline-flex items-center gap-1.5 text-sm text-ink/80">
                          <ClockIcon className="size-4 text-peak-fleet" />
                          <span>
                            <span className="sr-only">Waiting </span>
                            {waitedFor(lead.created_at, now)}
                          </span>
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-ink/80">
                        {serviceLabel(lead.service_type, lead.message, SERVICE_NAMES)}
                        <span aria-hidden className="px-1.5 text-ink/60">
                          ·
                        </span>
                        {leadSource(lead.service_type)}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {call ? (
                          <a href={call} className={`${secondaryButton} min-w-0 flex-1 sm:flex-none`} aria-label={`Call ${leadName(lead)}`}>
                            <PhoneIcon className="size-4" />
                            Call
                          </a>
                        ) : null}
                        {email ? (
                          <a href={email} className={`${secondaryButton} min-w-0 flex-1 sm:flex-none`} aria-label={`Email ${leadName(lead)}`}>
                            <MailIcon className="size-4" />
                            Email
                          </a>
                        ) : null}
                        <Link
                          href={`/admin/leads/${lead.id}`}
                          className={`${secondaryButton} min-w-0 flex-1 border-transparent sm:flex-none`}
                          aria-label={`Open ${leadName(lead)}`}
                        >
                          Open
                          <ArrowRightIcon className="size-4" />
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </section>

        <section aria-labelledby="upcoming-heading">
          <SectionHeading id="upcoming-heading" action={<ArrowLink href="/admin/calendar">Calendar</ArrowLink>}>
            Coming up
          </SectionHeading>
          <Card className="mt-4">
            {eventsError ? (
              <p className="px-5 py-4 text-sm">The calendar couldn&apos;t be loaded just now.</p>
            ) : upcoming.length === 0 ? (
              <EmptyState illustration={<PlannerIllustration />} title="Nothing booked.">
                Site visits and other events you add to the calendar show here.
              </EmptyState>
            ) : (
              <ol className="divide-y divide-admin-line">
                {upcoming.map(({ event, occurrenceDate, isRecurring }) => (
                  <li key={`${event.id}-${occurrenceDate}`} className="flex gap-4 px-5 py-4">
                    <CalendarIcon className="mt-0.5 size-5 shrink-0 text-peak-fleet" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-ink">
                        {dayLabel(occurrenceDate, now)}
                        <span className="font-normal text-ink/80"> · {timeRange(event.start_time, event.end_time)}</span>
                      </p>
                      <p className="mt-0.5 break-words text-[0.9375rem] text-ink">{event.title}</p>
                      {isRecurring ? (
                        <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-ink/80">
                          <RepeatIcon className="size-3.5" />
                          {recurrenceLabel(event.recurrence)}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </section>
      </div>

      <section aria-labelledby="follow-ups-heading">
        <SectionHeading id="follow-ups-heading" action={<ArrowLink href="/admin/follow-ups">Settings</ArrowLink>}>
          Follow-ups
        </SectionHeading>
        <Card className="mt-4">
          {followUps ? (
            <>
              <dl className="grid grid-cols-3 divide-x divide-admin-line">
                {[
                  { label: "Sending today", value: followUps.sendingToday },
                  { label: "Next 7 days", value: followUps.nextSevenDays },
                  { label: "Failed", value: followUps.failures.length },
                ].map((figure) => (
                  <div key={figure.label} className="flex flex-col gap-1 px-4 py-4 sm:px-5">
                    <dt className="text-xs font-bold tracking-[0.14em] text-peak-fleet uppercase">{figure.label}</dt>
                    <dd
                      className={`font-serif text-[2rem] leading-none ${
                        figure.label === "Failed" && figure.value > 0 ? "text-ridge-cyan" : "text-ink"
                      }`}
                    >
                      <CountUp value={figure.value} />
                    </dd>
                  </div>
                ))}
              </dl>
              {followUps.globallyOff ? (
                <p className="flex items-start gap-2 border-t border-admin-line px-5 py-4 text-sm text-ink/80">
                  <FollowUpsIcon className="mt-0.5 size-4 shrink-0 text-peak-fleet" />
                  Follow-ups are off, so nothing is being sent. Anything due is logged as skipped.
                </p>
              ) : null}
              {followUps.failures.length > 0 ? (
                <ul className="divide-y divide-admin-line border-t border-admin-line">
                  {followUps.failures.slice(0, 5).map((failure) => (
                    <li key={failure.id} className="flex gap-4 px-5 py-4">
                      <AlertMailIcon className="mt-0.5 size-5 shrink-0 text-ridge-cyan" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-ink">
                          {failure.step} to{" "}
                          <Link href={`/admin/leads/${failure.leadId}`} className="rounded-sm text-peak-fleet underline-offset-4 hover:text-ridge-cyan hover:underline">
                            {failure.leadName}
                          </Link>{" "}
                          didn&apos;t send
                        </p>
                        <p className="mt-0.5 text-sm break-words text-ink/80">
                          {failure.when}
                          {failure.error ? ` · ${failure.error}` : ""}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          ) : (
            <p className="px-5 py-4 text-sm">Follow-ups couldn&apos;t be loaded just now.</p>
          )}
        </Card>
      </section>

      <section aria-labelledby="pipeline-heading">
        <SectionHeading id="pipeline-heading">Pipeline</SectionHeading>
        <div className="mt-4 flex flex-col gap-3 lg:flex-row">
          <ol className="grid flex-1 grid-cols-2 overflow-hidden rounded-xl border border-admin-line bg-admin-surface sm:grid-cols-4">
            {PIPELINE.map((status, index) => (
              <li key={status} className="border-admin-line max-sm:odd:border-r max-sm:[&:nth-child(-n+2)]:border-b sm:border-l sm:first:border-l-0">
                <Link
                  href={`/admin/leads?status=${status}`}
                  className="group flex h-full flex-col gap-1 px-5 py-4 transition-colors hover:bg-admin-raised"
                >
                  <span className="flex items-center gap-1.5 text-xs font-bold tracking-[0.14em] text-peak-fleet uppercase">
                    {STATUS_LABELS[status]}
                    {index < PIPELINE.length - 1 ? (
                      <ArrowRightIcon className="size-3.5 text-ink/60 max-sm:hidden" />
                    ) : null}
                  </span>
                  <span className="font-serif text-[2rem] leading-none text-ink group-hover:text-ridge-cyan">
                    <CountUp value={counts[status]} />
                    <span className="sr-only"> {counts[status] === 1 ? "lead" : "leads"}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
          <ul className="flex gap-3 lg:w-40 lg:flex-col">
            {CLOSED.map((status) => (
              <li key={status} className="flex-1">
                <Link
                  href={`/admin/leads?status=${status}`}
                  className="flex h-full min-h-11 items-center justify-between gap-3 rounded-xl border border-admin-line px-4 py-2 text-sm text-ink/80 transition-colors hover:bg-admin-raised hover:text-ink"
                >
                  {STATUS_LABELS[status]}
                  <span className="font-bold text-ink tabular-nums">
                    <CountUp value={counts[status]} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="volume-heading">
        <SectionHeading id="volume-heading">Lead volume</SectionHeading>
        <Card className="mt-4">
          {volume ? (
            <div className="px-3 pt-5 pb-3 sm:px-5">
              <p className="px-2 text-sm text-ink/80 sm:px-0">Leads per week, spam left out.</p>
              <LeadVolumeChart data={volume} />
            </div>
          ) : (
            <EmptyState illustration={<ChartIllustration />} title="Not enough weeks yet.">
              {chartFrom
                ? `The chart needs four weeks of leads to be useful. It appears here from ${chartFrom}.`
                : "The chart appears four weeks after the first lead arrives."}
            </EmptyState>
          )}
        </Card>
      </section>

      <CountUpDone />
    </div>
  );
}
