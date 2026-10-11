import { ESTIMATE_CAVEAT, type EstimateRow } from "./estimate-summary.ts";
import { JOB_STAGES, stageSummary, type JobCard } from "./job-card.ts";

/*
  The Blue Peak frame every email shares: a 600px table layout (with an
  Outlook ghost table so it holds its width there), a navy header with the
  lockup and the 31° gable strip, a white body, and a navy footer. Images
  are passed in as sources: cid: references when sent, URLs in the admin
  preview. Pure, so the sender and the preview render the same thing.
*/

export const NAVY = "#0e2240";
export const BLUE_SOLUTION = "#1800ad";
export const PEAK_FLEET = "#43b7d4";
export const FROST = "#e9f7f7";
export const MUTED = "#4a5d73";
export const LINE = "#cfe3e6";
const LATER = "#d5dee6";
const FOOTER_TEXT = "#b9c9d6";
export const SERIF = "'Times New Roman', Times, serif";
export const SANS = "'Nunito Sans', Helvetica, Arial, sans-serif";
export const TAGLINE = "Everything under one roof.";
export const ESTIMATE_HEADING = "Your estimate";
const CONTENT_WIDTH = 520;

export type EmailImageSources = { logo: string; gable: string; house?: string | null };

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** A Blue Solution pill button. Outlook on Windows gets a VML version so it keeps its shape and colour. */
export function buttonHtml(href: string, label: string, { fullWidth = false }: { fullWidth?: boolean } = {}) {
  const h = escapeHtml(href);
  const l = escapeHtml(label);
  const vmlWidth = fullWidth ? CONTENT_WIDTH : Math.max(200, Math.round(label.length * 9.5 + 64));
  return `
              <table role="presentation" cellpadding="0" cellspacing="0" border="0"${fullWidth ? ' width="100%"' : ""} style="margin: 4px 0 16px;">
                <tr>
                  <td align="center" bgcolor="${BLUE_SOLUTION}" class="bp-button" style="border-radius: 999px; background-color: ${BLUE_SOLUTION};">
                    <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${h}" style="height:52px;v-text-anchor:middle;width:${vmlWidth}px;" arcsize="50%" stroke="f" fillcolor="${BLUE_SOLUTION}"><w:anchorlock/><center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">${l}</center></v:roundrect><![endif]-->
                    <!--[if !mso]><!--><a href="${h}" style="display: ${fullWidth ? "block" : "inline-block"}; padding: 16px 32px; font-family: ${SANS}; font-size: 16px; font-weight: bold; line-height: 20px; color: #ffffff; text-align: center; text-decoration: none; border-radius: 999px;">${l}</a><!--<![endif]-->
                  </td>
                </tr>
              </table>`;
}

/** Reference, what they asked about, the enquiry date and a five-stage tracker built from table cells. */
export function jobCardHtml(card: JobCard, label = "Your job") {
  const cells = JOB_STAGES.map((label, index) => {
    const number = index + 1;
    const state = number < card.stage ? "done" : number === card.stage ? "current" : "later";
    const bar = state === "done" ? BLUE_SOLUTION : state === "current" ? PEAK_FLEET : LATER;
    return `
                      <td width="20%" valign="top" style="width: 20%; padding: 0 ${index < JOB_STAGES.length - 1 ? 4 : 0}px 0 0;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr><td height="6" bgcolor="${bar}" class="bp-track-${state}" style="height: 6px; line-height: 6px; font-size: 6px; mso-line-height-rule: exactly; background-color: ${bar}; border-radius: 3px;">&nbsp;</td></tr>
                        </table>
                        <p class="${state === "later" ? "bp-muted" : "bp-text"}" style="margin: 6px 0 0; font-family: ${SANS}; font-size: 11px; line-height: 14px; color: ${state === "later" ? MUTED : NAVY};${state === "current" ? " font-weight: bold;" : ""}">${label}</p>
                      </td>`;
  }).join("");
  return `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bp-job" bgcolor="#ffffff" style="margin: 0 0 26px; background-color: #ffffff; border: 1px solid ${LINE}; border-radius: 12px;">
                <tr>
                  <td style="padding: 16px 20px 18px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td class="bp-muted" style="font-family: ${SANS}; font-size: 12px; line-height: 16px; letter-spacing: 0.08em; text-transform: uppercase; color: ${MUTED};">${escapeHtml(label)}</td>
                        <td align="right" class="bp-text" style="font-family: ${SANS}; font-size: 14px; line-height: 16px; font-weight: bold; letter-spacing: 0.04em; color: ${NAVY};">${escapeHtml(card.reference ?? "")}</td>
                      </tr>
                    </table>
                    <p class="bp-text bp-serif" style="margin: 8px 0 0; font-family: ${SERIF}; font-size: 20px; line-height: 26px; color: ${NAVY};">${escapeHtml(card.about)}</p>
                    <p class="bp-muted" style="margin: 2px 0 16px; font-family: ${SANS}; font-size: 14px; line-height: 20px; color: ${MUTED};">Enquired ${escapeHtml(card.enquiryDate)}</p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>${cells}
                      </tr>
                    </table>
                    <p class="bp-text" style="margin: 14px 0 0; font-family: ${SANS}; font-size: 14px; line-height: 20px; color: ${NAVY};"><strong>Stage ${card.stage} of ${JOB_STAGES.length}:</strong> ${JOB_STAGES[card.stage - 1]}</p>
                  </td>
                </tr>
              </table>`;
}

export function jobCardText(card: JobCard, label = "Your job") {
  return [card.reference ? `${label}: ${card.reference}` : label, `${card.about}, enquired ${card.enquiryDate}`, stageSummary(card.stage)].join("\n");
}

function houseAlt(rows: EstimateRow[]) {
  const work = rows.find((row) => row.label === "Work")?.value;
  return work ? `Your house as you built it in the estimator, with: ${work.toLowerCase()}` : "Your house as you built it in the estimator";
}

/** The estimate box: the house picture when there is one, the rows, and the estimator's caveat. */
export function estimateBoxHtml(rows: EstimateRow[], houseSrc: string | null | undefined) {
  const rowHtml = rows
    .map((row, index) => {
      const rule = index > 0 ? ` border-top: 1px solid ${LINE};` : "";
      return `
                      <tr>
                        <td valign="top" class="bp-muted${index > 0 ? " bp-rule" : ""}" style="width: 38%; padding: 8px 12px 8px 0;${rule} font-family: ${SANS}; font-size: 14px; line-height: 20px; color: ${MUTED};">${escapeHtml(row.label)}</td>
                        <td valign="top" class="bp-text${index > 0 ? " bp-rule" : ""}" style="padding: 8px 0;${rule} font-family: ${SANS}; font-size: 15px; line-height: 22px; color: ${NAVY};${row.label === "Estimated from" ? " font-weight: bold;" : ""}">${escapeHtml(row.value)}</td>
                      </tr>`;
    })
    .join("");
  const picture = houseSrc
    ? `
                    <img src="${escapeHtml(houseSrc)}" width="478" alt="${escapeHtml(houseAlt(rows))}" style="display: block; width: 100%; max-width: 478px; height: auto; margin: 4px 0 10px; border: 0; border-radius: 8px; font-family: ${SANS}; font-size: 13px; line-height: 18px; color: ${MUTED};" />`
    : "";
  return `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bp-box" bgcolor="${FROST}" style="margin: 4px 0 24px; background-color: ${FROST}; border: 1px solid ${LINE}; border-radius: 12px;">
                <tr>
                  <td style="padding: 18px 20px 4px;">
                    <p class="bp-text bp-serif" style="margin: 0 0 8px; font-family: ${SERIF}; font-size: 20px; line-height: 26px; color: ${NAVY};">${ESTIMATE_HEADING}</p>${picture}
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rowHtml}
                    </table>
                    <p class="bp-muted" style="margin: 8px 0 16px; font-family: ${SANS}; font-size: 13px; line-height: 20px; color: ${MUTED};">${escapeHtml(ESTIMATE_CAVEAT)}</p>
                  </td>
                </tr>
              </table>`;
}

export function estimateText(rows: EstimateRow[]) {
  return [ESTIMATE_HEADING, ...rows.map((row) => `${row.label}: ${row.value}`), ESTIMATE_CAVEAT].join("\n");
}

export function paragraphHtml(innerHtml: string, { size = 16, margin = "0 0 18px" }: { size?: number; margin?: string } = {}) {
  return `
              <p class="bp-text" style="margin: ${margin}; font-family: ${SANS}; font-size: ${size}px; line-height: ${Math.round(size * 1.6)}px; color: ${NAVY};">${innerHtml}</p>`;
}

export function signOffHtml(text: string) {
  return `
              <p class="bp-text bp-serif" style="margin: 8px 0 20px; font-family: ${SERIF}; font-size: 22px; line-height: 28px; color: ${NAVY};">${escapeHtml(text)}</p>`;
}

export type EmailDocument = {
  /** The <title> and the heading at the top of the body. */
  title: string;
  /** Inbox preview text. */
  preheader: string;
  /** Shown above the card, e.g. the test-redirect notice. */
  bannerHtml?: string;
  bodyHtml: string;
  phoneDisplay: string;
  phoneHref: string;
  /** Small print under the phone number (already HTML). */
  footerNotesHtml: string;
  images: EmailImageSources;
  /** Load Nunito Sans from Google Fonts where the client allows it. Off in the admin preview. */
  webFont?: boolean;
};

const PREHEADER_FILLER = "&#847;&zwnj;&nbsp;".repeat(40);

export function renderEmailDocument(doc: EmailDocument) {
  const fontLink = doc.webFont === false
    ? ""
    : `
  <!--[if !mso]><!--><link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;700&amp;display=swap" rel="stylesheet" /><!--<![endif]-->`;
  const banner = doc.bannerHtml
    ? `
          <tr>
            <td class="bp-banner" style="padding: 12px 20px; background-color: ${FROST}; border: 2px dashed ${BLUE_SOLUTION}; border-radius: 12px; font-family: ${SANS}; font-size: 14px; line-height: 20px; color: ${NAVY};">${doc.bannerHtml}</td>
          </tr>
          <tr><td style="height: 16px; line-height: 16px; font-size: 16px;">&nbsp;</td></tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>${escapeHtml(doc.title)}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <!--[if mso]><style>body, table, td, p, a, li { font-family: Arial, sans-serif !important; } .bp-serif { font-family: 'Times New Roman', Times, serif !important; }</style><![endif]-->${fontLink}
  <style>
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; }
    @media (max-width: 620px) {
      .bp-pad { padding-left: 20px !important; padding-right: 20px !important; }
      .bp-heading { font-size: 26px !important; line-height: 32px !important; }
    }
    @media (prefers-color-scheme: dark) {
      .bp-page { background-color: #050d1a !important; }
      .bp-body, .bp-job { background-color: #183a63 !important; }
      .bp-job { border-color: #2f5688 !important; }
      .bp-text, .bp-heading { color: ${FROST} !important; }
      .bp-muted { color: ${FOOTER_TEXT} !important; }
      .bp-link { color: ${PEAK_FLEET} !important; }
      .bp-box { background-color: #12305a !important; border-color: #2f5688 !important; }
      .bp-rule { border-color: #2f5688 !important; }
      .bp-track-done { background-color: ${FROST} !important; }
      .bp-track-later { background-color: #2c4a73 !important; }
      .bp-button { border: 1px solid ${PEAK_FLEET} !important; }
      .bp-banner { background-color: #122c54 !important; color: ${FROST} !important; border-color: ${PEAK_FLEET} !important; }
    }
    [data-ogsc] .bp-text, [data-ogsc] .bp-heading { color: ${FROST} !important; }
    [data-ogsc] .bp-muted { color: ${FOOTER_TEXT} !important; }
    [data-ogsc] .bp-link { color: ${PEAK_FLEET} !important; }
  </style>
</head>
<body class="bp-page" style="margin: 0; padding: 0; background-color: ${FROST};">
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; mso-hide: all;">${escapeHtml(doc.preheader)}${PREHEADER_FILLER}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bp-page" bgcolor="${FROST}" style="background-color: ${FROST};">
    <tr>
      <td align="center" style="padding: 24px 12px 32px;">
        <!--[if mso]><table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 600px;">${banner}
          <tr>
            <td align="center" bgcolor="${NAVY}" class="bp-head" style="padding: 30px 32px 14px; background-color: ${NAVY};">
              <img src="${escapeHtml(doc.images.logo)}" width="181" height="40" alt="Blue Peak" style="display: block; width: 181px; height: 40px; border: 0; font-family: ${SERIF}; font-size: 28px; line-height: 40px; color: ${FROST}; text-align: center;" />
            </td>
          </tr>
          <tr>
            <td bgcolor="#ffffff" class="bp-body" style="background-color: #ffffff; font-size: 0; line-height: 0;">
              <img src="${escapeHtml(doc.images.gable)}" width="600" alt="" style="display: block; width: 100%; max-width: 600px; height: auto; border: 0;" />
            </td>
          </tr>
          <tr>
            <td bgcolor="#ffffff" class="bp-body bp-pad" style="padding: 18px 40px 28px; background-color: #ffffff;">
              <h1 class="bp-heading bp-serif" style="margin: 0 0 22px; font-family: ${SERIF}; font-size: 30px; font-weight: normal; line-height: 36px; color: ${NAVY};">${escapeHtml(doc.title)}</h1>${doc.bodyHtml}
            </td>
          </tr>
          <tr>
            <td bgcolor="${NAVY}" class="bp-pad" style="padding: 32px 40px 36px; background-color: ${NAVY};">
              <p class="bp-serif" style="margin: 0 0 10px; font-family: ${SERIF}; font-size: 26px; font-style: italic; line-height: 32px; color: ${FROST};">${TAGLINE}</p>
              <p style="margin: 0 0 20px; font-family: ${SANS}; font-size: 16px; line-height: 22px; color: ${FROST};">Call <a href="${escapeHtml(doc.phoneHref)}" style="color: ${PEAK_FLEET}; font-weight: bold; text-decoration: none; white-space: nowrap;">${escapeHtml(doc.phoneDisplay)}</a></p>
              <div style="font-family: ${SANS}; font-size: 13px; line-height: 20px; color: ${FOOTER_TEXT};">${doc.footerNotesHtml}</div>
            </td>
          </tr>
        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Footer small print in the text version, matching the HTML footer. */
export function footerText(phoneDisplay: string, notes: string[]) {
  return ["--", TAGLINE, `Blue Peak. Call ${phoneDisplay}`, ...notes].join("\n");
}
