import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, CalendarIcon, MailIcon, PhoneIcon } from "@/components/admin/icons";
import { FollowUpControls } from "@/components/admin/follow-up-controls";
import { LeadActivity, ScheduleVisitButton, type TimelineItem } from "@/components/admin/lead-detail";
import { StatusControl } from "@/components/admin/status";
import { ArrowLink, Card, SectionHeading, primaryButton, secondaryButton, textLink } from "@/components/admin/ui";
import { leadFollowUpView } from "@/lib/follow-up-admin";
import { requireAdminPage } from "@/lib/admin-auth";
import { dayLabel, mailHref, SERVICE_NAMES, telHref, timeRange, ukStamp } from "@/lib/admin-data";
import { estimatorDetails, leadSource, serviceLabel } from "@/lib/admin-leads";
import { ESTIMATOR_SERVICE_TYPE } from "@/lib/lead-limits";
import { buildSiteVisitNotes, todayDateKeyForPrefill } from "@/lib/lead-visits";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const metadata: Metadata = {
  title: "Lead",
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Lead = {
  id: string;
  created_at: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  postcode: string | null;
  service_type: string | null;
  message: string | null;
  status: string | null;
  notified_at: string | null;
  follow_ups_paused: boolean;
  completed_at: string | null;
};

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-3 first:pt-0 last:pb-0 sm:grid sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
      <dt className="text-sm text-ink/80">{label}</dt>
      <dd className="mt-0.5 text-[0.9375rem] break-words text-ink sm:mt-0">{children}</dd>
    </div>
  );
}

export default async function AdminLeadPage({ params }: PageProps<"/admin/leads/[id]">) {
  await requireAdminPage();
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) notFound();

  // Service role read bypasses RLS, so it must stay behind the admin check.
  const admin = getSupabaseAdmin();
  const [{ data: lead, error }, { data: notes }, { data: visits }] = await Promise.all([
    admin
      .from("leads")
      .select("id, created_at, name, phone, email, postcode, service_type, message, status, notified_at, follow_ups_paused, completed_at")
      .eq("id", id)
      .maybeSingle<Lead>(),
    admin.from("lead_notes").select("id, note, created_at").eq("lead_id", id).order("created_at", { ascending: false }),
    admin
      .from("calendar_events")
      .select("id, title, start_date, start_time, end_time")
      .eq("lead_id", id)
      .order("start_date", { ascending: true })
      .order("start_time", { ascending: true }),
  ]);

  if (error) console.error("admin lead: failed to load", error.message);
  if (!lead) notFound();

  const name = lead.name?.trim() || "Unnamed lead";
  const call = telHref(lead.phone);
  const email = mailHref(lead.email);
  const source = leadSource(lead.service_type);
  const details = lead.service_type === ESTIMATOR_SERVICE_TYPE ? estimatorDetails(lead.message) : null;
  const now = new Date();
  const followUps = await leadFollowUpView(
    {
      id: lead.id,
      created_at: lead.created_at,
      name: lead.name,
      email: lead.email,
      status: lead.status,
      service_type: lead.service_type,
      follow_ups_paused: Boolean(lead.follow_ups_paused),
      completed_at: lead.completed_at,
    },
    now,
  );

  const timeline: TimelineItem[] = [
    { id: "arrived", kind: "arrived", at: lead.created_at, when: ukStamp(lead.created_at), title: `Arrived from the ${source.toLowerCase()}` },
    ...(lead.notified_at
      ? [{ id: "alert", kind: "alert" as const, at: lead.notified_at, when: ukStamp(lead.notified_at), title: "Email alert sent" }]
      : []),
    ...(notes ?? []).map((note) => ({
      id: note.id,
      kind: "note" as const,
      at: note.created_at,
      when: ukStamp(note.created_at),
      title: "Note",
      body: note.note,
    })),
    ...followUps.entries,
  ];

  return (
    <div className="space-y-8 md:space-y-10">
      <header>
        <Link href="/admin/leads" className={`${textLink} inline-flex min-h-11 items-center gap-1.5`}>
          <ArrowLeftIcon className="size-4" />
          All leads
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
          <div className="min-w-0">
            <h1 className="font-serif text-[2rem] leading-tight tracking-heading break-words text-ink sm:text-[2.5rem]">{name}</h1>
            <p className="mt-2 text-[0.9375rem] text-ink/80">
              {serviceLabel(lead.service_type, lead.message, SERVICE_NAMES)} · {source} · Received {ukStamp(lead.created_at)}
            </p>
          </div>
          <StatusControl leadId={lead.id} leadName={name} initialStatus={lead.status} size="md" />
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {call ? (
            <a href={call} className={`${primaryButton} flex-1 sm:flex-none`}>
              <PhoneIcon className="size-4" />
              Call
            </a>
          ) : null}
          {email ? (
            <a href={email} className={`${call ? secondaryButton : primaryButton} flex-1 sm:flex-none`}>
              <MailIcon className="size-4" />
              Email
            </a>
          ) : null}
          <ScheduleVisitButton
            prefill={{
              start_date: todayDateKeyForPrefill(),
              title: `Site visit: ${name}`,
              notes: buildSiteVisitNotes({ phone: lead.phone, postcode: lead.postcode }),
              lead_id: lead.id,
            }}
          />
        </div>
      </header>

      <div className="grid gap-8 md:gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:gap-6">
        <div className="space-y-8 md:space-y-10">
          <section aria-labelledby="contact-heading">
            <SectionHeading id="contact-heading">Contact details</SectionHeading>
            <Card className="mt-4 px-5 py-5">
              <dl className="divide-y divide-admin-line">
                <Detail label="Phone">
                  {call ? (
                    <a href={call} className={textLink}>
                      {lead.phone}
                    </a>
                  ) : (
                    "Not given"
                  )}
                </Detail>
                <Detail label="Email">
                  {email ? (
                    <a href={email} className={`${textLink} break-all`}>
                      {lead.email}
                    </a>
                  ) : (
                    "Not given"
                  )}
                </Detail>
                <Detail label="Postcode">{lead.postcode?.trim() || "Not given"}</Detail>
                <Detail label="Came from">{source}</Detail>
              </dl>
            </Card>
          </section>

          <section aria-labelledby="request-heading">
            <SectionHeading id="request-heading">{details ? "Estimator selections" : "Message"}</SectionHeading>
            <Card className="mt-4 px-5 py-5">
              {details ? (
                <dl className="divide-y divide-admin-line">
                  {details.map((detail) => (
                    <Detail key={detail.label} label={detail.label}>
                      {detail.value}
                    </Detail>
                  ))}
                </dl>
              ) : lead.message?.trim() ? (
                <p className="text-[0.9375rem] leading-relaxed break-words whitespace-pre-wrap text-ink">{lead.message.trim()}</p>
              ) : (
                <p className="text-sm text-ink/80">No message was left.</p>
              )}
            </Card>
          </section>

          <section aria-labelledby="visits-heading">
            <SectionHeading id="visits-heading">Site visits</SectionHeading>
            <Card className="mt-4">
              {visits && visits.length > 0 ? (
                <ul className="divide-y divide-admin-line">
                  {visits.map((visit) => (
                    <li key={visit.id} className="flex gap-4 px-5 py-4">
                      <CalendarIcon className="mt-0.5 size-5 shrink-0 text-peak-fleet" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-ink">
                          {dayLabel(visit.start_date, now)}
                          <span className="font-normal text-ink/80"> · {timeRange(visit.start_time, visit.end_time)}</span>
                        </p>
                        <p className="mt-0.5 break-words text-[0.9375rem] text-ink">{visit.title}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-5 py-4 text-sm text-ink/80">No visits booked for this lead.</p>
              )}
            </Card>
          </section>
        </div>

        <div className="space-y-8 md:space-y-10">
          <section aria-labelledby="follow-ups-heading">
            <SectionHeading id="follow-ups-heading" action={<ArrowLink href="/admin/follow-ups">Settings</ArrowLink>}>
              Follow-ups
            </SectionHeading>
            <Card className="mt-4 px-5 py-5">
              <FollowUpControls
                leadId={lead.id}
                leadName={name}
                blockedReason={followUps.blockedReason}
                paused={Boolean(lead.follow_ups_paused)}
                isWon={lead.status === "won"}
                completedAt={lead.completed_at ? ukStamp(lead.completed_at) : null}
                next={followUps.next}
                globallyOff={followUps.globallyOff}
              />
            </Card>
          </section>

          <section aria-labelledby="activity-heading">
            <SectionHeading id="activity-heading">Activity</SectionHeading>
            <Card className="mt-4 px-5 py-5">
              <LeadActivity leadId={lead.id} items={timeline} />
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
