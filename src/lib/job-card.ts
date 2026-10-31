import type { FollowUpStep } from "./follow-up-schedule.ts";
import { servicePhrase } from "./service-phrase.ts";

/*
  The job card every email carries: the lead's reference, what they asked
  about, when, and where the job has got to.
*/

export const JOB_STAGES = ["Enquiry received", "In touch", "Quote sent", "Booked", "Finished"] as const;
export type JobStageNumber = 1 | 2 | 3 | 4 | 5;

export type JobCard = {
  /** CX-0001; null only if a lead somehow has no reference number. */
  reference: string | null;
  /** "Your kitchen renovation", or "Your project". */
  about: string;
  /** The enquiry date, e.g. "5 October 2026". */
  enquiryDate: string;
  stage: JobStageNumber;
};

/** CX-0001 style; numbers past 9999 simply get longer. */
export function formatLeadReference(referenceNumber: number) {
  return `CX-${String(referenceNumber).padStart(4, "0")}`;
}

/** Legacy BP-0001 form, still accepted in search so older notes keep working. */
function legacyLeadReference(referenceNumber: number) {
  return `BP-${String(referenceNumber).padStart(4, "0")}`;
}

/** The reference number a search means, from "CX-0007", "cx7", "CX 7", "BP-0007" or "0007"; null if it isn't one. */
export function referenceNumberFromQuery(query: string): number | null {
  const match = /^\s*(?:(?:cx|bp))?[\s-]*0*(\d{1,9})\s*$/i.exec(query);
  if (!match) return null;
  const value = Number(match[1]);
  return value > 0 ? value : null;
}

/** Whether a search matches a lead's reference: the number itself or any part of "CX-0007" (or legacy "BP-0007"). */
export function referenceMatches(query: string, referenceNumber: number | null | undefined) {
  if (!referenceNumber) return false;
  const wanted = referenceNumberFromQuery(query);
  if (wanted !== null) return wanted === referenceNumber;
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return false;
  return (
    formatLeadReference(referenceNumber).toLowerCase().includes(trimmed) ||
    legacyLeadReference(referenceNumber).toLowerCase().includes(trimmed)
  );
}

/** Where a job has got to, from its status and completion date. Lost and spam leads have no stage. */
export function jobStage(lead: { status: string | null; completed_at?: string | null }): JobStageNumber | null {
  if (lead.status === "lost" || lead.status === "spam") return null;
  if (lead.completed_at) return 5;
  switch (lead.status) {
    case "won":
      return 4;
    case "quoted":
      return 3;
    case "contacted":
      return 2;
    case "new":
      return 1;
    default:
      return null;
  }
}

/** The stage each customer email is written for; it matches the data, since each one only sends at that status. */
export const STEP_STAGE: Record<FollowUpStep, JobStageNumber> = {
  acknowledgement: 1,
  quote_chaser_1: 3,
  quote_chaser_2: 3,
  review_request: 5,
};

/** "Stage 3 of 5: Quote sent" */
export function stageSummary(stage: JobStageNumber) {
  return `Stage ${stage} of ${JOB_STAGES.length}: ${JOB_STAGES[stage - 1]}`;
}

const ENQUIRY_DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" });

export function jobCardFor(lead: {
  reference_number?: number | null;
  service_type: string | null;
  created_at: string;
  stage: JobStageNumber;
}): JobCard {
  const phrase = servicePhrase(lead.service_type);
  return {
    reference: lead.reference_number ? formatLeadReference(lead.reference_number) : null,
    about: phrase.charAt(0).toUpperCase() + phrase.slice(1),
    enquiryDate: ENQUIRY_DATE.format(new Date(lead.created_at)),
    stage: lead.stage,
  };
}
