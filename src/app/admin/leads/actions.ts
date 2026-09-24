"use server";

import { revalidatePath } from "next/cache";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/lead-status";
import { createSupabaseServerClient } from "@/lib/supabase-server";

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

  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims) {
    return { ok: false, error: "Not authenticated." };
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

  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims) {
    return { ok: false, error: "Not authenticated." };
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
