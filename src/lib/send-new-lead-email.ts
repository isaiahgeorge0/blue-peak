import "server-only";
import { Resend } from "resend";
import { houseImageFor } from "@/lib/email-house-image";
import { emailImages } from "@/lib/email-images";
import { estimateFromLead } from "@/lib/estimate-summary";
import { jobCardFor } from "@/lib/job-card";
import { leadAlertRecipients } from "@/lib/lead-alert-recipients";
import { renderNewLeadEmail } from "@/lib/new-lead-email";
import { serviceLabel } from "@/lib/send-lead-push";
import { sitePhoneDisplay, sitePhoneTel } from "@/lib/site";

export type LeadNotificationPayload = {
  name: string;
  phone: string;
  email: string;
  postcode: string;
  serviceType: string;
  message: string;
};

/** The stored lead the alert is about: its id for the admin link, and its reference and date for the job card. */
export type StoredLead = { id: string; referenceNumber: number | null; createdAt: string };

const FALLBACK_SITE_URL = "https://blue-peak-omega.vercel.app";

function appBaseUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return FALLBACK_SITE_URL;
}

/**
 * Notify the inbox that a new website lead arrived.
 * Callers must catch failures so a Resend outage never blocks lead insert.
 */
export async function sendNewLeadEmail(lead: LeadNotificationPayload, stored: StoredLead) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY");
  }

  const estimate = estimateFromLead(lead.serviceType, lead.message);
  const images = await emailImages(houseImageFor(estimate?.addonKeys));
  const label = serviceLabel(lead.serviceType);
  const card = jobCardFor({ reference_number: stored.referenceNumber, service_type: lead.serviceType, created_at: stored.createdAt, stage: 1 });
  const { subject, html, text } = renderNewLeadEmail({
    ...lead,
    serviceLabel: label,
    estimate,
    jobCard: { ...card, about: label },
    adminUrl: `${appBaseUrl()}/admin/leads/${encodeURIComponent(stored.id)}`,
    phoneDisplay: sitePhoneDisplay,
    phoneHref: `tel:${sitePhoneTel}`,
    images: images.sources,
  });

  const recipients = leadAlertRecipients(process.env.LEAD_ALERT_TO);
  if (recipients.ignored.length > 0) {
    console.error("new-lead email: LEAD_ALERT_TO entries that aren't addresses were ignored:", recipients.ignored.join(", "));
  }

  const { error } = await new Resend(apiKey).emails.send({
    from: "Blue Peak Notifications <notifications@skapa.uk>",
    to: recipients.to,
    subject,
    text,
    html,
    attachments: images.attachments,
  });

  if (error) {
    throw new Error(error.message);
  }
}
