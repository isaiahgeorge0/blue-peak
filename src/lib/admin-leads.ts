import { ESTIMATOR_SERVICE_TYPE } from "./lead-limits.ts";
import { LEAD_STATUSES, type LeadStatus } from "./lead-status.ts";

/**
 * The two test leads ("Test" and "Agent test - estimator funnel"). They stay in
 * the Leads list but are left out of every dashboard figure; both are deleted
 * before handover, after which this list matches nothing.
 */
export const TEST_LEAD_IDS: ReadonlySet<string> = new Set([
  "670a5941-ea8f-43b7-b518-9562a6068d19",
  "1b0f92a9-c521-48bf-90ff-1d11d14ee805",
]);

export const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  quoted: "Quoted",
  won: "Won",
  lost: "Lost",
  spam: "Spam",
};

/** Missing or unknown statuses count as New, as the reminders do. */
export function normalizeStatus(status: string | null | undefined): LeadStatus {
  return status && (LEAD_STATUSES as readonly string[]).includes(status)
    ? (status as LeadStatus)
    : "new";
}

export type LeadSource = "Estimator" | "Contact form";

/** Every lead is stored with source "website"; the form is told apart by service_type. */
export function leadSource(serviceType: string | null | undefined): LeadSource {
  return serviceType === ESTIMATOR_SERVICE_TYPE ? "Estimator" : "Contact form";
}

export type EstimatorDetail = { label: string; value: string };

/**
 * The estimator writes its selections into the message as "Label: value"
 * lines under a one-line heading. Returns them in order, or null when the
 * message is not in that shape.
 */
export function estimatorDetails(message: string | null | undefined): EstimatorDetail[] | null {
  if (!message) return null;
  const details: EstimatorDetail[] = [];
  for (const line of message.split("\n").slice(1)) {
    const split = line.indexOf(":");
    if (split <= 0) continue;
    const value = line.slice(split + 1).trim();
    if (value) details.push({ label: line.slice(0, split).trim(), value });
  }
  return details.length > 0 ? details : null;
}

/**
 * What the lead is about, in words: the service picked on the contact form,
 * or the work picked in the estimator. `serviceNames` maps service slugs to
 * their names.
 */
export function serviceLabel(
  serviceType: string | null | undefined,
  message: string | null | undefined,
  serviceNames: Record<string, string>,
) {
  if (serviceType === ESTIMATOR_SERVICE_TYPE) {
    const work = estimatorDetails(message)?.find((detail) => detail.label === "Work")?.value;
    return work && work !== "Not selected" ? work : "Estimate";
  }
  const slug = serviceType?.trim();
  if (!slug) return "No service chosen";
  return serviceNames[slug] ?? slug.replace(/-/g, " ").replace(/^./, (first) => first.toUpperCase());
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** How long a lead has waited, in plain words: "Under an hour", "5 hours", "2 days", "3 weeks". */
export function waitedFor(createdAt: string, now: Date) {
  const waited = Math.max(0, now.getTime() - new Date(createdAt).getTime());
  const plural = (count: number, unit: string) => `${count} ${unit}${count === 1 ? "" : "s"}`;
  if (waited < HOUR) return "Under an hour";
  if (waited < DAY) return plural(Math.floor(waited / HOUR), "hour");
  if (waited < 14 * DAY) return plural(Math.floor(waited / DAY), "day");
  return plural(Math.floor(waited / (7 * DAY)), "week");
}

/** "Good morning" before noon, "Good afternoon" until six, then "Good evening", in UK time. */
export function greetingFor(now: Date) {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      hour: "numeric",
      hourCycle: "h23",
    }).format(now),
  );
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/** first_name from the user's profile (Supabase user_metadata), or null. Never the email. */
export function firstNameFromClaims(claims: unknown): string | null {
  const metadata = (claims as { user_metadata?: unknown } | null)?.user_metadata;
  if (!metadata || typeof metadata !== "object") return null;
  const value = (metadata as { first_name?: unknown }).first_name;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** YYYY-MM-DD and HH:MM for a moment, in UK time. */
export function ukDateTime(now: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map((part) => [part.type, part.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
}

/** The Monday (UK) of the week a moment falls in, as YYYY-MM-DD. */
export function ukWeekStart(moment: Date) {
  const [year, month, day] = ukDateTime(moment).date.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return date.toISOString().slice(0, 10);
}

export type WeeklyCount = { week: string; label: string; leads: number };

/** Days the first lead must be in the past before the weekly chart is shown. */
export const VOLUME_MIN_DAYS = 28;

/**
 * Leads per UK week, oldest first, from the week of the first lead (at most
 * `maxWeeks` back) to this week, including empty weeks. Null until the first
 * lead is VOLUME_MIN_DAYS old.
 */
export function weeklyVolume(createdAts: string[], now: Date, maxWeeks = 12): WeeklyCount[] | null {
  if (createdAts.length === 0) return null;
  const first = Math.min(...createdAts.map((value) => new Date(value).getTime()));
  if (now.getTime() - first < VOLUME_MIN_DAYS * DAY) return null;

  const counts = new Map<string, number>();
  for (const value of createdAts) {
    const week = ukWeekStart(new Date(value));
    counts.set(week, (counts.get(week) ?? 0) + 1);
  }

  const thisWeek = new Date(`${ukWeekStart(now)}T00:00:00Z`);
  const firstWeek = new Date(`${ukWeekStart(new Date(first))}T00:00:00Z`);
  const span = Math.round((thisWeek.getTime() - firstWeek.getTime()) / (7 * DAY)) + 1;
  const weeks = Math.min(maxWeeks, span);
  const label = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  return Array.from({ length: weeks }, (_, index) => {
    const start = new Date(thisWeek);
    start.setUTCDate(start.getUTCDate() - (weeks - 1 - index) * 7);
    const week = start.toISOString().slice(0, 10);
    return { week, label: label.format(start), leads: counts.get(week) ?? 0 };
  });
}
