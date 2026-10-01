import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { sendLeadAlert } from "@/lib/lead-alert";
import {
  LEAD_FIELD_LIMITS,
  LEAD_HONEYPOT_FIELD,
  LEAD_TURNSTILE_FIELD,
} from "@/lib/lead-limits";
import { sendNewLeadPush } from "@/lib/send-lead-push";
import {
  sendNewLeadEmail,
  type LeadNotificationPayload,
} from "@/lib/send-new-lead-email";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { isTurnstileEnforced, verifyTurnstileToken } from "@/lib/turnstile";

type LeadField = keyof typeof LEAD_FIELD_LIMITS;

const FIELD_LABELS: Record<LeadField, string> = {
  name: "name",
  phone: "phone number",
  email: "email",
  postcode: "postcode",
  service_type: "service",
  message: "message",
};

const RATE_LIMITS = [
  { windowMs: 10 * 60 * 1000, max: 3 },
  { windowMs: 24 * 60 * 60 * 1000, max: 10 },
] as const;

const GENERIC_ERROR =
  "Unable to submit your enquiry right now. Please try again later.";

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function clientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip");
  return ip || null;
}

function hashSubmitter(ip: string, salt: string) {
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

async function isRateLimited(submitterHash: string) {
  const longestWindow = Math.max(...RATE_LIMITS.map((limit) => limit.windowMs));
  const since = new Date(Date.now() - longestWindow).toISOString();

  const { data, error } = await getSupabaseAdmin()
    .from("leads")
    .select("created_at")
    .eq("submitter_hash", submitterHash)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(Math.max(...RATE_LIMITS.map((limit) => limit.max)));

  if (error) {
    // Fail open: a lookup error should not block a genuine customer.
    console.error("leads API: rate limit lookup failed", error.message);
    return false;
  }

  const now = Date.now();
  return RATE_LIMITS.some(
    (limit) =>
      (data ?? []).filter(
        (row) => now - new Date(row.created_at).getTime() < limit.windowMs,
      ).length >= limit.max,
  );
}

/** Email the inbox; on repeated failure, raise the separate failure alert. */
async function emailNewLead(leadId: string, lead: LeadNotificationPayload) {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await sendNewLeadEmail(lead);
      await getSupabaseAdmin()
        .from("leads")
        .update({ notified_at: new Date().toISOString() })
        .eq("id", leadId);
      return;
    } catch (error) {
      lastError = error;
      if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  const reason = lastError instanceof Error ? lastError.message : String(lastError);
  console.error("leads API: Resend notification failed", reason);

  try {
    const alerted = await sendLeadAlert(
      [
        "Blue Peak: a new website lead arrived but the notification email failed.",
        `Name: ${lead.name}`,
        `Phone: ${lead.phone}`,
        `Reason: ${reason}`,
        "The lead is saved in the admin leads list.",
      ].join("\n"),
    );
    if (!alerted) {
      console.error("leads API: no LEAD_ALERT_WEBHOOK_URL configured for fallback alert");
    }
  } catch (alertError) {
    console.error(
      "leads API: fallback alert failed",
      alertError instanceof Error ? alertError.message : alertError,
    );
  }
}

/** Routine ntfy push. Failures are logged only; the email path is independent. */
async function pushNewLead(lead: LeadNotificationPayload) {
  try {
    const sent = await sendNewLeadPush(lead);
    if (!sent) {
      console.error("leads API: no NTFY_TOPIC_URL configured for new-lead push");
    }
  } catch (error) {
    console.error(
      "leads API: ntfy push failed",
      error instanceof Error ? error.message : error,
    );
  }
}

export async function POST(request: Request) {
  try {
    let body: Record<string, unknown>;
    try {
      const parsed: unknown = await request.json();
      if (!parsed || typeof parsed !== "object") throw new Error("Not an object");
      body = parsed as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    // Bots fill every field; pretend it worked so they do not retry.
    if (asTrimmedString(body[LEAD_HONEYPOT_FIELD])) {
      return NextResponse.json({ success: true });
    }

    const ip = clientIp(request);

    // Human check. Rejections get the same fake success as the honeypot so a
    // bot learns nothing; real visitors can't submit without a token client-side.
    if (isTurnstileEnforced()) {
      const token = asTrimmedString(body[LEAD_TURNSTILE_FIELD]);
      if (!token) {
        console.warn("leads API: rejected submission with no Turnstile token");
        return NextResponse.json({ success: true });
      }
      const verdict = await verifyTurnstileToken(token, ip);
      if (verdict === "fail") {
        console.warn("leads API: rejected submission that failed Turnstile");
        return NextResponse.json({ success: true });
      }
      if (verdict === "unavailable") {
        console.error("leads API: Turnstile unavailable, accepting submission");
      }
    }

    const fields = Object.fromEntries(
      (Object.keys(LEAD_FIELD_LIMITS) as LeadField[]).map((key) => [
        key,
        asTrimmedString(body[key]),
      ]),
    ) as Record<LeadField, string>;

    if (!fields.name || !fields.phone) {
      return NextResponse.json(
        { error: "Name and phone are required." },
        { status: 400 },
      );
    }

    const tooLong = (Object.keys(LEAD_FIELD_LIMITS) as LeadField[]).find(
      (key) => fields[key].length > LEAD_FIELD_LIMITS[key],
    );
    if (tooLong) {
      return NextResponse.json(
        {
          error: `Please shorten your ${FIELD_LABELS[tooLong]} to ${LEAD_FIELD_LIMITS[tooLong]} characters or fewer.`,
        },
        { status: 400 },
      );
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !serviceRoleKey) {
      console.error("leads API: missing Supabase admin environment variables");
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 500 });
    }

    const submitterHash = ip ? hashSubmitter(ip, serviceRoleKey) : null;

    if (submitterHash && (await isRateLimited(submitterHash))) {
      return NextResponse.json(
        {
          error:
            "You've sent a few enquiries already. We'll be in touch, or call us if it's urgent.",
        },
        { status: 429 },
      );
    }

    const { data: inserted, error } = await getSupabaseAdmin()
      .from("leads")
      .insert({
        name: fields.name,
        phone: fields.phone,
        email: fields.email || null,
        postcode: fields.postcode || null,
        service_type: fields.service_type || null,
        message: fields.message || null,
        source: "website",
        status: "new",
        submitter_hash: submitterHash,
      })
      .select("id")
      .single();

    if (error || !inserted) {
      console.error("leads API: insert failed", error?.message);
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 500 });
    }

    const notification: LeadNotificationPayload = {
      name: fields.name,
      phone: fields.phone,
      email: fields.email,
      postcode: fields.postcode,
      serviceType: fields.service_type,
      message: fields.message,
    };
    // Both channels catch their own errors, so neither can fail the request.
    await Promise.all([
      emailNewLead(inserted.id, notification),
      pushNewLead(notification),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("leads API: unexpected error", error);
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 500 });
  }
}
