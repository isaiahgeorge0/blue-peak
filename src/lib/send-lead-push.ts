import "server-only";
import { getServiceBySlug } from "@/lib/content";
import { ESTIMATOR_SERVICE_TYPE } from "@/lib/lead-limits";
import type { LeadNotificationPayload } from "@/lib/send-new-lead-email";

const SUMMARY_MAX = 160;
const FALLBACK_SITE_URL = "https://blue-peak-omega.vercel.app";

export function serviceLabel(serviceType: string) {
  if (!serviceType) return "General enquiry";
  if (serviceType === ESTIMATOR_SERVICE_TYPE) return "Quote calculator";
  return getServiceBySlug(serviceType)?.name ?? serviceType;
}

/**
 * One line describing the lead. Estimator messages are a fixed set of short
 * "Label: value" lines (including the estimate figure), so they are joined in
 * full; free-text enquiries are collapsed and truncated.
 */
function summaryLine(lead: LeadNotificationPayload) {
  const lines = lead.message
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return "No message";

  if (lead.serviceType === ESTIMATOR_SERVICE_TYPE) {
    const details = lines.filter((line) => line.includes(":"));
    return (details.length ? details : lines).join(" · ");
  }

  const text = lines.join(" ");
  return text.length > SUMMARY_MAX
    ? `${text.slice(0, SUMMARY_MAX - 3).trimEnd()}...`
    : text;
}

type NtfyPush = {
  /** ASCII only: sent as an HTTP header. */
  title: string;
  /** ntfy tag / emoji shortcode, e.g. "house". */
  tags: string;
  message: string;
};

/**
 * POST to the ntfy topic (Tom and James both subscribe), opening the admin
 * leads list on tap. Returns false when NTFY_TOPIC_URL is not configured;
 * throws on a failed POST.
 */
export async function sendNtfyPush({
  title,
  tags,
  message,
}: NtfyPush): Promise<boolean> {
  const url = process.env.NTFY_TOPIC_URL?.trim();
  if (!url) return false;

  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || FALLBACK_SITE_URL
  ).replace(/\/$/, "");

  const response = await fetch(url, {
    method: "POST",
    // Header values must stay ASCII; the UTF-8 body carries names and "£".
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      Title: title,
      Tags: tags,
      Click: `${siteUrl}/admin/leads`,
    },
    body: message,
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    throw new Error(`ntfy responded ${response.status}`);
  }
  return true;
}

/** Routine new-lead push. */
export function sendNewLeadPush(lead: LeadNotificationPayload) {
  return sendNtfyPush({
    title: "New Blue Peak lead",
    tags: "house",
    message: [
      `${lead.name} · ${lead.phone}`,
      `Service: ${serviceLabel(lead.serviceType)}`,
      summaryLine(lead),
    ].join("\n"),
  });
}
