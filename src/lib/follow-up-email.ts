import {
  BLUE_SOLUTION,
  buttonHtml,
  escapeHtml,
  estimateBoxHtml,
  estimateText,
  footerText,
  jobCardHtml,
  jobCardText,
  NAVY,
  paragraphHtml,
  PEAK_FLEET,
  renderEmailDocument,
  SANS,
  signOffHtml,
  type EmailImageSources,
} from "./email-frame.ts";
import type { Estimate, EstimateRow } from "./estimate-summary.ts";
import type { FollowUpStep } from "./follow-up-schedule.ts";
import type { JobCard } from "./job-card.ts";
import { servicePhrase } from "./service-phrase.ts";

/*
  Follow-up emails: the editable template filled in and wrapped in the Blue
  Peak frame, as HTML and plain text. Pure, so the admin's live preview and
  the sender render exactly the same thing.

  Template rules: {first_name}, {service} and {phone} anywhere; {review_link}
  in the review request's body; {estimate} in the acknowledgement's body.
  Blank lines separate paragraphs; a paragraph whose lines all start "1. ",
  "2. " is a numbered list; a last paragraph starting "P.S." goes after the
  sign-off.
*/

export { servicePhrase };
export { ESTIMATE_HEADING } from "./email-frame.ts";

export const PLACEHOLDERS = ["first_name", "service", "phone"] as const;
export const REVIEW_LINK = "{review_link}";
export const ESTIMATE = "{estimate}";
export const SIGN_OFF = "Kyle and Steven, Blue Peak";
export const STOP_LINK_TEXT = "Don't want these emails? Stop them here";
export const WHY_YOU_GET_THIS = "You're getting this because you contacted Blue Peak about building work.";

const TITLES = new Set(["mr", "mrs", "ms", "miss", "mx", "dr", "sir", "madam", "prof", "rev"]);

/** A first name fit for "Hi …": the first word of the name, if it looks like one. */
export function firstNameFrom(name: string | null | undefined): string | null {
  const first = (name ?? "").trim().split(/\s+/)[0] ?? "";
  if (TITLES.has(first.toLowerCase().replace(/\.$/, ""))) return null;
  if (!/^\p{L}[\p{L}'’-]{1,29}$/u.test(first)) return null;
  const oneCase = first === first.toLowerCase() || first === first.toUpperCase();
  return oneCase ? first.charAt(0).toUpperCase() + first.slice(1).toLowerCase() : first;
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

export type TemplatePart = { text: string } | { placeholder: string };

/** A template split into plain text and placeholders, each placeholder named in words ({first_name} is "first name"). */
export function templateParts(template: string): TemplatePart[] {
  const parts: TemplatePart[] = [];
  let last = 0;
  for (const match of template.matchAll(/\{([a-z_]+)\}/g)) {
    if (match.index > last) parts.push({ text: template.slice(last, match.index) });
    parts.push({ placeholder: match[1].replaceAll("_", " ") });
    last = match.index + match[0].length;
  }
  if (last < template.length) parts.push({ text: template.slice(last) });
  return parts;
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

const PS_PATTERN = /^P\.?\s?S\b/i;

function parseBody(body: string, withReviewButton: boolean, estimate: EstimateRow[] | null): { blocks: Block[]; ps: string[] | null } {
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
  const last = blocks.at(-1);
  const ps = blocks.length > 1 && last?.kind === "paragraph" && PS_PATTERN.test(last.lines[0]) ? last.lines : null;
  if (ps) blocks.pop();
  if (withReviewButton && !body.includes(REVIEW_LINK)) blocks.push({ kind: "review" });
  // Without {estimate} in the template, the estimate follows the first paragraph after the greeting.
  if (estimate && !blocks.some((block) => block.kind === "estimate")) {
    const first = blocks[0];
    const greeting = first?.kind === "paragraph" && first.lines.length === 1 && first.lines[0].length <= 40 && first.lines[0].endsWith(",");
    blocks.splice(Math.min(greeting ? 2 : 1, blocks.length), 0, { kind: "estimate", rows: estimate });
  }
  return { blocks, ps };
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
  estimate?: Estimate | null;
  jobCard: JobCard;
  /** cid: references when sent, URLs in the admin preview. `house` is the estimate's picture, if any. */
  images: EmailImageSources;
  /** Off in the admin preview, whose page doesn't load outside fonts. */
  webFont?: boolean;
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
  const estimate = input.step === "acknowledgement" && input.estimate?.rows.length ? input.estimate : null;
  const { blocks, ps } = parseBody(fillPlaceholders(input.body, values), isReview, estimate?.rows ?? null);

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
      if (block.kind === "estimate") return estimateBoxHtml(block.rows, input.images.house);
      if (block.kind === "review") return buttonHtml(reviewHref, REVIEW_BUTTON_TEXT);
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
      return paragraphHtml(block.lines.map(inlineHtml).join("<br />"));
    })
    .join("");

  const preheaderSource = blocks.find((block, index) => index > 0 && block.kind === "paragraph");
  const preheader = preheaderSource && preheaderSource.kind === "paragraph" ? preheaderSource.lines.join(" ").slice(0, 120) : "";

  const html = renderEmailDocument({
    title: subject,
    preheader,
    bannerHtml: input.intendedRecipient
      ? `<strong>Test email.</strong> In normal use this would have gone to <strong>${escapeHtml(input.intendedRecipient)}</strong>.`
      : undefined,
    bodyHtml: [
      jobCardHtml(input.jobCard),
      blockHtml,
      signOffHtml(SIGN_OFF),
      ps ? paragraphHtml(ps.map(inlineHtml).join("<br />"), { size: 15, margin: "0" }) : "",
    ].join(""),
    phoneDisplay: input.phoneDisplay,
    phoneHref: input.phoneHref,
    footerNotesHtml: `${escapeHtml(WHY_YOU_GET_THIS)}<br /><a href="${escapeHtml(input.stopUrl)}" style="color: ${PEAK_FLEET}; text-decoration: underline;">${escapeHtml(STOP_LINK_TEXT)}</a>`,
    images: input.images,
    webFont: input.webFont,
  });

  const textBlocks = blocks.map((block) => {
    if (block.kind === "estimate") return estimateText(block.rows);
    if (block.kind === "review") return `${REVIEW_BUTTON_TEXT}: ${reviewHref}`;
    if (block.kind === "list") return block.items.map((item, index) => `${index + 1}. ${item}`).join("\n");
    return block.lines.join("\n").replaceAll(REVIEW_LINK, `${REVIEW_BUTTON_TEXT} (${reviewHref})`);
  });
  const text = [
    ...(input.intendedRecipient ? [`TEST EMAIL. In normal use this would have gone to ${input.intendedRecipient}.`, ""] : []),
    jobCardText(input.jobCard),
    "",
    ...textBlocks.flatMap((block) => [block, ""]),
    SIGN_OFF,
    "",
    ...(ps ? [ps.join("\n"), ""] : []),
    footerText(input.phoneDisplay, [WHY_YOU_GET_THIS, `${STOP_LINK_TEXT}: ${input.stopUrl}`]),
  ].join("\n");

  return { subject, html, text };
}
