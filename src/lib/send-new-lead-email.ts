import "server-only";
import { Resend } from "resend";

export type LeadNotificationPayload = {
  name: string;
  phone: string;
  email: string;
  postcode: string;
  serviceType: string;
  message: string;
};

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
export async function sendNewLeadEmail(lead: LeadNotificationPayload) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY");
  }

  const resend = new Resend(apiKey);
  const serviceLabel = lead.serviceType || "General enquiry";
  const subject = `New lead: ${lead.name} - ${serviceLabel}`;
  const adminLeadsUrl = `${appBaseUrl()}/admin/leads`;

  const rows: Array<[string, string]> = [
    ["Name", lead.name],
    ["Phone", lead.phone],
    ["Email", lead.email || "-"],
    ["Postcode", lead.postcode || "-"],
    ["Service", serviceLabel],
    ["Message", lead.message || "-"],
  ];

  const text = [
    "Blue Peak Solutions",
    "New website lead",
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    `Open in admin: ${adminLeadsUrl}`,
  ].join("\n");

  const detailRowsHtml = rows
    .map(
      ([label, value], index) => `
        <tr>
          <td style="padding: 12px 0; border-top: ${index === 0 ? "none" : "1px solid #3a3a3a"}; width: 120px; vertical-align: top; font-family: Inter, Helvetica, Arial, sans-serif; font-size: 12px; letter-spacing: 0.06em; text-transform: uppercase; color: #89cff0;">
            ${escapeHtml(label)}
          </td>
          <td style="padding: 12px 0; border-top: ${index === 0 ? "none" : "1px solid #3a3a3a"}; vertical-align: top; font-family: Inter, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.5; color: #f4f1ea;">
            ${escapeHtml(value)}
          </td>
        </tr>`,
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; background-color: #2a2a2a; border: 1px solid #3a3a3a;">
          <tr>
            <td style="padding: 28px 32px 20px; border-bottom: 2px solid #89cff0;">
              <p style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; line-height: 1.2; color: #f4f1ea;">
                Blue Peak Solutions
              </p>
              <p style="margin: 10px 0 0; font-family: Inter, Helvetica, Arial, sans-serif; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; color: #89cff0;">
                New website lead
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 32px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${detailRowsHtml}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color: #89cff0; border-radius: 4px;">
                    <a href="${escapeHtml(adminLeadsUrl)}" style="display: inline-block; padding: 14px 22px; font-family: Inter, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 600; color: #0a0a0a; text-decoration: none;">
                      Open in admin
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 16px 0 0; font-family: Inter, Helvetica, Arial, sans-serif; font-size: 12px; line-height: 1.5; color: #9a9a9a;">
                Or paste this link:<br />
                <a href="${escapeHtml(adminLeadsUrl)}" style="color: #89cff0; word-break: break-all;">${escapeHtml(adminLeadsUrl)}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
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
