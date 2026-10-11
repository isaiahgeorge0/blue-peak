"use server";

import { revalidatePath } from "next/cache";
import { getAdminActionClient } from "@/lib/admin-auth";
import { LEAD_STATUSES, SPAM_STATUS, type LeadStatus } from "@/lib/lead-status";

export type UpdateLeadStatusResult =
  | { ok: true; status: LeadStatus }
  | { ok: false; error: string };

export type LeadNoteRow = {
  id: string;
  lead_id: string;
  note: string;
  created_at: string;
};

export type AddLeadNoteResult =
  | { ok: true; note: LeadNoteRow }
  | { ok: false; error: string };

export type BulkLeadsResult =
  | { ok: true; count: number }
  | { ok: false; error: string };

const MAX_BULK_LEADS = 500;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function cleanLeadIds(ids: unknown): string[] | null {
  if (!Array.isArray(ids)) return null;
  const unique = [
    ...new Set(
      ids.filter(
        (id): id is string => typeof id === "string" && UUID_PATTERN.test(id),
      ),
    ),
  ];
  return unique.length > 0 && unique.length <= MAX_BULK_LEADS ? unique : null;
}

function isLeadStatus(value: string): value is LeadStatus {
  return (LEAD_STATUSES as readonly string[]).includes(value);
}

export async function updateLeadStatus(
  leadId: string,
  status: string,
): Promise<UpdateLeadStatusResult> {
  if (!leadId) {
    return { ok: false, error: "Missing lead id." };
  }

  if (!isLeadStatus(status)) {
    return { ok: false, error: "Invalid status." };
  }

  const supabase = await getAdminActionClient();
  if (!supabase) {
    return { ok: false, error: "Not authorised." };
  }

  // Select the updated row so a silent RLS miss surfaces as an error.
  const { data, error } = await supabase
    .from("leads")
    .update({ status })
    .eq("id", leadId)
    .select("id, status")
    .maybeSingle();

  if (error) {
    console.error("updateLeadStatus failed", error.message);
    return { ok: false, error: "Unable to update status." };
  }

  if (!data) {
    return { ok: false, error: "Lead not found or update blocked." };
  }

  return { ok: true, status: data.status as LeadStatus };
}

export async function addLeadNote(
  leadId: string,
  note: string,
): Promise<AddLeadNoteResult> {
  if (!leadId) {
    return { ok: false, error: "Missing lead id." };
  }

  const trimmed = note.trim();
  if (!trimmed) {
    return { ok: false, error: "Note cannot be empty." };
  }

  const supabase = await getAdminActionClient();
  if (!supabase) {
    return { ok: false, error: "Not authorised." };
  }

  const { data, error } = await supabase
    .from("lead_notes")
    .insert({ lead_id: leadId, note: trimmed })
    .select("id, lead_id, note, created_at")
    .maybeSingle();

  if (error) {
    console.error("addLeadNote failed", error.message);
    return { ok: false, error: "Unable to add note." };
  }

  if (!data) {
    return { ok: false, error: "Note was not saved." };
  }

  revalidatePath("/admin/leads");
  return { ok: true, note: data as LeadNoteRow };
}

export type LeadFlagResult = { ok: true } | { ok: false; error: string };

/** Pauses or resumes follow-up emails for one lead. */
export async function setFollowUpsPaused(leadId: string, paused: boolean): Promise<LeadFlagResult> {
  if (!UUID_PATTERN.test(leadId)) return { ok: false, error: "Missing lead id." };
  const supabase = await getAdminActionClient();
  if (!supabase) return { ok: false, error: "Not authorised." };

  const { data, error } = await supabase
    .from("leads")
    .update({ follow_ups_paused: paused })
    .eq("id", leadId)
    .select("id")
    .maybeSingle();
  if (error) {
    console.error("setFollowUpsPaused failed", error.message);
    return { ok: false, error: paused ? "Unable to pause follow-ups." : "Unable to resume follow-ups." };
  }
  if (!data) return { ok: false, error: "Lead not found or update blocked." };

  revalidatePath(`/admin/leads/${leadId}`);
  revalidatePath("/admin");
  return { ok: true };
}

/** Marks the job complete (Won leads only), which starts the review request, or undoes it. */
export async function setJobCompleted(leadId: string, completed: boolean): Promise<LeadFlagResult> {
  if (!UUID_PATTERN.test(leadId)) return { ok: false, error: "Missing lead id." };
  const supabase = await getAdminActionClient();
  if (!supabase) return { ok: false, error: "Not authorised." };

  let query = supabase
    .from("leads")
    .update({ completed_at: completed ? new Date().toISOString() : null })
    .eq("id", leadId);
  if (completed) query = query.eq("status", "won");
  const { data, error } = await query.select("id").maybeSingle();
  if (error) {
    console.error("setJobCompleted failed", error.message);
    return { ok: false, error: completed ? "Unable to mark the job complete." : "Unable to undo." };
  }
  if (!data) {
    return { ok: false, error: completed ? "Only Won leads can be marked complete." : "Lead not found or update blocked." };
  }

  revalidatePath(`/admin/leads/${leadId}`);
  revalidatePath("/admin");
  return { ok: true };
}

export async function markLeadsAsSpam(ids: string[]): Promise<BulkLeadsResult> {
  const leadIds = cleanLeadIds(ids);
  if (!leadIds) {
    return { ok: false, error: `Select between 1 and ${MAX_BULK_LEADS} leads.` };
  }

  const supabase = await getAdminActionClient();
  if (!supabase) {
    return { ok: false, error: "Not authorised." };
  }

  const { data, error } = await supabase
    .from("leads")
    .update({ status: SPAM_STATUS })
    .in("id", leadIds)
    .select("id");

  if (error) {
    console.error("markLeadsAsSpam failed", error.message);
    return { ok: false, error: "Unable to mark those leads as spam." };
  }

  revalidatePath("/admin/leads");
  revalidatePath("/admin");
  return { ok: true, count: data?.length ?? 0 };
}

export async function deleteLeads(ids: string[]): Promise<BulkLeadsResult> {
  const leadIds = cleanLeadIds(ids);
  if (!leadIds) {
    return { ok: false, error: `Select between 1 and ${MAX_BULK_LEADS} leads.` };
  }

  const supabase = await getAdminActionClient();
  if (!supabase) {
    return { ok: false, error: "Not authorised." };
  }

  // Notes are removed with the lead; linked calendar events are kept.
  const { data, error } = await supabase
    .from("leads")
    .delete()
    .in("id", leadIds)
    .select("id");

  if (error) {
    console.error("deleteLeads failed", error.message);
    return { ok: false, error: "Unable to delete those leads." };
  }

  revalidatePath("/admin/leads");
  revalidatePath("/admin");
  return { ok: true, count: data?.length ?? 0 };
}
