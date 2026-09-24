import "server-only";
import { Resend } from "resend";
import { siteUrl } from "@/lib/content";

export type LeadNotificationPayload = {
  name: string;
  phone: string;
  email: string;
  postcode: string;
  serviceType: string;
  message: string;
};

function appBaseUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return siteUrl.replace(/\/$/, "");
}

/**
 * Notify the inbox that a new website lead arrived.
 * Callers must catch failures so a Resend outage never blocks lead insert.
 */
export async function sendNewLeadEmail(lead: LeadNotificationPayload) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY");
  }

  const resend = new Resend(apiKey);
  const serviceLabel = lead.serviceType || "General enquiry";
  const subject = `New lead: ${lead.name} - ${serviceLabel}`;
  const adminLeadsUrl = `${appBaseUrl()}/admin/leads`;

  const text = [
    "A new quote request came in from the Blue Peak website.",
    "",
    `Name: ${lead.name}`,
    `Phone: ${lead.phone}`,
    `Email: ${lead.email || "-"}`,
    `Postcode: ${lead.postcode || "-"}`,
    `Service: ${serviceLabel}`,
    `Message: ${lead.message || "-"}`,
    "",
    `Open leads: ${adminLeadsUrl}`,
  ].join("\n");

  const html = `
    <div style="font-family: system-ui, sans-serif; line-height: 1.5; color: #111;">
      <p>A new quote request came in from the Blue Peak website.</p>
      <ul>
        <li><strong>Name:</strong> ${escapeHtml(lead.name)}</li>
        <li><strong>Phone:</strong> ${escapeHtml(lead.phone)}</li>
        <li><strong>Email:</strong> ${escapeHtml(lead.email || "-")}</li>
        <li><strong>Postcode:</strong> ${escapeHtml(lead.postcode || "-")}</li>
        <li><strong>Service:</strong> ${escapeHtml(serviceLabel)}</li>
        <li><strong>Message:</strong> ${escapeHtml(lead.message || "-")}</li>
      </ul>
      <p><a href="${adminLeadsUrl}">Open admin leads</a></p>
    </div>
  `.trim();

  const { error } = await resend.emails.send({
    from: "Blue Peak Notifications <notifications@skapa.uk>",
    to: ["isaiah120303@gmail.com"],
    subject,
    text,
    html,
  });

  if (error) {
    throw new Error(error.message);
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
