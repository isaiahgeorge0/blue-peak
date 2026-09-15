import type { CalendarEventRow } from "@/app/admin/calendar/actions";

export const RECURRENCE_VALUES = [
  "none",
  "weekly",
  "biweekly",
  "monthly",
] as const;

export type RecurrenceValue = (typeof RECURRENCE_VALUES)[number];

export type CalendarOccurrence = {
  event: CalendarEventRow;
  occurrenceDate: string;
  isRecurring: boolean;
};

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

export function toDateKey(year: number, month: number, day: number) {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function parseDateKey(dateKey: string) {
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function formatDateKey(date: Date) {
  return toDateKey(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

function addMonths(date: Date, months: number) {
  const copy = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const day = date.getDate();
  const daysInTarget = new Date(
    copy.getFullYear(),
    copy.getMonth() + 1,
    0,
  ).getDate();
  copy.setDate(Math.min(day, daysInTarget));
  return copy;
}

function daysBetween(start: Date, end: Date) {
  const startUtc = Date.UTC(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
  );
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.round((endUtc - startUtc) / 86_400_000);
}

function compareDateKeys(a: string, b: string) {
  return a.localeCompare(b);
}

function expansionHorizon(event: CalendarEventRow) {
  const start = parseDateKey(event.start_date);
  if (!start) return event.start_date;

  // Indefinite series are only expanded for 12 months from start_date.
  const capped = formatDateKey(addMonths(start, 12));
  if (!event.recurrence_end_date) return capped;
  return compareDateKeys(event.recurrence_end_date, capped) < 0
    ? event.recurrence_end_date
    : capped;
}

function eachDateInRange(rangeStart: string, rangeEnd: string) {
  const start = parseDateKey(rangeStart);
  const end = parseDateKey(rangeEnd);
  if (!start || !end) return [] as Date[];

  const dates: Date[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

function selectedWeekdays(event: CalendarEventRow) {
  const days = event.recurrence_days_of_week ?? [];
  return new Set(days.filter((day) => day >= 0 && day <= 6));
}

function occursOnDate(event: CalendarEventRow, date: Date) {
  const start = parseDateKey(event.start_date);
  if (!start) return false;

  const dateKey = formatDateKey(date);
  if (compareDateKeys(dateKey, event.start_date) < 0) return false;

  const horizon = expansionHorizon(event);
  if (compareDateKeys(dateKey, horizon) > 0) return false;

  const recurrence = event.recurrence as RecurrenceValue;

  if (recurrence === "none") {
    return dateKey === event.start_date;
  }

  if (recurrence === "monthly") {
    return date.getDate() === start.getDate();
  }

  if (recurrence === "weekly" || recurrence === "biweekly") {
    const weekdays = selectedWeekdays(event);
    if (weekdays.size === 0) return false;
    if (!weekdays.has(date.getDay())) return false;

    if (recurrence === "weekly") return true;

    const weekIndex = Math.floor(daysBetween(start, date) / 7);
    return weekIndex % 2 === 0;
  }

  return false;
}

/**
 * Expand stored calendar rows into virtual occurrences for a visible date range.
 * Does not write extra DB rows.
 */
export function expandEventsForRange(
  events: CalendarEventRow[],
  rangeStart: string,
  rangeEnd: string,
): CalendarOccurrence[] {
  const dates = eachDateInRange(rangeStart, rangeEnd);
  const occurrences: CalendarOccurrence[] = [];

  for (const event of events) {
    const isRecurring = event.recurrence !== "none";

    if (!isRecurring) {
      if (
        compareDateKeys(event.start_date, rangeStart) >= 0 &&
        compareDateKeys(event.start_date, rangeEnd) <= 0
      ) {
        occurrences.push({
          event,
          occurrenceDate: event.start_date,
          isRecurring: false,
        });
      }
      continue;
    }

    for (const date of dates) {
      if (!occursOnDate(event, date)) continue;
      occurrences.push({
        event,
        occurrenceDate: formatDateKey(date),
        isRecurring: true,
      });
    }
  }

  occurrences.sort((a, b) => {
    const dateDiff = compareDateKeys(a.occurrenceDate, b.occurrenceDate);
    if (dateDiff !== 0) return dateDiff;
    const aTime = a.event.start_time ?? "";
    const bTime = b.event.start_time ?? "";
    if (aTime !== bTime) return aTime.localeCompare(bTime);
    return a.event.title.localeCompare(b.event.title);
  });

  return occurrences;
}

export function groupOccurrencesByDate(occurrences: CalendarOccurrence[]) {
  const map = new Map<string, CalendarOccurrence[]>();
  for (const occurrence of occurrences) {
    const list = map.get(occurrence.occurrenceDate) ?? [];
    list.push(occurrence);
    map.set(occurrence.occurrenceDate, list);
  }
  return map;
}

export function weekdayFromDateKey(dateKey: string) {
  const date = parseDateKey(dateKey);
  return date ? date.getDay() : 0;
}

export function recurrenceLabel(value: string) {
  switch (value) {
    case "weekly":
      return "Weekly";
    case "biweekly":
      return "Every 2 weeks";
    case "monthly":
      return "Monthly";
    default:
      return "Does not repeat";
  }
}
