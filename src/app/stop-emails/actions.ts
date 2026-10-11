"use server";

import { leadIdFromStopToken } from "@/lib/follow-ups";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export type StopEmailsState = { status: "idle" | "stopped" | "invalid" | "error" };

/** Pauses follow-ups for the lead named in a signed stop-link token. Only ever called by the page's button. */
export async function stopFollowUpEmails(_previous: StopEmailsState, formData: FormData): Promise<StopEmailsState> {
  const leadId = leadIdFromStopToken(String(formData.get("t") ?? ""));
  if (!leadId) return { status: "invalid" };

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("leads")
    .update({ follow_ups_paused: true })
    .eq("id", leadId)
    .eq("follow_ups_paused", false)
    .select("id");
  if (error) {
    console.error("stop emails: pause failed", error.message);
    return { status: "error" };
  }

  // Only the first press leaves a note on the lead; later presses change nothing.
  if (data && data.length > 0) {
    const { error: noteError } = await admin
      .from("lead_notes")
      .insert({ lead_id: leadId, note: "The customer stopped follow-up emails using the link in an email." });
    if (noteError) console.error("stop emails: note failed", noteError.message);
  }
  return { status: "stopped" };
}
