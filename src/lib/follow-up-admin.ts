import "server-only";
import { STATUS_LABELS, normalizeStatus } from "@/lib/admin-leads";
import { ukStamp } from "@/lib/admin-data";
import {
  isTestLead,
  leadExclusion,
  MAX_ATTEMPTS,
  planLead,
  readFollowUpConfig,
  skipReason,
  STEP_LABELS,
  ukDayBounds,
  UNKNOWN_OUTCOME,
  type FollowUpLead,
  type FollowUpSendRow,
  type FollowUpSetting,
  type PlanItem,
} from "@/lib/follow-up-schedule";
import { loadFollowUpSettings, loadFollowUpState, SEND_SELECT } from "@/lib/follow-ups";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

/** Timeline entries, matching TimelineItem in components/admin/lead-detail. */
export type ActivityEntry = {
  id: string;
  kind: "status" | "complete" | "sent" | "scheduled" | "skipped" | "failed";
  at: string;
  when: string;
  title: string;
  body?: string;
};

type LeadForFollowUps = Omit<FollowUpLead, "quoted_at">;

/** A short, plain explanation of why this lead never gets follow-ups, or null. */
function blockedReason(lead: LeadForFollowUps, testRecipient: string | null) {
  switch (leadExclusion({ ...lead, follow_ups_paused: false }, { testRecipient })) {
    case "no-email":
      return "No email address, so this lead gets no follow-up emails.";
    case "spam":
      return "Spam leads get no follow-up emails.";
    case "test-lead":
      return "Test lead: follow-ups only run for it while FOLLOW_UP_TEST_RECIPIENT is set.";
    default:
      return null;
  }
}

function sentTo(row: FollowUpSendRow, leadEmail: string | null) {
  if (!row.recipient) return undefined;
  const intended = leadEmail?.trim();
  return intended && row.recipient !== intended ? `To the test address ${row.recipient}, in place of ${intended}.` : `To ${row.recipient}.`;
}

function sendEntry(row: FollowUpSendRow, leadEmail: string | null): ActivityEntry {
  const label = STEP_LABELS[row.step];
  const base = { id: `send-${row.id}` };
  switch (row.status) {
    case "sent": {
      const at = row.sent_at ?? row.updated_at;
      return { ...base, kind: "sent", at, when: ukStamp(at), title: `${label} sent`, body: sentTo(row, leadEmail) };
    }
    case "skipped":
      return { ...base, kind: "skipped", at: row.created_at, when: ukStamp(row.created_at), title: `${label} skipped`, body: row.error ?? undefined };
    case "sending":
      return { ...base, kind: "scheduled", at: row.updated_at, when: ukStamp(row.updated_at), title: `${label} sending` };
    case "failed": {
      const retry = row.attempts < MAX_ATTEMPTS && row.error !== UNKNOWN_OUTCOME;
      return {
        ...base,
        kind: "failed",
        at: row.updated_at,
        when: ukStamp(row.updated_at),
        title: `${label} failed`,
        body: [row.error, retry ? "It will be tried again on the next run." : "It won't be retried."].filter(Boolean).join(" "),
      };
    }
  }
}

function planEntry(item: PlanItem, setting: FollowUpSetting | undefined, config: ReturnType<typeof readFollowUpConfig>, now: Date): ActivityEntry | null {
  const label = STEP_LABELS[item.step];
  if (item.kind === "scheduled") {
    const later = setting ? skipReason(item.step, setting, config, item.at, item.at) : null;
    return {
      id: `plan-${item.step}`,
      kind: "scheduled",
      at: item.at.toISOString(),
      when: ukStamp(item.at.toISOString()),
      title: `${label} scheduled`,
      body: later ? `It will be logged as skipped: ${later.charAt(0).toLowerCase()}${later.slice(1)}.` : undefined,
    };
  }
  const at = now.toISOString();
  if (item.kind === "skip") {
    return { id: `plan-${item.step}`, kind: "skipped", at, when: ukStamp(at), title: `${label} due, will be skipped`, body: item.reason };
  }
  return { id: `plan-${item.step}`, kind: "scheduled", at, when: ukStamp(at), title: `${label} due`, body: "It goes out on the next run, within 5 minutes." };
}

export type FollowUpFailure = { id: string; leadId: string; leadName: string; step: string; error: string | null; when: string };

export type FollowUpOverview = {
  sendingToday: number;
  nextSevenDays: number;
  failures: FollowUpFailure[];
  globallyOff: boolean;
};

/** Dashboard figures. The two test leads are left out, as everywhere on the dashboard. */
export async function followUpOverview(now: Date): Promise<FollowUpOverview> {
  const admin = getSupabaseAdmin();
  const config = readFollowUpConfig(process.env);
  const { start, end } = ukDayBounds(now);
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [state, sentResult, failedResult] = await Promise.all([
    loadFollowUpState({ now }),
    admin.from("follow_up_sends").select("lead_id").eq("status", "sent").gte("sent_at", start.toISOString()),
    admin
      .from("follow_up_sends")
      .select("id, lead_id, step, error, updated_at, leads(name)")
      .eq("status", "failed")
      .order("updated_at", { ascending: false })
      .limit(20),
  ]);
  if (sentResult.error) console.error("dashboard: follow-up sends failed", sentResult.error.message);
  if (failedResult.error) console.error("dashboard: follow-up failures failed", failedResult.error.message);

  // Only what will really go out: due now, or coming up and not going to be skipped.
  const willSend = state.leads
    .filter((lead) => !isTestLead(lead.id))
    .flatMap((lead) => planLead(lead, state.settings, state.sends, config, now))
    .flatMap((item) => {
      if (item.kind === "send") return [now];
      if (item.kind !== "scheduled") return [];
      const setting = state.settings.find((candidate) => candidate.step === item.step);
      return setting && !skipReason(item.step, setting, config, item.at, item.at) ? [item.at] : [];
    });

  const sentToday = (sentResult.data ?? []).filter((row) => !isTestLead(row.lead_id)).length;
  type FailedRow = { id: string; lead_id: string; step: FollowUpSendRow["step"]; error: string | null; updated_at: string; leads: { name: string | null } | null };
  const failures = ((failedResult.data ?? []) as unknown as FailedRow[])
    .filter((row) => !isTestLead(row.lead_id))
    .map((row) => ({
      id: row.id,
      leadId: row.lead_id,
      leadName: row.leads?.name?.trim() || "Unnamed lead",
      step: STEP_LABELS[row.step],
      error: row.error,
      when: ukStamp(row.updated_at),
    }));

  return {
    sendingToday: sentToday + willSend.filter((at) => at < end).length,
    nextSevenDays: willSend.filter((at) => at <= weekEnd).length,
    failures,
    globallyOff: !config.enabled,
  };
}

export type LeadFollowUpView = {
  entries: ActivityEntry[];
  blockedReason: string | null;
  next: string | null;
  globallyOff: boolean;
};

/** Status changes, follow-ups (done and coming) and completion for one lead's Activity timeline. */
export async function leadFollowUpView(lead: LeadForFollowUps, now: Date): Promise<LeadFollowUpView> {
  const admin = getSupabaseAdmin();
  const config = readFollowUpConfig(process.env);
  const [eventsResult, sendsResult, settings] = await Promise.all([
    admin.from("lead_status_events").select("id, from_status, to_status, changed_at").eq("lead_id", lead.id).order("changed_at", { ascending: false }),
    admin.from("follow_up_sends").select(SEND_SELECT).eq("lead_id", lead.id),
    loadFollowUpSettings(admin).catch((error: Error) => {
      console.error("admin lead: follow-up settings failed", error.message);
      return [] as FollowUpSetting[];
    }),
  ]);
  if (eventsResult.error) console.error("admin lead: status history failed", eventsResult.error.message);
  if (sendsResult.error) console.error("admin lead: follow-up sends failed", sendsResult.error.message);

  const events = eventsResult.data ?? [];
  const sends = (sendsResult.data ?? []) as FollowUpSendRow[];
  const quotedAt = lead.status === "quoted" ? (events.find((event) => event.to_status === "quoted")?.changed_at ?? null) : null;
  const plan = planLead({ ...lead, quoted_at: quotedAt }, settings, sends, config, now);

  const entries: ActivityEntry[] = [
    ...events.map((event) => ({
      id: `status-${event.id}`,
      kind: "status" as const,
      at: event.changed_at,
      when: ukStamp(event.changed_at),
      title: `Status: ${event.from_status ? `${STATUS_LABELS[normalizeStatus(event.from_status)]} to ` : ""}${STATUS_LABELS[normalizeStatus(event.to_status)]}`,
    })),
    ...(lead.completed_at
      ? [{ id: "complete", kind: "complete" as const, at: lead.completed_at, when: ukStamp(lead.completed_at), title: "Job marked complete" }]
      : []),
    ...sends.map((row) => sendEntry(row, lead.email)),
    ...plan
      .map((item) => planEntry(item, settings.find((setting) => setting.step === item.step), config, now))
      .filter((entry): entry is ActivityEntry => entry !== null),
  ];

  const upcoming = plan
    .map((item) => ({ step: item.step, at: item.kind === "scheduled" ? item.at : now, skip: item.kind === "skip" }))
    .filter((item) => !item.skip)
    .sort((a, b) => a.at.getTime() - b.at.getTime())[0];

  return {
    entries,
    blockedReason: blockedReason(lead, config.testRecipient),
    next: upcoming ? `${STEP_LABELS[upcoming.step]}, ${upcoming.at <= now ? "due now" : ukStamp(upcoming.at.toISOString())}` : null,
    globallyOff: !config.enabled,
  };
}