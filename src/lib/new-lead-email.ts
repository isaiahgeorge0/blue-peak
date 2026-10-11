import {
  BLUE_SOLUTION,
  buttonHtml,
  escapeHtml,
  estimateBoxHtml,
  estimateText,
  footerText,
  jobCardHtml,
  jobCardText,
  LINE,
  MUTED,
  NAVY,
  renderEmailDocument,
  SANS,
  type EmailImageSources,
} from "./email-frame.ts";
import type { Estimate } from "./estimate-summary.ts";
import { firstNameFrom, type RenderedEmail } from "./follow-up-email.ts";
import type { JobCard } from "./job-card.ts";

/*
  The new-lead alert to Kyle and Steven, in the same frame as the customer
  emails: the job card, the customer's details with tap-to-call and
  mailto links, an estimator lead's checked estimate with its house picture,
  and buttons to call the customer or open the lead in the admin. Pure, so
  it can be tested and previewed.
*/

export const ALERT_CARD_LABEL = "New lead";
export const ALERT_FOOTER_NOTE = "Sent to Kyle and Steven for every new website enquiry.";

export type NewLeadEmailInput = {
  name: string;
  phone: string;
  email: string;
  postcode: string;
  /** Human label, e.g. "Kitchen renovations" or "Quote calculator". */
  serviceLabel: string;
  message: string;
  /** An estimator lead's checked estimate; shown instead of the raw message. */
  estimate: Estimate | null;
  jobCard: JobCard;
  adminUrl: string;
  /** Blue Peak's own number, for the footer. */
  phoneDisplay: string;
  phoneHref: string;
  images: EmailImageSources;
  webFont?: boolean;
};

/** A tel: link for a typed phone number, or null if it has no digits worth dialling. */
export function telHref(phone: string) {
  const digits = phone.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");
  return digits.replace(/\D/g, "").length >= 6 ? `tel:${digits}` : null;
}

function looksLikeEmail(value: string) {
  return /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>".]+$/.test(value);
}

const linkStyle = `color: ${BLUE_SOLUTION}; font-weight: bold; text-decoration: underline;`;

export function renderNewLeadEmail(input: NewLeadEmailInput): RenderedEmail {
  const name = input.name.trim() || "Someone";
  const callName = firstNameFrom(name) ?? name;
  const tel = telHref(input.phone);
  const mailto = looksLikeEmail(input.email) ? `mailto:${input.email}` : null;
  const reference = input.jobCard.reference;
  const subject = `New lead${reference ? ` ${reference}` : ""}: ${name}, ${input.serviceLabel}`;
  const showMessage = !input.estimate && input.message.trim().length > 0;

  const details: [string, string][] = [
    ["Name", escapeHtml(name)],
    ["Phone", tel ? `<a href="${escapeHtml(tel)}" class="bp-link" style="${linkStyle} white-space: nowrap;">${escapeHtml(input.phone)}</a>` : escapeHtml(input.phone)],
    ["Email", input.email ? (mailto ? `<a href="${escapeHtml(mailto)}" class="bp-link" style="${linkStyle} word-break: break-all;">${escapeHtml(input.email)}</a>` : escapeHtml(input.email)) : "Not given"],
    ["Postcode", escapeHtml(input.postcode || "Not given")],
    ["Service", escapeHtml(input.serviceLabel)],
    ...(showMessage ? ([["Message", escapeHtml(input.message.trim()).replace(/\r?\n/g, "<br />")]] as [string, string][]) : []),
  ];
  const detailsHtml = `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 24px;">${details
                .map(
                  ([label, value], index) => `
                <tr>
                  <td valign="top" class="bp-muted${index > 0 ? " bp-rule" : ""}" style="width: 30%; padding: 10px 12px 10px 0;${index > 0 ? ` border-top: 1px solid ${LINE};` : ""} font-family: ${SANS}; font-size: 14px; line-height: 22px; color: ${MUTED};">${label}</td>
                  <td valign="top" class="bp-text${index > 0 ? " bp-rule" : ""}" style="padding: 10px 0;${index > 0 ? ` border-top: 1px solid ${LINE};` : ""} font-family: ${SANS}; font-size: 16px; line-height: 24px; color: ${NAVY};">${value}</td>
                </tr>`,
                )
                .join("")}
              </table>`;

  const buttons = [tel ? buttonHtml(tel, `Call ${callName}`, { fullWidth: true }) : "", buttonHtml(input.adminUrl, "Open in admin", { fullWidth: true })].join("");

  const html = renderEmailDocument({
    title: `New lead: ${name}`,
    preheader: [input.phone, input.serviceLabel].filter(Boolean).join(" · "),
    bodyHtml: [
      jobCardHtml(input.jobCard, ALERT_CARD_LABEL),
      detailsHtml,
      input.estimate ? estimateBoxHtml(input.estimate.rows, input.images.house) : "",
      buttons,
    ].join(""),
    phoneDisplay: input.phoneDisplay,
    phoneHref: input.phoneHref,
    footerNotesHtml: escapeHtml(ALERT_FOOTER_NOTE),
    images: input.images,
    webFont: input.webFont,
  });

  const text = [
    jobCardText(input.jobCard, ALERT_CARD_LABEL),
    "",
    `Name: ${name}`,
    `Phone: ${input.phone}`,
    `Email: ${input.email || "Not given"}`,
    `Postcode: ${input.postcode || "Not given"}`,
    `Service: ${input.serviceLabel}`,
    ...(showMessage ? ["", "Message:", input.message.trim()] : []),
    ...(input.estimate ? ["", estimateText(input.estimate.rows)] : []),
    "",
    ...(tel ? [`Call ${callName}: ${input.phone}`] : []),
    `Open in admin: ${input.adminUrl}`,
    "",
    footerText(input.phoneDisplay, [ALERT_FOOTER_NOTE]),
  ].join("\n");

  return { subject, html, text };
}
