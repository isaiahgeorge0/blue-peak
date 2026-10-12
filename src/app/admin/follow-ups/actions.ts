"use server";

import { revalidatePath } from "next/cache";
import { isAdminClaims } from "@/lib/admin-role";
import { houseImageFor } from "@/lib/email-house-image";
import { emailImages } from "@/lib/email-images";
import { renderFollowUpEmail, templateProblems } from "@/lib/follow-up-email";
import { jobCardFor, STEP_STAGE } from "@/lib/job-card";
import { FOLLOW_UP_STEPS, readFollowUpConfig, type DelayUnit, type FollowUpStep } from "@/lib/follow-up-schedule";
import { estimateFromLead } from "@/lib/estimate-summary";
import { deliverFollowUpEmail, EXAMPLE_STOP_URL, missingSendSettings, testSendBlockers } from "@/lib/follow-ups";
import { isSampleKind, SAMPLE_LEADS, type SampleKind } from "@/lib/follow-up-sample";
import { sitePhoneDisplay, sitePhoneTel } from "@/lib/site";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export type FollowUpActionResult = { ok: true } | { ok: false; error: string };

export type FollowUpDraft = {
  delay_amount: number;
  delay_unit: DelayUnit;
  subject: string;
  body: string;
};

const DELAY_LIMITS: Record<DelayUnit, number> = { hours: 720, days: 90 };

function isStep(value: unknown): value is FollowUpStep {
  return typeof value === "string" && (FOLLOW_UP_STEPS as readonly string[]).includes(value);
}

/** The signed-in admin's client and claims, or null. */
async function adminSession() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims || !isAdminClaims(data.claims)) return null;
  return { supabase, claims: data.claims };
}

function draftProblem(step: FollowUpStep, draft: FollowUpDraft): string | null {
  if (draft.delay_unit !== "hours" && draft.delay_unit !== "days") return "Choose hours or days.";
  const limit = DELAY_LIMITS[draft.delay_unit];
  if (!Number.isInteger(draft.delay_amount) || draft.delay_amount < 0 || draft.delay_amount > limit) {
    return `The delay must be a whole number from 0 to ${limit} ${draft.delay_unit}.`;
  }
  if (typeof draft.subject !== "string" || typeof draft.body !== "string") return "Missing subject or email.";
  if (draft.subject.trim().length > 150) return "Keep the subject to 150 characters or fewer.";
  if (draft.body.trim().length > 4000) return "Keep the email to 4,000 characters or fewer.";
  return templateProblems(step, draft.subject, draft.body)[0] ?? null;
}

export async function setFollowUpStepEnabled(step: string, enabled: boolean): Promise<FollowUpActionResult> {
  if (!isStep(step) || typeof enabled !== "boolean") return { ok: false, error: "Invalid step." };
  const session = await adminSession();
  if (!session) return { ok: false, error: "Not authorised." };

  const { data, error } = await session.supabase
    .from("follow_up_settings")
    .update({ enabled, updated_at: new Date().toISOString(), updated_by: session.claims.sub })
    .eq("step", step)
    .select("step")
    .maybeSingle();
  if (error || !data) {
    console.error("setFollowUpStepEnabled failed", error?.message);
    return { ok: false, error: "Unable to save." };
  }
  revalidatePath("/admin/follow-ups");
  revalidatePath("/admin");
  // The estimator only offers an emailed copy while the acknowledgement is on.
  if (step === "acknowledgement") revalidatePath("/quote");
  return { ok: true };
}

export async function saveFollowUpStep(step: string, draft: FollowUpDraft): Promise<FollowUpActionResult> {
  if (!isStep(step)) return { ok: false, error: "Invalid step." };
  const problem = draftProblem(step, draft);
  if (problem) return { ok: false, error: problem };
  const session = await adminSession();
  if (!session) return { ok: false, error: "Not authorised." };

  const { data, error } = await session.supabase
    .from("follow_up_settings")
    .update({
      delay_amount: draft.delay_amount,
      delay_unit: draft.delay_unit,
      subject: draft.subject.trim(),
      body: draft.body.trim(),
      updated_at: new Date().toISOString(),
      updated_by: session.claims.sub,
    })
    .eq("step", step)
    .select("step")
    .maybeSingle();
  if (error || !data) {
    console.error("saveFollowUpStep failed", error?.message);
    return { ok: false, error: "Unable to save." };
  }
  revalidatePath("/admin/follow-ups");
  revalidatePath("/admin");
  return { ok: true };
}

/** Sends the draft, filled in with a sample lead, to the signed-in admin's own address only. */
export async function sendFollowUpTest(
  step: string,
  draft: FollowUpDraft,
  sample: SampleKind = "contact",
): Promise<FollowUpActionResult & { to?: string }> {
  if (!isStep(step) || !isSampleKind(sample)) return { ok: false, error: "Invalid step." };
  const problem = draftProblem(step, draft);
  if (problem) return { ok: false, error: problem };
  const session = await adminSession();
  if (!session) return { ok: false, error: "Not authorised." };
  const to = typeof session.claims.email === "string" ? session.claims.email.trim() : "";
  if (!to) return { ok: false, error: "Your account has no email address." };

  const missing = testSendBlockers(missingSendSettings());
  if (missing.length > 0) return { ok: false, error: "Tests can't be sent until your web developer finishes the setup." };

  const lead = SAMPLE_LEADS[sample];
  const estimate = step === "acknowledgement" ? estimateFromLead(lead.serviceType, lead.message) : null;
  const images = await emailImages(houseImageFor(estimate?.addonKeys));
  const email = renderFollowUpEmail({
    step,
    subject: draft.subject,
    body: draft.body,
    name: lead.name,
    serviceType: lead.serviceType,
    estimate,
    phoneDisplay: sitePhoneDisplay,
    phoneHref: `tel:${sitePhoneTel}`,
    reviewUrl: readFollowUpConfig(process.env).reviewUrl,
    stopUrl: EXAMPLE_STOP_URL,
    intendedRecipient: null,
    jobCard: jobCardFor({
      reference_number: lead.referenceNumber,
      service_type: lead.serviceType,
      created_at: new Date().toISOString(),
      stage: STEP_STAGE[step],
    }),
    images: images.sources,
  });
  const delivery = await deliverFollowUpEmail({
    to,
    email: { ...email, subject: `Test: ${email.subject}` },
    attachments: images.attachments,
    stopUrl: EXAMPLE_STOP_URL,
    step,
  });
  if (!delivery.ok) {
    console.error("sendFollowUpTest failed", delivery.message);
    return { ok: false, error: "The test email didn't send. Try again in a minute." };
  }
  return { ok: true, to };
}
