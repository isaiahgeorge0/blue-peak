import { TEST_LEAD_IDS } from "./admin-leads.ts";

/*
  When each follow-up email is due, and whether it should be sent, skipped
  or left alone. Pure, so the cron runner, the admin screens and the tests
  all share it. Database rows come in, a plan comes out.
*/

export const FOLLOW_UP_STEPS = ["acknowledgement", "quote_chaser_1", "quote_chaser_2", "review_request"] as const;
export type FollowUpStep = (typeof FOLLOW_UP_STEPS)[number];

export const STEP_LABELS: Record<FollowUpStep, string> = {
  acknowledgement: "Acknowledgement",
  quote_chaser_1: "Quote chaser 1",
  quote_chaser_2: "Quote chaser 2",
  review_request: "Review request",
};

export type DelayUnit = "hours" | "days";

export type FollowUpSetting = {
  step: FollowUpStep;
  enabled: boolean;
  delay_amount: number;
  delay_unit: DelayUnit;
  subject: string;
  body: string;
};

export type FollowUpLead = {
  id: string;
  created_at: string;
  name: string | null;
  email: string | null;
  status: string | null;
  service_type: string | null;
  follow_ups_paused: boolean;
  completed_at: string | null;
  /** When the lead last moved to Quoted (lead_status_events), or null. */
  quoted_at: string | null;
};

export type FollowUpSendStatus = "sending" | "sent" | "skipped" | "failed";

export type FollowUpSendRow = {
  id: string;
  lead_id: string;
  step: FollowUpStep;
  scheduled_for: string;
  sent_at: string | null;
  status: FollowUpSendStatus;
  error: string | null;
  recipient: string | null;
  attempts: number;
  created_at: string;
  updated_at: string;
};

export type FollowUpConfig = {
  /** FOLLOW_UPS_ENABLED is exactly "true". */
  enabled: boolean;
  testRecipient: string | null;
  reviewUrl: string | null;
  from: string | null;
  replyTo: string | null;
};

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/** A failed send is retried on later runs until it has been tried this many times. */
export const MAX_ATTEMPTS = 3;
/** A row left at "sending" this long is assumed lost; it is never resent automatically. */
export const STUCK_AFTER_MS = 15 * 60 * 1000;
export const UNKNOWN_OUTCOME = "Outcome unknown, check before resending";
/** Anything more overdue than this is skipped rather than sent late. */
export const STALE_AFTER_MS: Record<FollowUpStep, number> = {
  acknowledgement: DAY_MS,
  quote_chaser_1: 3 * DAY_MS,
  quote_chaser_2: 3 * DAY_MS,
  review_request: 3 * DAY_MS,
};

/** Steps held to the sending window. The acknowledgement goes whenever it is due. */
const WINDOWED: Record<FollowUpStep, boolean> = {
  acknowledgement: false,
  quote_chaser_1: true,
  quote_chaser_2: true,
  review_request: true,
};

/** UK sending hours: 08:00 until 19:00, Monday to Saturday. */
export const WINDOW_OPENS_HOUR = 8;
export const WINDOW_CLOSES_HOUR = 19;

function envValue(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function readFollowUpConfig(env: Record<string, string | undefined>): FollowUpConfig {
  return {
    enabled: env.FOLLOW_UPS_ENABLED === "true",
    testRecipient: envValue(env.FOLLOW_UP_TEST_RECIPIENT),
    reviewUrl: envValue(env.GOOGLE_REVIEW_URL),
    from: envValue(env.FOLLOW_UP_FROM),
    replyTo: envValue(env.FOLLOW_UP_REPLY_TO),
  };
}

export function delayMs(amount: number, unit: DelayUnit) {
  return amount * (unit === "days" ? DAY_MS : HOUR_MS);
}

type UkParts = { year: number; month: number; day: number; hour: number; minute: number; weekday: number };

const UK_PARTS = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  weekday: "short",
  hourCycle: "h23",
});

const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** Wall-clock parts in UK time. weekday: 0 Sunday to 6 Saturday. */
export function ukParts(date: Date): UkParts {
  const parts = Object.fromEntries(UK_PARTS.formatToParts(date).map((part) => [part.type, part.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    weekday: WEEKDAYS[parts.weekday],
  };
}

/** The instant a UK wall-clock time occurs (never ambiguous at the hours used here). */
function ukWallTime(year: number, month: number, day: number, hour: number) {
  const guess = Date.UTC(year, month - 1, day, hour);
  const shown = ukParts(new Date(guess));
  const offset = Date.UTC(shown.year, shown.month - 1, shown.day, shown.hour, shown.minute) - guess;
  return new Date(guess - offset);
}

/** Midnight to midnight of the UK day `date` falls in. */
export function ukDayBounds(date: Date) {
  const { year, month, day } = ukParts(date);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  return {
    start: ukWallTime(year, month, day, 0),
    end: ukWallTime(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate(), 0),
  };
}

export function isInSendingWindow(date: Date) {
  const { weekday, hour } = ukParts(date);
  return weekday !== 0 && hour >= WINDOW_OPENS_HOUR && hour < WINDOW_CLOSES_HOUR;
}

/** `date` if it falls inside the sending window, otherwise when the next window opens. */
export function nextSendingWindow(date: Date): Date {
  if (isInSendingWindow(date)) return date;
  const { year, month, day, hour, weekday } = ukParts(date);
  // Before opening on a working day: today. Otherwise from tomorrow, passing over Sunday.
  let offsetDays = weekday !== 0 && hour < WINDOW_OPENS_HOUR ? 0 : 1;
  if ((weekday + offsetDays) % 7 === 0) offsetDays += 1;
  const target = new Date(Date.UTC(year, month - 1, day + offsetDays));
  return ukWallTime(target.getUTCFullYear(), target.getUTCMonth() + 1, target.getUTCDate(), WINDOW_OPENS_HOUR);
}

/** The moment a step's delay counts from, or null when the step doesn't apply (which is also how it stops). */
export function anchorFor(step: FollowUpStep, lead: FollowUpLead): string | null {
  switch (step) {
    case "acknowledgement":
      // Once a lead has moved on from New, someone has already been in touch.
      return lead.status === "new" ? lead.created_at : null;
    case "quote_chaser_1":
    case "quote_chaser_2":
      // Both chasers count from when the lead became Quoted; any later status change stops them.
      return lead.status === "quoted" ? lead.quoted_at : null;
    case "review_request":
      return lead.status === "won" ? lead.completed_at : null;
  }
}

/** When a step is due: its anchor plus the delay, moved into the sending window where that applies. */
export function dueAt(step: FollowUpStep, lead: FollowUpLead, setting: Pick<FollowUpSetting, "delay_amount" | "delay_unit">): Date | null {
  const anchor = anchorFor(step, lead);
  if (!anchor) return null;
  const due = new Date(new Date(anchor).getTime() + delayMs(setting.delay_amount, setting.delay_unit));
  return WINDOWED[step] ? nextSendingWindow(due) : due;
}

export function isTestLead(leadId: string) {
  return TEST_LEAD_IDS.has(leadId);
}

/**
 * Why a lead gets no follow-ups at all, or null if it can. Nothing is logged
 * for these: they are not "due and skipped", they simply never apply. The two
 * test leads only take part while every email is redirected to the test
 * address.
 */
export function leadExclusion(
  lead: Pick<FollowUpLead, "id" | "email" | "status" | "follow_ups_paused">,
  config: Pick<FollowUpConfig, "testRecipient">,
): "no-email" | "spam" | "test-lead" | "paused" | null {
  if (!lead.email?.trim()) return "no-email";
  if (lead.status === "spam") return "spam";
  if (isTestLead(lead.id) && !config.testRecipient) return "test-lead";
  if (lead.follow_ups_paused) return "paused";
  return null;
}

/** Why a due step is logged as skipped instead of sent, or null to send it. */
export function skipReason(step: FollowUpStep, setting: FollowUpSetting, config: FollowUpConfig, due: Date, now: Date): string | null {
  if (!config.enabled) return "Follow-ups are switched off (FOLLOW_UPS_ENABLED is not true)";
  if (!setting.enabled) return "This step is switched off in Follow-ups";
  if (step === "review_request" && !config.reviewUrl) return "GOOGLE_REVIEW_URL is not set";
  if (now.getTime() - due.getTime() > STALE_AFTER_MS[step]) {
    return step === "acknowledgement" ? "More than a day overdue" : "More than 3 days overdue";
  }
  return null;
}

export type PlanItem =
  | { kind: "scheduled"; leadId: string; step: FollowUpStep; at: Date }
  | { kind: "send"; leadId: string; step: FollowUpStep; dueAt: Date; retry: FollowUpSendRow | null }
  | { kind: "skip"; leadId: string; step: FollowUpStep; dueAt: Date; reason: string };

/** A failed row that a later run may try again. Rows whose outcome is unknown are never retried. */
export function isRetryable(row: FollowUpSendRow) {
  return row.status === "failed" && row.attempts < MAX_ATTEMPTS;
}

/**
 * What to do for one lead right now: steps to send, steps to log as skipped,
 * and steps still to come. A step with a row in follow_up_sends is finished
 * (sent, skipped, in flight or given up), unless it failed and may be retried.
 */
export function planLead(
  lead: FollowUpLead,
  settings: FollowUpSetting[],
  sends: FollowUpSendRow[],
  config: FollowUpConfig,
  now: Date,
): PlanItem[] {
  if (leadExclusion(lead, config)) return [];
  const items: PlanItem[] = [];

  for (const setting of settings) {
    const { step } = setting;
    const row = sends.find((send) => send.lead_id === lead.id && send.step === step) ?? null;
    if (row && !isRetryable(row)) continue;

    const due = dueAt(step, lead, setting);
    if (!due) continue;

    if (due > now) {
      items.push({ kind: "scheduled", leadId: lead.id, step, at: due });
      continue;
    }

    const reason = skipReason(step, setting, config, due, now);
    if (reason) {
      // A failed row stays failed; only fresh steps are logged as skipped.
      if (!row) items.push({ kind: "skip", leadId: lead.id, step, dueAt: due, reason });
      continue;
    }

    // Due, but the window closed before a run picked it up: wait for it to reopen.
    if (WINDOWED[step] && !isInSendingWindow(now)) {
      items.push({ kind: "scheduled", leadId: lead.id, step, at: nextSendingWindow(now) });
      continue;
    }

    items.push({ kind: "send", leadId: lead.id, step, dueAt: due, retry: row });
  }

  return items;
}

export type Recipient = { to: string; intended: string; redirected: boolean };

/** Where an email actually goes: the customer, or the test address with the customer shown in the email. */
export function resolveRecipient(email: string, testRecipient: string | null): Recipient {
  const intended = email.trim();
  return testRecipient
    ? { to: testRecipient, intended, redirected: true }
    : { to: intended, intended, redirected: false };
}
