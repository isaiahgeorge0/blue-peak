import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  delayMs,
  dueAt,
  isInSendingWindow,
  leadExclusion,
  MAX_ATTEMPTS,
  nextSendingWindow,
  planLead,
  readFollowUpConfig,
  resolveRecipient,
  ukDayBounds,
  type FollowUpConfig,
  type FollowUpLead,
  type FollowUpSendRow,
  type FollowUpSetting,
  type FollowUpStep,
} from "./follow-up-schedule.ts";
import { createStopToken, readStopToken } from "./follow-up-token.ts";

const LEAD_ID = "11111111-2222-4333-8444-555555555555";
const TEST_LEAD = "670a5941-ea8f-43b7-b518-9562a6068d19";

const SETTINGS: FollowUpSetting[] = [
  { step: "acknowledgement", enabled: true, delay_amount: 0, delay_unit: "hours", subject: "s", body: "b" },
  { step: "quote_chaser_1", enabled: true, delay_amount: 3, delay_unit: "days", subject: "s", body: "b" },
  { step: "quote_chaser_2", enabled: true, delay_amount: 10, delay_unit: "days", subject: "s", body: "b" },
  { step: "review_request", enabled: true, delay_amount: 3, delay_unit: "days", subject: "s", body: "b" },
];

const CONFIG: FollowUpConfig = {
  enabled: true,
  testRecipient: null,
  reviewUrl: "https://g.page/r/example/review",
  from: "Blue Peak <hello@example.com>",
  replyTo: "hello@example.com",
};

function lead(overrides: Partial<FollowUpLead> = {}): FollowUpLead {
  return {
    id: LEAD_ID,
    created_at: "2026-10-12T09:00:00Z",
    name: "Jo Bloggs",
    email: "jo@example.com",
    status: "new",
    service_type: "kitchen-renovations",
    follow_ups_paused: false,
    completed_at: null,
    quoted_at: null,
    ...overrides,
  };
}

function row(step: FollowUpStep, overrides: Partial<FollowUpSendRow> = {}): FollowUpSendRow {
  return {
    id: `row-${step}`,
    lead_id: LEAD_ID,
    step,
    scheduled_for: "2026-10-12T09:00:00Z",
    sent_at: null,
    status: "sent",
    error: null,
    recipient: "jo@example.com",
    attempts: 1,
    created_at: "2026-10-12T09:00:00Z",
    updated_at: "2026-10-12T09:00:00Z",
    ...overrides,
  };
}

const at = (iso: string) => new Date(iso);
const plan = (l: FollowUpLead, now: string, sends: FollowUpSendRow[] = [], config = CONFIG, settings = SETTINGS) =>
  planLead(l, settings, sends, config, at(now));
const kinds = (items: ReturnType<typeof plan>) => items.map((item) => `${item.step}:${item.kind}`);

describe("delays", () => {
  test("hours and days", () => {
    assert.equal(delayMs(0, "hours"), 0);
    assert.equal(delayMs(5, "hours"), 5 * 3_600_000);
    assert.equal(delayMs(3, "days"), 3 * 86_400_000);
  });

  test("chaser 1 is 3 days and chaser 2 is 10 days after the lead became Quoted", () => {
    const quoted = lead({ status: "quoted", quoted_at: "2026-10-13T10:00:00Z" }); // Tuesday 11:00 BST
    assert.equal(dueAt("quote_chaser_1", quoted, SETTINGS[1])?.toISOString(), "2026-10-16T10:00:00.000Z");
    assert.equal(dueAt("quote_chaser_2", quoted, SETTINGS[2])?.toISOString(), "2026-10-23T10:00:00.000Z");
  });

  test("chaser 2 counts from Quoted, not from when chaser 1 went", () => {
    const quoted = lead({ status: "quoted", quoted_at: "2026-10-13T10:00:00Z" });
    const lateChaser1 = row("quote_chaser_1", { sent_at: "2026-10-19T08:05:00Z" });
    const items = plan(quoted, "2026-10-20T10:00:00Z", [row("acknowledgement"), lateChaser1]);
    assert.deepEqual(items, [{ kind: "scheduled", leadId: LEAD_ID, step: "quote_chaser_2", at: at("2026-10-23T10:00:00Z") }]);
  });
});

describe("sending window (08:00 to 19:00 UK, Monday to Saturday)", () => {
  test("inside the window is unchanged", () => {
    assert.equal(nextSendingWindow(at("2026-10-14T12:00:00Z")).toISOString(), "2026-10-14T12:00:00.000Z");
    assert.ok(isInSendingWindow(at("2026-10-17T17:59:00Z"))); // Saturday 18:59 BST
  });

  test("before 08:00 waits until 08:00 the same day", () => {
    // Wednesday 07:59 BST = 06:59 UTC
    assert.equal(nextSendingWindow(at("2026-10-14T06:59:00Z")).toISOString(), "2026-10-14T07:00:00.000Z");
  });

  test("19:00 exactly is closed; waits until 08:00 the next day", () => {
    // Wednesday 19:00 BST = 18:00 UTC
    assert.equal(isInSendingWindow(at("2026-10-14T18:00:00Z")), false);
    assert.equal(nextSendingWindow(at("2026-10-14T18:00:00Z")).toISOString(), "2026-10-15T07:00:00.000Z");
  });

  test("Saturday evening and all of Sunday wait until Monday 08:00", () => {
    assert.equal(nextSendingWindow(at("2026-10-17T18:30:00Z")).toISOString(), "2026-10-19T07:00:00.000Z");
    assert.equal(nextSendingWindow(at("2026-10-18T03:00:00Z")).toISOString(), "2026-10-19T07:00:00.000Z");
    assert.equal(nextSendingWindow(at("2026-10-18T12:00:00Z")).toISOString(), "2026-10-19T07:00:00.000Z");
  });

  test("clocks going back (25 October 2026): Monday 08:00 is GMT", () => {
    // Saturday 24 Oct 20:00 BST, the night before the change.
    assert.equal(nextSendingWindow(at("2026-10-24T19:00:00Z")).toISOString(), "2026-10-26T08:00:00.000Z");
    // A 3-day delay from Thursday 10:00 BST lands on the Sunday of the change.
    const quoted = lead({ status: "quoted", quoted_at: "2026-10-22T09:00:00Z" });
    assert.equal(dueAt("quote_chaser_1", quoted, SETTINGS[1])?.toISOString(), "2026-10-26T08:00:00.000Z");
  });

  test("clocks going forward (29 March 2026): Monday 08:00 is BST", () => {
    assert.equal(nextSendingWindow(at("2026-03-28T20:00:00Z")).toISOString(), "2026-03-30T07:00:00.000Z");
    // 07:30 GMT on the Saturday before is still closed; opens at 08:00 GMT.
    assert.equal(nextSendingWindow(at("2026-03-28T07:30:00Z")).toISOString(), "2026-03-28T08:00:00.000Z");
  });

  test("a UK day runs midnight to midnight, including the 25-hour day the clocks go back", () => {
    const summer = ukDayBounds(at("2026-10-14T23:30:00Z")); // 00:30 BST on Thursday 15th
    assert.equal(summer.start.toISOString(), "2026-10-14T23:00:00.000Z");
    assert.equal(summer.end.toISOString(), "2026-10-15T23:00:00.000Z");
    const change = ukDayBounds(at("2026-10-25T12:00:00Z"));
    assert.equal(change.start.toISOString(), "2026-10-24T23:00:00.000Z");
    assert.equal(change.end.toISOString(), "2026-10-26T00:00:00.000Z");
  });

  test("the acknowledgement ignores the window", () => {
    const sundayNight = lead({ created_at: "2026-10-18T22:30:00Z" });
    assert.deepEqual(kinds(plan(sundayNight, "2026-10-18T22:35:00Z")), ["acknowledgement:send"]);
  });

  test("a chaser due in the window but picked up after it closes waits for it to reopen", () => {
    const quoted = lead({ status: "quoted", quoted_at: "2026-10-13T17:00:00Z" }); // due Fri 16 Oct 18:00 BST
    const items = plan(quoted, "2026-10-16T18:10:00Z", [row("acknowledgement")]); // Friday 19:10 BST
    assert.deepEqual(items, [
      { kind: "scheduled", leadId: LEAD_ID, step: "quote_chaser_1", at: at("2026-10-17T07:00:00Z") },
      { kind: "scheduled", leadId: LEAD_ID, step: "quote_chaser_2", at: at("2026-10-23T17:00:00Z") },
    ]);
  });
});

describe("stop conditions", () => {
  const quoted = lead({ status: "quoted", quoted_at: "2026-10-13T10:00:00Z" });
  const acked = [row("acknowledgement")];

  test("Quoted: chaser 1 sends once due", () => {
    assert.deepEqual(kinds(plan(quoted, "2026-10-16T10:05:00Z", acked)), ["quote_chaser_1:send", "quote_chaser_2:scheduled"]);
  });

  for (const status of ["new", "contacted", "won", "lost"]) {
    test(`moving from Quoted to ${status} stops both chasers`, () => {
      const moved = { ...quoted, status };
      assert.deepEqual(kinds(plan(moved, "2026-10-16T10:05:00Z", acked)), []);
    });
  }

  test("the review request needs Won and a completion date", () => {
    const done = lead({ status: "won", completed_at: "2026-10-13T15:00:00Z" });
    assert.deepEqual(kinds(plan(done, "2026-10-16T15:00:00Z", acked)), ["review_request:send"]);
    assert.deepEqual(kinds(plan({ ...done, completed_at: null }, "2026-10-16T15:00:00Z", acked)), []);
    assert.deepEqual(kinds(plan({ ...done, status: "lost" }, "2026-10-16T15:00:00Z", acked)), []);
  });

  test("paused, spam and no email: nothing at all, not even logged", () => {
    assert.deepEqual(plan({ ...quoted, follow_ups_paused: true }, "2026-10-16T10:05:00Z"), []);
    assert.deepEqual(plan({ ...quoted, status: "spam" }, "2026-10-16T10:05:00Z"), []);
    assert.deepEqual(plan({ ...quoted, email: null }, "2026-10-16T10:05:00Z"), []);
    assert.deepEqual(plan({ ...quoted, email: "  " }, "2026-10-16T10:05:00Z"), []);
  });

  test("the two test leads only take part while emails go to the test address", () => {
    const testLead = lead({ id: TEST_LEAD });
    assert.equal(leadExclusion(testLead, CONFIG), "test-lead");
    assert.deepEqual(plan(testLead, "2026-10-12T09:05:00Z"), []);
    const redirected = { ...CONFIG, testRecipient: "me@example.com" };
    assert.equal(leadExclusion(testLead, redirected), null);
    assert.deepEqual(kinds(plan(testLead, "2026-10-12T09:05:00Z", [], redirected)), ["acknowledgement:send"]);
  });

  for (const status of ["contacted", "quoted", "won", "lost"]) {
    test(`a lead already moved to ${status} gets no acknowledgement`, () => {
      assert.deepEqual(kinds(plan(lead({ status }), "2026-10-12T09:05:00Z")), []);
    });
  }
});

describe("skipped, logged instead of sent", () => {
  const fresh = lead();

  test("FOLLOW_UPS_ENABLED must be exactly true", () => {
    for (const value of [undefined, "", "TRUE", "1", "yes", " true"]) {
      assert.equal(readFollowUpConfig({ FOLLOW_UPS_ENABLED: value }).enabled, false, String(value));
    }
    assert.equal(readFollowUpConfig({ FOLLOW_UPS_ENABLED: "true" }).enabled, true);
  });

  test("switched off: due steps are skipped with the reason", () => {
    const items = plan(fresh, "2026-10-12T09:05:00Z", [], { ...CONFIG, enabled: false });
    assert.equal(items.length, 1);
    assert.equal(items[0].kind, "skip");
    assert.match(items[0].kind === "skip" ? items[0].reason : "", /FOLLOW_UPS_ENABLED/);
  });

  test("a step switched off in settings is skipped", () => {
    const settings = SETTINGS.map((setting) => (setting.step === "acknowledgement" ? { ...setting, enabled: false } : setting));
    assert.deepEqual(kinds(plan(fresh, "2026-10-12T09:05:00Z", [], CONFIG, settings)), ["acknowledgement:skip"]);
  });

  test("review request without GOOGLE_REVIEW_URL is skipped", () => {
    const done = lead({ status: "won", completed_at: "2026-10-13T15:00:00Z" });
    const items = plan(done, "2026-10-16T15:00:00Z", [row("acknowledgement")], { ...CONFIG, reviewUrl: null });
    assert.deepEqual(kinds(items), ["review_request:skip"]);
    assert.equal(items[0].kind === "skip" && items[0].reason, "GOOGLE_REVIEW_URL is not set");
  });

  test("an acknowledgement more than a day overdue is skipped, not sent late", () => {
    assert.deepEqual(kinds(plan(fresh, "2026-10-13T09:01:00Z")), ["acknowledgement:skip"]);
    assert.deepEqual(kinds(plan(fresh, "2026-10-13T08:59:00Z")), ["acknowledgement:send"]);
  });

  test("a chaser more than 3 days overdue is skipped, not sent late", () => {
    const quoted = lead({ status: "quoted", quoted_at: "2026-10-13T10:00:00Z" }); // due Fri 16 Oct 11:00 BST
    const acked = [row("acknowledgement")];
    assert.deepEqual(kinds(plan(quoted, "2026-10-19T10:01:00Z", acked)), ["quote_chaser_1:skip", "quote_chaser_2:scheduled"]);
    assert.deepEqual(kinds(plan(quoted, "2026-10-19T09:59:00Z", acked)), ["quote_chaser_1:send", "quote_chaser_2:scheduled"]);
  });

  test("not-yet-due steps are scheduled, never skipped early", () => {
    const quoted = lead({ status: "quoted", quoted_at: "2026-10-13T10:00:00Z" });
    assert.deepEqual(kinds(plan(quoted, "2026-10-13T10:05:00Z", [row("acknowledgement")], { ...CONFIG, enabled: false })), [
      "quote_chaser_1:scheduled",
      "quote_chaser_2:scheduled",
    ]);
  });
});

describe("no duplicates", () => {
  const fresh = lead();
  const now = "2026-10-12T09:05:00Z";

  for (const status of ["sent", "skipped", "sending"] as const) {
    test(`a ${status} row finishes the step`, () => {
      assert.deepEqual(plan(fresh, now, [row("acknowledgement", { status })]), []);
    });
  }

  test("a failed row is retried until it has had three attempts", () => {
    const failed = row("acknowledgement", { status: "failed", attempts: 1, error: "rate_limit_exceeded" });
    const items = plan(fresh, now, [failed]);
    assert.equal(items.length, 1);
    assert.ok(items[0].kind === "send" && items[0].retry?.id === failed.id);
    assert.deepEqual(plan(fresh, now, [{ ...failed, attempts: MAX_ATTEMPTS }]), []);
  });

  test("an unknown outcome (marked with the maximum attempts) is never retried", () => {
    const unknown = row("acknowledgement", { status: "failed", attempts: MAX_ATTEMPTS, error: "Outcome unknown, check before resending" });
    assert.deepEqual(plan(fresh, now, [unknown]), []);
  });

  test("a failed row isn't turned into a skip when follow-ups are switched off", () => {
    const failed = row("acknowledgement", { status: "failed", attempts: 1 });
    assert.deepEqual(plan(fresh, now, [failed], { ...CONFIG, enabled: false }), []);
  });

  test("rows for another lead don't count", () => {
    assert.deepEqual(kinds(plan(fresh, now, [row("acknowledgement", { lead_id: TEST_LEAD })])), ["acknowledgement:send"]);
  });
});

describe("test-recipient redirection", () => {
  test("without a test address the customer gets it", () => {
    assert.deepEqual(resolveRecipient(" jo@example.com ", null), { to: "jo@example.com", intended: "jo@example.com", redirected: false });
  });

  test("with one, every email goes there and remembers who it was for", () => {
    const config = readFollowUpConfig({ FOLLOW_UP_TEST_RECIPIENT: " me@example.com " });
    assert.deepEqual(resolveRecipient("jo@example.com", config.testRecipient), {
      to: "me@example.com",
      intended: "jo@example.com",
      redirected: true,
    });
  });
});

describe("stop-link tokens", () => {
  const secret = "test-secret";

  test("round trip, and the token isn't the bare lead id", () => {
    const token = createStopToken(LEAD_ID, secret);
    assert.equal(token.length, 43);
    assert.ok(!token.includes(LEAD_ID));
    assert.equal(readStopToken(token, secret), LEAD_ID);
  });

  test("rejects a changed token, another secret, the bare id and junk", () => {
    const token = createStopToken(LEAD_ID, secret);
    const flipped = `${token.slice(0, 5)}${token[5] === "A" ? "B" : "A"}${token.slice(6)}`;
    assert.equal(readStopToken(flipped, secret), null);
    assert.equal(readStopToken(token, "other-secret"), null);
    assert.equal(readStopToken(LEAD_ID, secret), null);
    assert.equal(readStopToken("example", secret), null);
    assert.equal(readStopToken("", secret), null);
    assert.equal(readStopToken(null, secret), null);
  });
});
