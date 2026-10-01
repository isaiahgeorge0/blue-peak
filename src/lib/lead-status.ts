export const LEAD_STATUSES = [
  "new",
  "contacted",
  "quoted",
  "won",
  "lost",
  "spam",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

/** The only unactioned status: stalled-lead reminders fire while a lead is "new". */
export const UNACTIONED_STATUS: LeadStatus = "new";

export const SPAM_STATUS: LeadStatus = "spam";
