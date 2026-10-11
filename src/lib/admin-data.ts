import "server-only";
import type { CalendarEventRow } from "@/app/admin/calendar/actions";
import { ukDateTime } from "@/lib/admin-leads";
import { expandEventsForRange, formatDateKey, parseDateKey, type CalendarOccurrence } from "@/lib/calendar-recurrence";
import { services } from "@/lib/content";

export const SERVICE_NAMES: Record<string, string> = Object.fromEntries(
  services.map((service) => [service.slug, service.name]),
);

export const CALENDAR_EVENT_SELECT =
  "id, title, notes, start_date, start_time, end_time, recurrence, recurrence_days_of_week, recurrence_end_date, lead_id, created_at";

/** Days ahead the dashboard looks for upcoming events. */
const UPCOMING_DAYS = 120;

function addDays(dateKey: string, days: number) {
  const date = parseDateKey(dateKey) ?? new Date();
  date.setDate(date.getDate() + days);
  return formatDateKey(date);
}

/** The next `limit` occurrences from now (UK time); today's events that have already ended are left out. */
export function upcomingOccurrences(events: CalendarEventRow[], now: Date, limit = 5): CalendarOccurrence[] {
  const { date: today, time } = ukDateTime(now);
  return expandEventsForRange(events, today, addDays(today, UPCOMING_DAYS))
    .filter((occurrence) => {
      if (occurrence.occurrenceDate !== today) return true;
      const until = (occurrence.event.end_time ?? occurrence.event.start_time)?.slice(0, 5);
      return !until || until >= time;
    })
    .slice(0, limit);
}

export function upcomingRange(now: Date) {
  const { date } = ukDateTime(now);
  return { from: date, to: addDays(date, UPCOMING_DAYS) };
}

/** "Today", "Tomorrow", or "Mon 12 Oct", for a YYYY-MM-DD in UK terms. */
export function dayLabel(dateKey: string, now: Date) {
  const { date: today } = ukDateTime(now);
  if (dateKey === today) return "Today";
  if (dateKey === addDays(today, 1)) return "Tomorrow";
  const date = parseDateKey(dateKey);
  if (!date) return dateKey;
  return new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" }).format(date);
}

/** "09:00–10:30", "09:00", or "All day". */
export function timeRange(start: string | null, end: string | null) {
  const from = start?.slice(0, 5);
  const to = end?.slice(0, 5);
  if (!from) return "All day";
  return to ? `${from}–${to}` : from;
}

/** "9 Oct 2026, 14:05" in UK time. */
export function ukStamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

export function telHref(phone: string | null | undefined) {
  const digits = phone?.replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : null;
}

export function mailHref(email: string | null | undefined) {
  const address = email?.trim();
  return address ? `mailto:${address}?subject=${encodeURIComponent("Your Blue Peak Solutions enquiry")}` : null;
}
