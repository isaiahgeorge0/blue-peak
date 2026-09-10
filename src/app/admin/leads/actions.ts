"use server";

import { LEAD_STATUSES, type LeadStatus } from "@/lib/lead-status";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export type UpdateLeadStatusResult =
  | { ok: true; status: LeadStatus }
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
