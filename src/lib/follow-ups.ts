import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { siteUrl } from "@/lib/content";
import { houseImageFor } from "@/lib/email-house-image";
import { emailImages, type EmailAttachment } from "@/lib/email-images";
import { estimateFromLead } from "@/lib/estimate-summary";
import { renderFollowUpEmail, type RenderedEmail } from "@/lib/follow-up-email";
import { jobCardFor, jobStage, STEP_STAGE } from "@/lib/job-card";
import {
  FOLLOW_UP_STEPS,
  MAX_ATTEMPTS,
  MIN_LINK_SECRET_LENGTH,
  planLead,
  readFollowUpConfig,
  readLinkSecret,
  type LinkSecretStatus,
  resolveRecipient,
  STUCK_AFTER_MS,
  UNKNOWN_OUTCOME,
  type FollowUpLead,
  type FollowUpSendRow,
  type FollowUpSetting,
  type FollowUpStep,
  type PlanItem,
} from "@/lib/follow-up-schedule";
import { createStopToken, readStopToken } from "@/lib/follow-up-token";
import { sitePhoneDisplay, sitePhoneTel } from "@/lib/site";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const LEAD_SELECT = "id, created_at, reference_number, name, email, status, service_type, message, follow_ups_paused, completed_at";
export const SEND_SELECT = "id, lead_id, step, scheduled_for, sent_at, status, error, recipient, attempts, created_at, updated_at";
const DAY_MS = 24 * 60 * 60 * 1000;
/** Leads older than this with nothing in progress can't have anything due (longest delay plus the stale limit). */
const LOOKBACK_MS = 100 * DAY_MS;
const MAX_LEADS = 500;
/** Keeps a run well inside the function time limit; anything left goes on the next run. */
const MAX_SENDS_PER_RUN = 20;
/** Resend allows a few requests a second. */
const SEND_SPACING_MS = 600;

type LeadRow = Omit<FollowUpLead, "quoted_at">;

export { MIN_LINK_SECRET_LENGTH };

export function linkSecretStatus(): LinkSecretStatus {
  return readLinkSecret(process.env).status;
}

/** Signs stop links. Without a usable one nothing is sent, so every email's stop link works. */
function stopLinkSecret() {
  return readLinkSecret(process.env).secret;
}

export function stopUrlFor(leadId: string) {
  const secret = stopLinkSecret();
  if (!secret) throw new Error("FOLLOW_UP_LINK_SECRET is not set");
  return `${siteUrl}/stop-emails?t=${createStopToken(leadId, secret)}`;
}

export function leadIdFromStopToken(token: string | null | undefined) {
  const secret = stopLinkSecret();
  return secret ? readStopToken(token, secret) : null;
}

/** Shown in test sends; the stop page explains that nothing was changed. */
export const EXAMPLE_STOP_URL = `${siteUrl}/stop-emails?t=example`;

export async function loadFollowUpSettings(admin: SupabaseClient = getSupabaseAdmin()): Promise<FollowUpSetting[]> {
  const { data, error } = await admin.from("follow_up_settings").select("step, enabled, delay_amount, delay_unit, subject, body");
  if (error) throw new Error(`Follow-up settings lookup failed: ${error.message}`);
  const rows = (data ?? []) as FollowUpSetting[];
  return FOLLOW_UP_STEPS.map((step) => rows.find((row) => row.step === step)).filter((row): row is FollowUpSetting => Boolean(row));
}

/** When each lead last became Quoted, for those currently Quoted. */
async function quotedTimes(admin: SupabaseClient, leads: LeadRow[]) {
  const quotedIds = leads.filter((lead) => lead.status === "quoted").map((lead) => lead.id);
  const times = new Map<string, string>();
  if (quotedIds.length === 0) return times;
  const { data, error } = await admin
    .from("lead_status_events")
    .select("lead_id, changed_at")
    .eq("to_status", "quoted")
    .in("lead_id", quotedIds)
    .order("changed_at", { ascending: false });
  if (error) throw new Error(`Status history lookup failed: ${error.message}`);
  for (const event of data ?? []) {
    if (!times.has(event.lead_id)) times.set(event.lead_id, event.changed_at);
  }
  return times;
}

export function withQuotedAt(leads: LeadRow[], times: Map<string, string>): FollowUpLead[] {
  return leads.map((lead) => ({ ...lead, follow_ups_paused: Boolean(lead.follow_ups_paused), quoted_at: times.get(lead.id) ?? null }));
}

export type FollowUpState = { settings: FollowUpSetting[]; leads: FollowUpLead[]; sends: FollowUpSendRow[] };

/** Every lead that could have a follow-up due or coming up, with its sends so far. */
export async function loadFollowUpState({ now, leadIds }: { now: Date; leadIds?: string[] }): Promise<FollowUpState> {
  const admin = getSupabaseAdmin();
  const since = new Date(now.getTime() - LOOKBACK_MS).toISOString();
  let query = admin
    .from("leads")
    .select(LEAD_SELECT)
    .not("email", "is", null)
    .neq("status", "spam")
    .or(`created_at.gte.${since},status.eq.quoted,completed_at.gte.${since}`)
    .order("created_at", { ascending: true })
    .limit(MAX_LEADS);
  if (leadIds) query = query.in("id", leadIds);

  const [settings, leadsResult] = await Promise.all([loadFollowUpSettings(admin), query]);
  if (leadsResult.error) throw new Error(`Lead lookup failed: ${leadsResult.error.message}`);
  const rows = (leadsResult.data ?? []) as LeadRow[];
  if (rows.length === 0) return { settings, leads: [], sends: [] };

  const ids = rows.map((lead) => lead.id);
  const [times, sendsResult] = await Promise.all([
    quotedTimes(admin, rows),
    admin.from("follow_up_sends").select(SEND_SELECT).in("lead_id", ids),
  ]);
  if (sendsResult.error) throw new Error(`Send lookup failed: ${sendsResult.error.message}`);
  return { settings, leads: withQuotedAt(rows, times), sends: (sendsResult.data ?? []) as FollowUpSendRow[] };
}

/** Sending rows older than 15 minutes: the outcome is unknown, so mark them failed and never resend. */
async function releaseStuckSends(admin: SupabaseClient, leadIds?: string[]) {
  const nowIso = new Date().toISOString();
  let query = admin
    .from("follow_up_sends")
    .update({ status: "failed", error: UNKNOWN_OUTCOME, attempts: MAX_ATTEMPTS, updated_at: nowIso })
    .eq("status", "sending")
    .lt("updated_at", new Date(Date.now() - STUCK_AFTER_MS).toISOString());
  if (leadIds) query = query.in("lead_id", leadIds);
  const { data, error } = await query.select("id");
  if (error) throw new Error(`Releasing stuck sends failed: ${error.message}`);
  return data?.length ?? 0;
}

export type PreparedEmail = { email: RenderedEmail; attachments: EmailAttachment[] };

/** A lead's follow-up, rendered with its job card and images ready to attach. */
export async function prepareForLead(setting: FollowUpSetting, lead: FollowUpLead, intendedRecipient: string | null): Promise<PreparedEmail> {
  const estimate = setting.step === "acknowledgement" ? estimateFromLead(lead.service_type, lead.message) : null;
  const images = await emailImages(houseImageFor(estimate?.addonKeys));
  const email = renderFollowUpEmail({
    step: setting.step,
    subject: setting.subject,
    body: setting.body,
    name: lead.name,
    serviceType: lead.service_type,
    phoneDisplay: sitePhoneDisplay,
    phoneHref: `tel:${sitePhoneTel}`,
    reviewUrl: readFollowUpConfig(process.env).reviewUrl,
    stopUrl: stopUrlFor(lead.id),
    intendedRecipient,
    estimate,
    jobCard: jobCardFor({ ...lead, stage: jobStage(lead) ?? STEP_STAGE[setting.step] }),
    images: images.sources,
  });
  return { email, attachments: images.attachments };
}

export type DeliveryResult = { ok: true; id: string } | { ok: false; unknown: boolean; message: string };

/** Errors where Resend may already have accepted the email: never retried. */
const UNKNOWN_OUTCOME_ERRORS = new Set(["application_error", "internal_server_error", "concurrent_idempotent_requests"]);

/** Missing settings that stop any email being sent. */
export function missingSendSettings() {
  const config = readFollowUpConfig(process.env);
  return [
    process.env.RESEND_API_KEY?.trim() ? null : "RESEND_API_KEY",
    config.from ? null : "FOLLOW_UP_FROM",
    config.replyTo ? null : "FOLLOW_UP_REPLY_TO",
    stopLinkSecret() ? null : "FOLLOW_UP_LINK_SECRET",
  ].filter((name): name is string => Boolean(name));
}

/**
 * Whether an estimator lead who leaves an email address will really get a copy
 * of their estimate: follow-ups on, everything needed to send set, and the
 * acknowledgement switched on. Anything uncertain counts as no.
 */
export async function estimateCopyAvailable(): Promise<boolean> {
  if (!readFollowUpConfig(process.env).enabled || missingSendSettings().length > 0) return false;
  try {
    const settings = await loadFollowUpSettings();
    return settings.some((setting) => setting.step === "acknowledgement" && setting.enabled);
  } catch (error) {
    console.error("follow-ups: couldn't check the acknowledgement setting", error instanceof Error ? error.message : error);
    return false;
  }
}

/** Test sends carry an example stop link rather than a signed one, so they don't need the link secret. */
export function testSendBlockers(missing: string[]) {
  return missing.filter((name) => name !== "FOLLOW_UP_LINK_SECRET");
}

/** Sends one follow-up through Resend. Callers check missingSendSettings() first. */
export async function deliverFollowUpEmail({
  to,
  email,
  attachments,
  stopUrl,
  step,
  idempotencyKey,
}: {
  to: string;
  email: RenderedEmail;
  attachments: EmailAttachment[];
  stopUrl: string;
  step: FollowUpStep;
  idempotencyKey?: string;
}): Promise<DeliveryResult> {
  const config = readFollowUpConfig(process.env);
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey || !config.from || !config.replyTo) {
    return { ok: false, unknown: false, message: `Not configured: ${missingSendSettings().join(", ")}` };
  }
  try {
    const { data, error } = await new Resend(apiKey).emails.send(
      {
        from: config.from,
        to: [to],
        replyTo: config.replyTo,
        subject: email.subject,
        html: email.html,
        text: email.text,
        headers: { "List-Unsubscribe": `<${stopUrl}>` },
        attachments,
        tags: [
          { name: "category", value: "follow_up" },
          { name: "step", value: step },
        ],
      },
      idempotencyKey ? { idempotencyKey } : undefined,
    );
    if (error) {
      return { ok: false, unknown: UNKNOWN_OUTCOME_ERRORS.has(error.name), message: `${error.name}: ${error.message}`.slice(0, 450) };
    }
    return { ok: true, id: data?.id ?? "" };
  } catch (error) {
    return { ok: false, unknown: true, message: error instanceof Error ? error.message.slice(0, 450) : "Unknown error" };
  }
}

/** Claims a step for this run. Null when another run has it, so it is never sent twice. */
async function claim(admin: SupabaseClient, item: Extract<PlanItem, { kind: "send" }>, recipient: string) {
  const nowIso = new Date().toISOString();
  if (item.retry) {
    const { data, error } = await admin
      .from("follow_up_sends")
      .update({ status: "sending", attempts: item.retry.attempts + 1, error: null, recipient, updated_at: nowIso })
      .eq("id", item.retry.id)
      .eq("status", "failed")
      .eq("attempts", item.retry.attempts)
      .select("id, attempts")
      .maybeSingle();
    if (error) throw new Error(`Claim failed: ${error.message}`);
    return data as { id: string; attempts: number } | null;
  }
  const { data, error } = await admin
    .from("follow_up_sends")
    .upsert(
      {
        lead_id: item.leadId,
        step: item.step,
        scheduled_for: item.dueAt.toISOString(),
        status: "sending",
        attempts: 1,
        recipient,
        updated_at: nowIso,
      },
      { onConflict: "lead_id,step", ignoreDuplicates: true },
    )
    .select("id, attempts");
  if (error) throw new Error(`Claim failed: ${error.message}`);
  return (data?.[0] as { id: string; attempts: number } | undefined) ?? null;
}

/** Re-reads the lead just before sending, so a pause or status change made mid-run still counts. */
async function stillDue(admin: SupabaseClient, item: Extract<PlanItem, { kind: "send" }>, lead: FollowUpLead, state: FollowUpState, now: Date) {
  const { data, error } = await admin.from("leads").select(LEAD_SELECT).eq("id", lead.id).maybeSingle();
  if (error || !data) return null;
  const fresh: FollowUpLead = { ...(data as LeadRow), follow_ups_paused: Boolean(data.follow_ups_paused), quoted_at: lead.quoted_at };
  const config = readFollowUpConfig(process.env);
  const again = planLead(fresh, state.settings, state.sends, config, now).find((next) => next.step === item.step);
  return again?.kind === "send" ? fresh : null;
}

export type FollowUpRunResult = {
  status: "ok" | "not-configured";
  sent: number;
  skipped: number;
  failed: number;
  stuck: number;
  deferred: number;
  missing?: string[];
};

/**
 * One run: release stuck sends, log due steps that must be skipped, then
 * send what is due. Every send is claimed in follow_up_sends first, so
 * overlapping or repeated runs can't send anything twice. `now` is only
 * moved for local testing; stuck detection always uses the real clock.
 */
export async function runFollowUps({ now = new Date(), leadIds }: { now?: Date; leadIds?: string[] } = {}): Promise<FollowUpRunResult> {
  const admin = getSupabaseAdmin();
  const config = readFollowUpConfig(process.env);
  const stuck = await releaseStuckSends(admin, leadIds);
  const state = await loadFollowUpState({ now, leadIds });
  const plan = state.leads.flatMap((lead) => planLead(lead, state.settings, state.sends, config, now));
  const result: FollowUpRunResult = { status: "ok", sent: 0, skipped: 0, failed: 0, stuck, deferred: 0 };

  for (const item of plan) {
    if (item.kind !== "skip") continue;
    const lead = state.leads.find((candidate) => candidate.id === item.leadId);
    const { data, error } = await admin
      .from("follow_up_sends")
      .upsert(
        {
          lead_id: item.leadId,
          step: item.step,
          scheduled_for: item.dueAt.toISOString(),
          status: "skipped",
          error: item.reason,
          recipient: lead?.email?.trim() ?? null,
        },
        { onConflict: "lead_id,step", ignoreDuplicates: true },
      )
      .select("id");
    if (error) console.error("follow-ups: failed to log a skip", error.message);
    else result.skipped += data?.length ?? 0;
  }

  const due = plan.filter((item): item is Extract<PlanItem, { kind: "send" }> => item.kind === "send");
  if (due.length === 0) return result;

  const missing = missingSendSettings();
  if (missing.length > 0) return { ...result, status: "not-configured", missing };

  for (const [index, item] of due.entries()) {
    if (index >= MAX_SENDS_PER_RUN) {
      result.deferred = due.length - index;
      break;
    }
    const planned = state.leads.find((candidate) => candidate.id === item.leadId);
    const setting = state.settings.find((candidate) => candidate.step === item.step);
    if (!planned || !setting) continue;
    const lead = await stillDue(admin, item, planned, state, now);
    if (!lead?.email) continue;

    const recipient = resolveRecipient(lead.email, config.testRecipient);
    const claimed = await claim(admin, item, recipient.to);
    if (!claimed) continue;

    if (index > 0) await new Promise((resolve) => setTimeout(resolve, SEND_SPACING_MS));
    const { email, attachments } = await prepareForLead(setting, lead, recipient.redirected ? recipient.intended : null);
    const delivery = await deliverFollowUpEmail({
      to: recipient.to,
      email,
      attachments,
      stopUrl: stopUrlFor(lead.id),
      step: item.step,
      idempotencyKey: `follow-up-${claimed.id}-${claimed.attempts}`,
    });

    const nowIso = new Date().toISOString();
    const update = delivery.ok
      ? { status: "sent", sent_at: nowIso, error: null, updated_at: nowIso }
      : delivery.unknown
        ? { status: "failed", error: UNKNOWN_OUTCOME, attempts: MAX_ATTEMPTS, updated_at: nowIso }
        : { status: "failed", error: delivery.message, updated_at: nowIso };
    if (!delivery.ok) console.error("follow-ups: send failed", item.step, delivery.message);
    const { error } = await admin.from("follow_up_sends").update(update).eq("id", claimed.id).eq("status", "sending");
    // Left at "sending", the row is released as an unknown outcome after 15 minutes; never resent.
    if (error) console.error("follow-ups: failed to record a send", error.message);

    if (delivery.ok) result.sent += 1;
    else result.failed += 1;
  }

  return result;
}
