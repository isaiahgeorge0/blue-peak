"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export type CalendarEventRow = {
  id: string;
  title: string;
  notes: string | null;
  start_date: string;
  start_time: string | null;
  end_time: string | null;
  recurrence: string;
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
};

function isDateString(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isTimeString(value: string) {
  return /^\d{2}:\d{2}(:\d{2})?$/.test(value);
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

  if (startTime && !isTimeString(startTime)) {
    return { ok: false, error: "Invalid start time." };
  }
  if (endTime && !isTimeString(endTime)) {
    return { ok: false, error: "Invalid end time." };
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
      recurrence: "none",
    })
    .select(
      "id, title, notes, start_date, start_time, end_time, recurrence, created_at",
    )
    .maybeSingle();

  if (error) {
    console.error("createCalendarEvent failed", error.message);
    return { ok: false, error: "Unable to create event." };
  }

  if (!data) {
    return { ok: false, error: "Event was not created." };
  }

  revalidatePath("/admin/calendar");
  return { ok: true, event: data as CalendarEventRow };
}

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
  return { ok: true };
}
