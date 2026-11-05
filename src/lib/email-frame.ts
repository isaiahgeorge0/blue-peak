import { ESTIMATE_CAVEAT, type EstimateRow } from "./estimate-summary.ts";
import { JOB_STAGES, stageSummary, type JobCard } from "./job-card.ts";

/*
  Two email layouts. Branded is the Cortex frame: a 600px table (with an
  Outlook ghost table so it holds its width there), a navy header with the
  lockup and the 31° gable strip, a white body, and a navy footer. Personal
  is the note Kyle sends himself: white page, a one-line job reference, the
  message, and his signature, with the same test-redirect banner and stop
  link. Images are passed in as sources: cid: references when sent, URLs in
  the admin preview. Pure, so the sender and the preview render the same thing.
*/

export const NAVY = "#0E1A30";
export const CORTEX_BLUE = "#1F6BFF";
/** Body links on white — darker than the button blue so small text passes 4.5:1. */
export const BLUE_SHADE = "#1449C4";
export const SKY = "#8DB6FF";
export const PLASTER = "#EEF1F4";
export const MUTED = "#5B636D";
export const LINE = "#D5DBE1";
const LATER = "#DDE2E8";
/** Silver. Readable on navy, and dark enough that Gmail's inversion still reads on a pale background. */
export const FOOTER_TEXT = "#C9D0D8";
/** Display size of public/email/logo.png (wordmark-white alone on navy). */
export const LOGO_WIDTH = 206;
export const LOGO_HEIGHT = 41;
/** Display size of public/email/signature-logo.png (white lockup on a navy rounded rectangle). */
export const SIGNATURE_LOGO_WIDTH = 180;
export const SIGNATURE_LOGO_HEIGHT = 52;
export const SIGNATURE_SITE = "https://cortexbuilding.co.uk";
export const SERIF = "'Times New Roman', Times, serif";
export const SANS = "'Nunito Sans', Helvetica, Arial, sans-serif";
export const TAGLINE = "Everything under one roof.";
export const ESTIMATE_HEADING = "Your estimate";
const CONTENT_WIDTH = 520;

const DARK_PAGE = "#060C17";
const DARK_BODY = "#16274A";
const DARK_BORDER = "#213A66";
const DARK_ESTIMATE = "#122140";
const DARK_LATER = "#2A3A58";

export type EmailImageSources = {
  logo: string;
  gable: string;
  house?: string | null;
  /** White lockup on a navy rounded rectangle, for the personal signature. */
  signature?: string;
  /** Solid navy tile. A background image, so Gmail's dark mode leaves the header and footer navy. */
  navy?: string;
};

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** A Cortex Blue pill button. Outlook on Windows gets a VML version so it keeps its shape and colour. */
export function buttonHtml(href: string, label: string, { fullWidth = false }: { fullWidth?: boolean } = {}) {
  const h = escapeHtml(href);
  const l = escapeHtml(label);
  const vmlWidth = fullWidth ? CONTENT_WIDTH : Math.max(200, Math.round(label.length * 9.5 + 64));
  return `
              <table role="presentation" cellpadding="0" cellspacing="0" border="0"${fullWidth ? ' width="100%"' : ""} style="margin: 4px 0 16px;">
                <tr>
                  <td align="center" bgcolor="${CORTEX_BLUE}" class="bp-button" style="border-radius: 999px; background-color: ${CORTEX_BLUE};">
                    <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${h}" style="height:52px;v-text-anchor:middle;width:${vmlWidth}px;" arcsize="50%" stroke="f" fillcolor="${CORTEX_BLUE}"><w:anchorlock/><center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">${l}</center></v:roundrect><![endif]-->
                    <!--[if !mso]><!--><a href="${h}" style="display: ${fullWidth ? "block" : "inline-block"}; padding: 16px 32px; font-family: ${SANS}; font-size: 16px; font-weight: bold; line-height: 20px; color: #ffffff; text-align: center; text-decoration: none; border-radius: 999px;">${l}</a><!--<![endif]-->
                  </td>
                </tr>
              </table>`;
}

/** Reference, what they asked about, the enquiry date and a five-stage tracker built from table cells. */
export function jobCardHtml(card: JobCard, label = "Your job") {
  const cells = JOB_STAGES.map((label, index) => {
    const number = index + 1;
    const filled = number <= card.stage;
    const state = filled ? "done" : "later";
    const bar = filled ? CORTEX_BLUE : LATER;
    const current = number === card.stage;
    return `
                      <td width="20%" valign="top" style="width: 20%; padding: 0 ${index < JOB_STAGES.length - 1 ? 4 : 0}px 0 0;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr><td height="6" bgcolor="${bar}" class="bp-track-${state}" style="height: 6px; line-height: 6px; font-size: 6px; mso-line-height-rule: exactly; background-color: ${bar}; border-radius: 3px;">&nbsp;</td></tr>
                        </table>
                        <p class="${filled ? "bp-text" : "bp-muted"}" style="margin: 6px 0 0; font-family: ${SANS}; font-size: 11px; line-height: 14px; color: ${filled ? NAVY : MUTED};${current ? " font-weight: bold;" : ""}">${label}</p>
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

/** One line in place of the job card: "CX-0042 · Your kitchen renovation · Quote sent". */
export function jobLineText(card: JobCard) {
  return [card.reference, card.about, JOB_STAGES[card.stage - 1]].filter(Boolean).join(" · ");
}

export function jobLineHtml(card: JobCard) {
  return `
              <p class="bp-jobline" style="margin: 0 0 18px; font-family: ${SANS}; font-size: 13px; line-height: 18px; color: ${MUTED};">${escapeHtml(jobLineText(card))}</p>`;
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
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bp-box" bgcolor="${PLASTER}" style="margin: 4px 0 24px; background-color: ${PLASTER}; border: 1px solid ${LINE}; border-radius: 12px;">
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

/** Kyle's signature, in place of the branded sign-off. One navy lockup, so it reads in light and dark. */
export function signatureHtml(images: Pick<EmailImageSources, "signature">, phoneDisplay: string, phoneHref: string) {
  const src = images.signature ?? "";
  const logo = src
    ? `
                <tr>
                  <td align="left" style="padding: 0 0 14px 0;">
                    <img src="${escapeHtml(src)}" width="${SIGNATURE_LOGO_WIDTH}" height="${SIGNATURE_LOGO_HEIGHT}" alt="Cortex Building" style="display: block; width: ${SIGNATURE_LOGO_WIDTH}px; height: ${SIGNATURE_LOGO_HEIGHT}px; margin: 0; border: 0;" />
                  </td>
                </tr>`
    : "";
  return `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bp-sig" style="margin: 0 0 4px;">${logo}
                <tr><td class="bp-sig-name bp-serif" style="font-family: ${SERIF}; font-size: 19px; line-height: 24px; color: ${NAVY};">Kyle Rice</td></tr>
                <tr><td class="bp-sig-role" style="padding: 4px 0 0; font-family: ${SANS}; font-size: 11px; font-weight: bold; letter-spacing: 2px; line-height: 16px; color: ${BLUE_SHADE};">DIRECTOR · CORTEX BUILDING</td></tr>
                <tr><td style="padding: 8px 0 0; font-family: ${SANS}; font-size: 13px; line-height: 18px; color: ${MUTED};"><a href="${escapeHtml(phoneHref)}" class="bp-sig-link" style="color: ${MUTED}; text-decoration: none; white-space: nowrap;">${escapeHtml(phoneDisplay)}</a> · <a href="${SIGNATURE_SITE}" class="bp-sig-link" style="color: ${MUTED}; text-decoration: none;">cortexbuilding.co.uk</a></td></tr>
                <tr><td class="bp-sig-tag bp-serif" style="padding: 8px 0 0; font-family: ${SERIF}; font-size: 14px; font-style: italic; line-height: 20px; color: ${BLUE_SHADE};">${TAGLINE}</td></tr>
              </table>`;
}

export function signatureText(phoneDisplay: string) {
  return ["Kyle Rice", "Director, Cortex Building", `${phoneDisplay} · cortexbuilding.co.uk`].join("\n");
}

export type EmailDocument = {
  /** Branded is the navy frame. Personal is Kyle's own note. Defaults to branded. */
  layout?: "branded" | "personal";
  /** The <title>, and the branded layout's heading. Personal emails leave the heading to the subject line. */
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
  const personal = doc.layout === "personal";
  const pageBg = personal ? "#ffffff" : PLASTER;
  const fontLink = doc.webFont === false
    ? ""
    : `
  <!--[if !mso]><!--><link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;700&amp;display=swap" rel="stylesheet" /><!--<![endif]-->`;
  const banner = doc.bannerHtml
    ? `
          <tr>
            <td class="bp-banner" style="padding: 12px 20px; background-color: ${PLASTER}; border: 2px dashed ${CORTEX_BLUE}; border-radius: 12px; font-family: ${SANS}; font-size: 14px; line-height: 20px; color: ${NAVY};">${doc.bannerHtml}</td>
          </tr>
          <tr><td style="height: 16px; line-height: 16px; font-size: 16px;">&nbsp;</td></tr>`
    : "";
  const navySrc = doc.images.navy ? escapeHtml(doc.images.navy) : "";
  const navyFill = navySrc ? ` background="${navySrc}"` : "";
  const navyImage = navySrc ? ` background-image: url('${navySrc}'); background-repeat: repeat;` : "";

  const brandedRows = `
          <tr>
            <td align="center" bgcolor="${NAVY}"${navyFill} class="bp-head" style="padding: 30px 32px 14px; background-color: ${NAVY};${navyImage}">
              <img src="${escapeHtml(doc.images.logo)}" width="${LOGO_WIDTH}" height="${LOGO_HEIGHT}" alt="Cortex Building" style="display: block; width: ${LOGO_WIDTH}px; height: ${LOGO_HEIGHT}px; border: 0; font-family: ${SERIF}; font-size: 28px; line-height: ${LOGO_HEIGHT}px; color: ${PLASTER}; text-align: center;" />
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
            <td bgcolor="${NAVY}"${navyFill} class="bp-pad" style="padding: 32px 40px 36px; background-color: ${NAVY};${navyImage}">
              <div class="gmail-screen"><div class="gmail-difference">
              <p class="bp-serif" style="margin: 0 0 10px; font-family: ${SERIF}; font-size: 26px; font-style: italic; line-height: 32px; color: ${PLASTER};">${TAGLINE}</p>
              <p style="margin: 0 0 20px; font-family: ${SANS}; font-size: 16px; line-height: 22px; color: ${PLASTER};">Call <a href="${escapeHtml(doc.phoneHref)}" style="color: ${SKY}; font-weight: bold; text-decoration: none; white-space: nowrap;">${escapeHtml(doc.phoneDisplay)}</a></p>
              </div></div>
              <div style="font-family: ${SANS}; font-size: 13px; line-height: 20px; color: ${FOOTER_TEXT};">${doc.footerNotesHtml}</div>
            </td>
          </tr>`;

  const personalRows = `
          <tr>
            <td bgcolor="#ffffff" class="bp-body bp-pad" style="padding: 18px 40px 28px; background-color: #ffffff;">${doc.bodyHtml}
              <p class="bp-fine bp-rule" style="margin: 20px 0 0; padding-top: 16px; border-top: 1px solid ${LINE}; font-family: ${SANS}; font-size: 12px; line-height: 18px; color: ${MUTED};">${doc.footerNotesHtml}</p>
            </td>
          </tr>`;

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
    .bp-link { color: ${BLUE_SHADE}; }
    u + .body .gmail-screen { background: #000; mix-blend-mode: screen; }
    u + .body .gmail-difference { background: #000; mix-blend-mode: difference; }
    @media (max-width: 620px) {
      .bp-pad { padding-left: 20px !important; padding-right: 20px !important; }
      .bp-heading { font-size: 26px !important; line-height: 32px !important; }
    }
    @media (prefers-color-scheme: dark) {
      .bp-page { background-color: ${DARK_PAGE} !important; }
      .bp-body, .bp-job { background-color: ${DARK_BODY} !important; }
      .bp-job { border-color: ${DARK_BORDER} !important; }
      .bp-text, .bp-heading, .bp-jobline, .bp-sig-name, .bp-sig-role, .bp-sig-tag, .bp-fine { color: ${PLASTER} !important; }
      .bp-muted { color: ${FOOTER_TEXT} !important; }
      .bp-link, .bp-sig-link, .bp-fine-link { color: ${SKY} !important; }
      .bp-box { background-color: ${DARK_ESTIMATE} !important; border-color: ${DARK_BORDER} !important; }
      .bp-rule { border-color: ${DARK_BORDER} !important; }
      .bp-track-done { background-color: ${SKY} !important; }
      .bp-track-later { background-color: ${DARK_LATER} !important; }
      .bp-button { border: 1px solid ${SKY} !important; }
      .bp-banner { background-color: ${DARK_ESTIMATE} !important; color: ${PLASTER} !important; border-color: ${SKY} !important; }
    }
    [data-ogsc] .bp-text, [data-ogsc] .bp-heading, [data-ogsc] .bp-jobline, [data-ogsc] .bp-sig-name, [data-ogsc] .bp-sig-role, [data-ogsc] .bp-sig-tag, [data-ogsc] .bp-fine { color: ${PLASTER} !important; }
    [data-ogsc] .bp-muted { color: ${FOOTER_TEXT} !important; }
    [data-ogsc] .bp-link, [data-ogsc] .bp-sig-link, [data-ogsc] .bp-fine-link { color: ${SKY} !important; }
    [data-ogsc] .bp-track-done { background-color: ${SKY} !important; }
    [data-ogsc] .bp-track-later { background-color: ${DARK_LATER} !important; }
  </style>
</head>
<body class="bp-page body" style="margin: 0; padding: 0; background-color: ${pageBg};">
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; mso-hide: all;">${escapeHtml(doc.preheader)}${PREHEADER_FILLER}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bp-page" bgcolor="${pageBg}" style="background-color: ${pageBg};">
    <tr>
      <td align="center" style="padding: 24px 12px 32px;">
        <!--[if mso]><table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 600px;">${banner}${personal ? personalRows : brandedRows}
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
  return ["--", TAGLINE, `Cortex Building. Call ${phoneDisplay}`, ...notes].join("\n");
}
