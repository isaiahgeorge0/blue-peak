import { ESTIMATE_CAVEAT, type EstimateRow } from "./estimate-summary.ts";
import type { FollowUpStep } from "./follow-up-schedule.ts";

/*
  Follow-up emails: the editable template filled in and wrapped in the Blue
  Peak layout, as HTML and plain text. Pure, so the admin's live preview and
  the sender render exactly the same thing.

  Template rules: {first_name}, {service} and {phone} anywhere; {review_link}
  in the review request's body; {estimate} in the acknowledgement's body.
  Blank lines separate paragraphs; a paragraph whose lines all start "1. ",
  "2. " is a numbered list.
*/

export const PLACEHOLDERS = ["first_name", "service", "phone"] as const;
export const REVIEW_LINK = "{review_link}";
export const ESTIMATE = "{estimate}";
export const ESTIMATE_HEADING = "Your estimate";
export const SIGN_OFF = "Kyle and Steven, Blue Peak";
export const STOP_LINK_TEXT = "Don't want these emails? Stop them here";

const NAVY = "#0e2240";
const BLUE_SOLUTION = "#1800ad";
const PEAK_FLEET = "#43b7d4";
const FROST = "#e9f7f7";
const MUTED = "#4a5d73";
const SANS = "Helvetica, Arial, sans-serif";
const SERIF = "'Times New Roman', Times, serif";

const TITLES = new Set(["mr", "mrs", "ms", "miss", "mx", "dr", "sir", "madam", "prof", "rev"]);

/** A first name fit for "Hi …": the first word of the name, if it looks like one. */
export function firstNameFrom(name: string | null | undefined): string | null {
  const first = (name ?? "").trim().split(/\s+/)[0] ?? "";
  if (TITLES.has(first.toLowerCase().replace(/\.$/, ""))) return null;
  if (!/^\p{L}[\p{L}'’-]{1,29}$/u.test(first)) return null;
  const oneCase = first === first.toLowerCase() || first === first.toUpperCase();
  return oneCase ? first.charAt(0).toUpperCase() + first.slice(1).toLowerCase() : first;
}

/** What {service} becomes: a phrase that reads after "about" or "for". */
const SERVICE_PHRASES: Record<string, string> = {
  "kitchen-renovations": "your kitchen renovation",
  "bathroom-renovations": "your bathroom renovation",
  extensions: "your extension",
  conservatories: "your conservatory",
  roofing: "your roofing work",
  flooring: "your flooring",
  "loft-conversions": "your loft conversion",
  "general-renovations": "your renovation",
};

export function servicePhrase(serviceType: string | null | undefined) {
  return SERVICE_PHRASES[serviceType?.trim() ?? ""] ?? "your project";
}

/** Problems that would stop a template being saved, in plain words. Empty when it is fine. */
export function templateProblems(step: FollowUpStep, subject: string, body: string): string[] {
  const problems: string[] = [];
  if (!subject.trim()) problems.push("The subject can't be empty.");
  else if (!/\p{L}/u.test(subject.replaceAll("{first_name}", ""))) {
    problems.push("The subject needs some words besides {first_name}, for leads without a usable name.");
  }
  if (!body.trim()) problems.push("The email can't be empty.");
  const allowed = (inBody: boolean) =>
    new Set<string>([
      ...PLACEHOLDERS,
      ...(inBody && step === "review_request" ? ["review_link"] : []),
      ...(inBody && step === "acknowledgement" ? ["estimate"] : []),
    ]);
  for (const [text, inBody] of [
    [subject, false],
    [body, true],
  ] as const) {
    const permitted = allowed(inBody);
    for (const match of text.matchAll(/\{([^{}]*)\}/g)) {
      if (!permitted.has(match[1])) {
        const where = inBody ? "the email" : "the subject";
        problems.push(
          match[1] === "review_link"
            ? `{review_link} can only go in the review request's email, not ${where}.`
            : match[1] === "estimate"
              ? `{estimate} can only go in the acknowledgement's email, not ${where}.`
              : `{${match[1]}} in ${where} isn't a placeholder. Use {first_name}, {service} or {phone}.`,
        );
      }
    }
    if (/[{}]/.test(text.replace(/\{[^{}]*\}/g, ""))) {
      problems.push(`Check the curly brackets in ${inBody ? "the email" : "the subject"}: each placeholder needs { and }.`);
    }
  }
  return [...new Set(problems)];
}

type Values = { firstName: string | null; service: string; phone: string };

/**
 * With no usable first name: greetings become "Hi there" ("Dear" becomes
 * "Hello"), a possessive becomes "your", and anywhere else the name drops out
 * with the comma or space that went with it, leaving the sentence readable.
 */
const NAME = "\u0000";

function withoutFirstName(text: string) {
  return text
    .replace(/\b(Hi|Hello|Hey),?[ \t]+\{first_name\}/gi, "$1 there")
    .replace(/\b(Dear)[ \t]+\{first_name\}/gi, (_match, dear: string) => (dear[0] === "D" ? "Hello" : "hello"))
    .split("\n")
    .map((line) => {
      if (!line.includes("{first_name}")) return line;
      return line
        .replaceAll("{first_name}", NAME)
        .replace(/(^|[.!?])([ \t]*)\u0000['’]s\b/g, "$1$2Your")
        .replace(/\u0000['’]s\b/g, "your")
        .replace(
          /(^|[.!?])[ \t]*\u0000[ \t]*[,.!?;:–—-]*[ \t]*(\p{Ll})?/gu,
          (_match, end: string, letter?: string) => `${end}${end ? " " : ""}${letter?.toUpperCase() ?? ""}`,
        )
        .replace(/,?[ \t]*\u0000/g, "")
        .replace(/[ \t]+([,.!?;:])/g, "$1")
        .replace(/,(?=[.!?;:,]|$)/g, "")
        .replace(/[ \t]{2,}/g, " ")
        .trim();
    })
    .join("\n");
}

/** Fills the placeholders. {review_link} and {estimate} are left for the layout to place. */
export function fillPlaceholders(text: string, values: Values) {
  let out = values.firstName ? text.replaceAll("{first_name}", values.firstName) : withoutFirstName(text);
  out = out.replaceAll("{service}", values.service).replaceAll("{phone}", values.phone);
  // Anything else in braces (blocked when saving) is removed rather than shown.
  return out.replace(/\{(?!(?:review_link|estimate)\})[^{}\n]*\}/g, "");
}

type Block =
  | { kind: "paragraph"; lines: string[] }
  | { kind: "list"; items: string[] }
  | { kind: "review" }
  | { kind: "estimate"; rows: EstimateRow[] };

function parseBody(body: string, withReviewButton: boolean, estimate: EstimateRow[] | null): Block[] {
  const blocks: Block[] = body
    .replace(/\r\n?/g, "\n")
    .split(/\n[ \t]*\n/)
    .map((paragraph) => (paragraph.trim() === ESTIMATE ? ESTIMATE : paragraph.replace(/[ \t]*\{estimate\}/g, "").trim()))
    .filter(Boolean)
    .flatMap((paragraph): Block[] => {
      if (paragraph === REVIEW_LINK) return [{ kind: "review" }];
      if (paragraph === ESTIMATE) return estimate ? [{ kind: "estimate", rows: estimate }] : [];
      const lines = paragraph.split("\n").map((line) => line.trim());
      if (lines.length > 0 && lines.every((line) => /^\d+[.)]\s+\S/.test(line))) {
        return [{ kind: "list", items: lines.map((line) => line.replace(/^\d+[.)]\s+/, "")) }];
      }
      return [{ kind: "paragraph", lines }];
    });
  if (withReviewButton && !body.includes(REVIEW_LINK)) blocks.push({ kind: "review" });
  // Without {estimate} in the template, the estimate follows the first paragraph after the greeting.
  if (estimate && !blocks.some((block) => block.kind === "estimate")) {
    const first = blocks[0];
    const greeting = first?.kind === "paragraph" && first.lines.length === 1 && first.lines[0].length <= 40 && first.lines[0].endsWith(",");
    blocks.splice(Math.min(greeting ? 2 : 1, blocks.length), 0, { kind: "estimate", rows: estimate });
  }
  return blocks;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export type FollowUpEmailInput = {
  step: FollowUpStep;
  subject: string;
  body: string;
  name: string | null;
  serviceType: string | null;
  phoneDisplay: string;
  phoneHref: string;
  reviewUrl: string | null;
  stopUrl: string;
  /** Set when the email goes to the test address instead: the customer it was meant for. */
  intendedRecipient: string | null;
  /** An estimator lead's checked estimate; shown in the acknowledgement only. */
  estimate?: EstimateRow[] | null;
  /** The mark: a cid: reference when sent, a data: URL in the admin preview. */
  markSrc: string;
};

export type RenderedEmail = { subject: string; html: string; text: string };

export const REVIEW_BUTTON_TEXT = "Leave a Google review";

export function renderFollowUpEmail(input: FollowUpEmailInput): RenderedEmail {
  const values: Values = {
    firstName: firstNameFrom(input.name),
    service: servicePhrase(input.serviceType),
    phone: input.phoneDisplay,
  };
  const subject = fillPlaceholders(input.subject, values).replace(/\s+/g, " ").trim() || "Blue Peak";
  const isReview = input.step === "review_request";
  const reviewHref = input.reviewUrl ?? "#";
  const estimate = input.step === "acknowledgement" && input.estimate?.length ? input.estimate : null;
  const blocks = parseBody(fillPlaceholders(input.body, values), isReview, estimate);

  const inlineHtml = (line: string) =>
    escapeHtml(line)
      .replaceAll(
        escapeHtml(input.phoneDisplay),
        `<a href="${escapeHtml(input.phoneHref)}" class="bp-link" style="color: ${BLUE_SOLUTION}; font-weight: bold; text-decoration: underline; white-space: nowrap;">${escapeHtml(input.phoneDisplay)}</a>`,
      )
      .replaceAll(
        REVIEW_LINK,
        `<a href="${escapeHtml(reviewHref)}" class="bp-link" style="color: ${BLUE_SOLUTION}; font-weight: bold; text-decoration: underline;">${REVIEW_BUTTON_TEXT}</a>`,
      );

  const blockHtml = blocks
    .map((block) => {
      if (block.kind === "estimate") {
        const rows = block.rows
          .map(
            (row, index) => `
                      <tr>
                        <td valign="top" class="bp-muted${index > 0 ? " bp-rule" : ""}" style="width: 38%; padding: 8px 12px 8px 0;${index > 0 ? " border-top: 1px solid #cfe3e6;" : ""} font-family: ${SANS}; font-size: 14px; line-height: 20px; color: ${MUTED};">${escapeHtml(row.label)}</td>
                        <td valign="top" class="bp-text${index > 0 ? " bp-rule" : ""}" style="padding: 8px 0;${index > 0 ? " border-top: 1px solid #cfe3e6;" : ""} font-family: ${SANS}; font-size: 15px; line-height: 22px; color: ${NAVY};${row.label === "Estimated from" ? " font-weight: bold;" : ""}">${escapeHtml(row.value)}</td>
                      </tr>`,
          )
          .join("");
        return `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bp-box" style="margin: 4px 0 22px; background-color: ${FROST}; border: 1px solid #cfe3e6; border-radius: 12px;">
                <tr>
                  <td style="padding: 18px 20px 4px;">
                    <p class="bp-text" style="margin: 0 0 6px; font-family: ${SERIF}; font-size: 20px; line-height: 26px; color: ${NAVY};">${ESTIMATE_HEADING}</p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}
                    </table>
                    <p class="bp-muted" style="margin: 8px 0 14px; font-family: ${SANS}; font-size: 13px; line-height: 20px; color: ${MUTED};">${escapeHtml(ESTIMATE_CAVEAT)}</p>
                  </td>
                </tr>
              </table>`;
      }
      if (block.kind === "review") {
        return `
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 8px 0 24px;">
                <tr>
                  <td class="bp-button" style="background-color: ${BLUE_SOLUTION}; border-radius: 999px;">
                    <a href="${escapeHtml(reviewHref)}" style="display: inline-block; padding: 14px 28px; font-family: ${SANS}; font-size: 16px; font-weight: bold; line-height: 20px; color: #ffffff; text-decoration: none; border-radius: 999px;">${REVIEW_BUTTON_TEXT}</a>
                  </td>
                </tr>
              </table>`;
      }
      if (block.kind === "list") {
        const rows = block.items
          .map(
            (item, index) => `
                <tr>
                  <td valign="top" style="width: 40px; padding: 0 0 14px;">
                    <div class="bp-number" style="width: 28px; height: 28px; border-radius: 14px; background-color: ${BLUE_SOLUTION}; color: #ffffff; font-family: ${SANS}; font-size: 14px; font-weight: bold; line-height: 28px; text-align: center;">${index + 1}</div>
                  </td>
                  <td valign="top" class="bp-text" style="padding: 3px 0 14px; font-family: ${SANS}; font-size: 16px; line-height: 24px; color: ${NAVY};">${inlineHtml(item)}</td>
                </tr>`,
          )
          .join("");
        return `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 4px 0 10px;">${rows}
              </table>`;
      }
      return `
              <p class="bp-text" style="margin: 0 0 18px; font-family: ${SANS}; font-size: 16px; line-height: 26px; color: ${NAVY};">${block.lines.map(inlineHtml).join("<br />")}</p>`;
    })
    .join("");

  const preheaderSource = blocks.find((block, index) => index > 0 && block.kind === "paragraph");
  const preheader = preheaderSource && preheaderSource.kind === "paragraph" ? preheaderSource.lines.join(" ").slice(0, 120) : "";

  const testBanner = input.intendedRecipient
    ? `
        <tr>
          <td class="bp-banner" style="padding: 12px 20px; background-color: ${FROST}; border: 2px dashed ${BLUE_SOLUTION}; border-radius: 12px; font-family: ${SANS}; font-size: 14px; line-height: 20px; color: ${NAVY};">
            <strong>Test email.</strong> In normal use this would have gone to <strong>${escapeHtml(input.intendedRecipient)}</strong>.
          </td>
        </tr>
        <tr><td style="height: 16px; line-height: 16px; font-size: 16px;">&nbsp;</td></tr>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>${escapeHtml(subject)}</title>
  <style>
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    @media (max-width: 520px) {
      .bp-pad { padding-left: 20px !important; padding-right: 20px !important; }
      .bp-heading { font-size: 24px !important; line-height: 30px !important; }
    }
    @media (prefers-color-scheme: dark) {
      .bp-page { background-color: #09162a !important; }
      .bp-card { background-color: ${NAVY} !important; border-color: #1a3e75 !important; }
      .bp-head { background-color: #09162a !important; }
      .bp-text, .bp-heading { color: ${FROST} !important; }
      .bp-muted { color: #b9c9d6 !important; }
      .bp-link { color: ${PEAK_FLEET} !important; }
      .bp-number { background-color: ${PEAK_FLEET} !important; color: ${NAVY} !important; }
      .bp-button { background-color: ${BLUE_SOLUTION} !important; border: 1px solid ${PEAK_FLEET} !important; }
      .bp-banner { background-color: #122c54 !important; color: ${FROST} !important; border-color: ${PEAK_FLEET} !important; }
      .bp-rule { border-color: #1a3e75 !important; }
      .bp-box { background-color: #122c54 !important; border-color: #1a3e75 !important; }
    }
  </style>
</head>
<body class="bp-page" style="margin: 0; padding: 0; background-color: ${FROST}; -webkit-text-size-adjust: 100%;">
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; mso-hide: all;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bp-page" style="background-color: ${FROST};">
    <tr>
      <td align="center" style="padding: 24px 12px 32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px;">${testBanner}
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bp-card" style="background-color: #ffffff; border: 1px solid #cfe3e6; border-radius: 16px; overflow: hidden;">
                <tr>
                  <td class="bp-head bp-pad" style="padding: 20px 32px; background-color: ${NAVY}; border-bottom: 4px solid ${BLUE_SOLUTION};">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding-right: 12px;"><img src="${escapeHtml(input.markSrc)}" width="40" height="40" alt="" style="display: block; width: 40px; height: 40px; border: 0; border-radius: 8px;" /></td>
                        <td style="font-family: ${SERIF}; font-size: 24px; line-height: 28px; color: ${FROST};">Blue Peak</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td class="bp-pad" style="padding: 32px 32px 12px;">
                    <h1 class="bp-heading" style="margin: 0 0 20px; font-family: ${SERIF}; font-size: 28px; font-weight: normal; line-height: 34px; color: ${NAVY};">${escapeHtml(subject)}</h1>${blockHtml}
                    <p class="bp-text" style="margin: 8px 0 24px; font-family: ${SERIF}; font-size: 20px; line-height: 26px; color: ${NAVY};">${SIGN_OFF}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="bp-pad" style="padding: 20px 32px 0; font-family: ${SANS}; font-size: 13px; line-height: 20px; color: ${MUTED};">
              <p class="bp-muted" style="margin: 0 0 6px; color: ${MUTED};">You're getting this because you contacted Blue Peak about building work.</p>
              <p class="bp-muted" style="margin: 0; color: ${MUTED};"><a href="${escapeHtml(input.stopUrl)}" class="bp-link" style="color: ${BLUE_SOLUTION}; text-decoration: underline;">${escapeHtml(STOP_LINK_TEXT)}</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textBlocks = blocks.map((block) => {
    if (block.kind === "estimate") {
      return [ESTIMATE_HEADING, ...block.rows.map((row) => `${row.label}: ${row.value}`), ESTIMATE_CAVEAT].join("\n");
    }
    if (block.kind === "review") return `${REVIEW_BUTTON_TEXT}: ${reviewHref}`;
    if (block.kind === "list") return block.items.map((item, index) => `${index + 1}. ${item}`).join("\n");
    return block.lines.join("\n").replaceAll(REVIEW_LINK, `${REVIEW_BUTTON_TEXT} (${reviewHref})`);
  });
  const text = [
    ...(input.intendedRecipient ? [`TEST EMAIL. In normal use this would have gone to ${input.intendedRecipient}.`, ""] : []),
    ...textBlocks.flatMap((block) => [block, ""]),
    SIGN_OFF,
    "",
    "--",
    "You're getting this because you contacted Blue Peak about building work.",
    `${STOP_LINK_TEXT}: ${input.stopUrl}`,
  ].join("\n");

  return { subject, html, text };
}
