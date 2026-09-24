import type { CalendarEventRow } from "@/app/admin/calendar/actions";

export type LeadVisitSummary = {
  id: string;
  start_date: string;
  start_time: string | null;
};

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function todayDateKey(now = new Date()) {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

function currentTimeKey(now = new Date()) {
  return `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;
}

function isUpcoming(event: LeadVisitSummary, now = new Date()) {
  const today = todayDateKey(now);
  if (event.start_date > today) return true;
  if (event.start_date < today) return false;
  if (!event.start_time) return true;
  return event.start_time >= currentTimeKey(now);
}

export function pickNextUpcomingVisit(
  events: LeadVisitSummary[],
  now = new Date(),
): LeadVisitSummary | null {
  const upcoming = events
    .filter((event) => isUpcoming(event, now))
    .sort((a, b) => {
      const dateDiff = a.start_date.localeCompare(b.start_date);
      if (dateDiff !== 0) return dateDiff;
      return (a.start_time ?? "").localeCompare(b.start_time ?? "");
    });
  return upcoming[0] ?? null;
}

export function formatVisitIndicator(visit: LeadVisitSummary) {
  const [y, m, d] = visit.start_date.split("-").map(Number);
  const dateLabel = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(new Date(y, m - 1, d));

  const timeMatch = visit.start_time
    ? /^(\d{2}):(\d{2})/.exec(visit.start_time)
    : null;
  if (timeMatch) {
    return `Visit: ${dateLabel}, ${timeMatch[1]}:${timeMatch[2]}`;
  }
  return `Visit: ${dateLabel}`;
}

export function groupNextVisitsByLead(
  events: Array<Pick<CalendarEventRow, "id" | "lead_id" | "start_date" | "start_time">>,
) {
  const byLead = new Map<string, LeadVisitSummary[]>();
  for (const event of events) {
    if (!event.lead_id) continue;
    const list = byLead.get(event.lead_id) ?? [];
    list.push({
      id: event.id,
      start_date: event.start_date,
      start_time: event.start_time,
    });
    byLead.set(event.lead_id, list);
  }

  const nextByLead: Record<string, LeadVisitSummary> = {};
  for (const [leadId, list] of byLead) {
    const next = pickNextUpcomingVisit(list);
    if (next) nextByLead[leadId] = next;
  }
  return nextByLead;
}

export function todayDateKeyForPrefill() {
  return todayDateKey();
}

export function buildSiteVisitNotes(input: {
  phone?: string | null;
  postcode?: string | null;
}) {
  const lines: string[] = [];
  if (input.phone?.trim()) lines.push(`Phone: ${input.phone.trim()}`);
  if (input.postcode?.trim()) lines.push(`Postcode: ${input.postcode.trim()}`);
  return lines.join("\n");
}
