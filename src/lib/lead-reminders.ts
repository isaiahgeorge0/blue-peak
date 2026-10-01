import "server-only";
import { UNACTIONED_STATUS } from "@/lib/lead-status";
import { sendNtfyPush, serviceLabel } from "@/lib/send-lead-push";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const HOUR_MS = 60 * 60 * 1000;
/** First reminder once a lead has sat at "new" this long. */
export const FIRST_REMINDER_AFTER_MS = 4 * HOUR_MS;
/** Then at most one reminder per lead per this interval until it's actioned. */
export const REPEAT_REMINDER_AFTER_MS = 24 * HOUR_MS;
/** The scheduler runs hourly; without slack a 24h repeat drifts an hour a day. */
const SCHEDULE_SLACK_MS = 10 * 60 * 1000;
const MAX_LEADS_PER_PUSH = 20;
const MAX_LISTED = 8;

type StalledLead = {
  id: string;
  created_at: string;
  name: string | null;
  phone: string | null;
  service_type: string | null;
  reminder_count: number;
};

export type ReminderRunResult =
  | { status: "sent"; reminded: number }
  | { status: "none-due" }
  | { status: "not-configured" };

function waitingFor(createdAt: string, now: number) {
  const hours = Math.max(
    1,
    Math.floor((now - new Date(createdAt).getTime()) / HOUR_MS),
  );
  if (hours < 48) return `${hours} hour${hours === 1 ? "" : "s"}`;
  return `${Math.floor(hours / 24)} days`;
}

function buildPush(leads: StalledLead[], now: number) {
  if (leads.length === 1) {
    const [lead] = leads;
    return {
      title: "Lead still waiting",
      message: [
        `${lead.name?.trim() || "Unnamed lead"} · ${lead.phone || "no phone"}`,
        `Service: ${serviceLabel(lead.service_type ?? "")}`,
        `Still marked New after ${waitingFor(lead.created_at, now)}.`,
      ].join("\n"),
    };
  }

  const lines = leads
    .slice(0, MAX_LISTED)
    .map(
      (lead) =>
        `${lead.name?.trim() || "Unnamed lead"} · ${lead.phone || "no phone"} · ${waitingFor(lead.created_at, now)}`,
    );
  if (leads.length > MAX_LISTED) {
    lines.push(`...and ${leads.length - MAX_LISTED} more`);
  }
  return {
    title: `${leads.length} leads still waiting`,
    message: [...lines, "All still marked New."].join("\n"),
  };
}

/**
 * Push one ntfy reminder covering every lead that is still "new" and due:
 * 4h after arrival, then every 24h. Changing the status stops reminders.
 * Leads are only marked reminded after the push succeeds, so a failed push is
 * retried on the next run.
 */
export async function runLeadReminders(
  now = Date.now(),
): Promise<ReminderRunResult> {
  if (!process.env.NTFY_TOPIC_URL?.trim()) return { status: "not-configured" };

  const firstCutoff = new Date(
    now - FIRST_REMINDER_AFTER_MS + SCHEDULE_SLACK_MS,
  ).toISOString();
  const repeatCutoff = new Date(
    now - REPEAT_REMINDER_AFTER_MS + SCHEDULE_SLACK_MS,
  ).toISOString();

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("leads")
    .select("id, created_at, name, phone, service_type, reminder_count")
    .eq("status", UNACTIONED_STATUS)
    .lte("created_at", firstCutoff)
    .or(`last_reminded_at.is.null,last_reminded_at.lte.${repeatCutoff}`)
    .order("created_at", { ascending: true })
    .limit(MAX_LEADS_PER_PUSH);

  if (error) throw new Error(`Reminder lookup failed: ${error.message}`);
  const due = (data ?? []) as StalledLead[];
  if (due.length === 0) return { status: "none-due" };

  const push = buildPush(due, now);
  await sendNtfyPush({ ...push, tags: "hourglass_flowing_sand" });

  const remindedAt = new Date(now).toISOString();
  const updates = await Promise.all(
    due.map((lead) =>
      admin
        .from("leads")
        .update({
          last_reminded_at: remindedAt,
          reminder_count: lead.reminder_count + 1,
        })
        .eq("id", lead.id)
        // A status change since the lookup means it was actioned; leave it be.
        .eq("status", UNACTIONED_STATUS),
    ),
  );
  const failed = updates.filter((result) => result.error);
  if (failed.length > 0) {
    console.error(
      "lead reminders: failed to record",
      failed.length,
      "reminders",
      failed[0].error?.message,
    );
  }

  return { status: "sent", reminded: due.length };
}
