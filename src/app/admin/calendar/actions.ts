"use server";

import { revalidatePath } from "next/cache";
import {
  RECURRENCE_VALUES,
  type RecurrenceValue,
} from "@/lib/calendar-recurrence";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export type CalendarEventRow = {
  id: string;
  title: string;
  notes: string | null;
  start_date: string;
  start_time: string | null;
  end_time: string | null;
  recurrence: string;
  recurrence_days_of_week: number[] | null;
  recurrence_end_date: string | null;
  lead_id: string | null;
  created_at: string;
};

export type CalendarActionResult =
  | { ok: true; event?: CalendarEventRow }
  | { ok: false; error: string };

export type CreateCalendarEventInput = {
  title: string;
  notes?: string;
  start_date: string;
  start_time?: string;
  end_time?: string;
  lead_id?: string;
  recurrence?: RecurrenceValue;
  recurrence_days_of_week?: number[];
  recurrence_end_date?: string;
};

const EVENT_SELECT =
  "id, title, notes, start_date, start_time, end_time, recurrence, recurrence_days_of_week, recurrence_end_date, lead_id, created_at";

function isDateString(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isTimeString(value: string) {
  return /^\d{2}:\d{2}(:\d{2})?$/.test(value);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function isRecurrence(value: string): value is RecurrenceValue {
  return (RECURRENCE_VALUES as readonly string[]).includes(value);
}

function normalizeWeekdays(days: number[] | undefined) {
  if (!days?.length) return null;
  const unique = [...new Set(days.filter((day) => day >= 0 && day <= 6))].sort(
    (a, b) => a - b,
  );
  return unique.length ? unique : null;
}

async function requireAuthenticatedClient() {
  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims) {
    return { ok: false as const, error: "Not authenticated.", supabase: null };
  }

  return { ok: true as const, error: null, supabase };
}

export async function createCalendarEvent(
  input: CreateCalendarEventInput,
): Promise<CalendarActionResult> {
  const title = input.title?.trim() ?? "";
  if (!title) {
    return { ok: false, error: "Title is required." };
  }

  if (!input.start_date || !isDateString(input.start_date)) {
    return { ok: false, error: "Invalid start date." };
  }

  const startTime = input.start_time?.trim() || null;
  const endTime = input.end_time?.trim() || null;
  const notes = input.notes?.trim() || null;
  const recurrence = input.recurrence ?? "none";
  const recurrenceEndDate = input.recurrence_end_date?.trim() || null;
  const weekdays = normalizeWeekdays(input.recurrence_days_of_week);
  const leadId = input.lead_id?.trim() || null;

  if (!isRecurrence(recurrence)) {
    return { ok: false, error: "Invalid recurrence." };
  }

  if (startTime && !isTimeString(startTime)) {
    return { ok: false, error: "Invalid start time." };
  }
  if (endTime && !isTimeString(endTime)) {
    return { ok: false, error: "Invalid end time." };
  }

  if (recurrenceEndDate && !isDateString(recurrenceEndDate)) {
    return { ok: false, error: "Invalid repeat-until date." };
  }

  if (recurrenceEndDate && recurrenceEndDate < input.start_date) {
    return { ok: false, error: "Repeat-until date must be on or after start." };
  }

  if (
    (recurrence === "weekly" || recurrence === "biweekly") &&
    (!weekdays || weekdays.length === 0)
  ) {
    return { ok: false, error: "Pick at least one day of the week." };
  }

  if (leadId && !isUuid(leadId)) {
    return { ok: false, error: "Invalid lead id." };
  }

  const auth = await requireAuthenticatedClient();
  if (!auth.ok || !auth.supabase) {
    return { ok: false, error: auth.error ?? "Not authenticated." };
  }

  const { data, error } = await auth.supabase
    .from("calendar_events")
    .insert({
      title,
      notes,
      start_date: input.start_date,
      start_time: startTime,
      end_time: endTime,
      lead_id: leadId,
      recurrence,
      recurrence_days_of_week:
        recurrence === "weekly" || recurrence === "biweekly" ? weekdays : null,
      recurrence_end_date: recurrence === "none" ? null : recurrenceEndDate,
    })
    .select(EVENT_SELECT)
    .maybeSingle();

  if (error) {
    console.error("createCalendarEvent failed", error.message);
    return { ok: false, error: "Unable to create event." };
  }

  if (!data) {
    return { ok: false, error: "Event was not created." };
  }

  revalidatePath("/admin/calendar");
  revalidatePath("/admin/leads");
  return { ok: true, event: data as CalendarEventRow };
}

/**
 * Deletes the whole series (the single calendar_events row).
 * Per-occurrence exceptions are out of scope for this pass.
 */
export async function deleteCalendarEvent(
  eventId: string,
): Promise<CalendarActionResult> {
  if (!eventId) {
    return { ok: false, error: "Missing event id." };
  }

  const auth = await requireAuthenticatedClient();
  if (!auth.ok || !auth.supabase) {
    return { ok: false, error: auth.error ?? "Not authenticated." };
  }

  const { data, error } = await auth.supabase
    .from("calendar_events")
    .delete()
    .eq("id", eventId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("deleteCalendarEvent failed", error.message);
    return { ok: false, error: "Unable to delete event." };
  }

  if (!data) {
    return { ok: false, error: "Event not found or delete blocked." };
  }

  revalidatePath("/admin/calendar");
  revalidatePath("/admin/leads");
  return { ok: true };
}
