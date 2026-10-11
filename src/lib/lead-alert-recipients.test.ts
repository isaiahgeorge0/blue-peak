import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_LEAD_ALERT_TO, leadAlertRecipients } from "./lead-alert-recipients.ts";

test("unset or blank: the current address, so nothing changes", () => {
  for (const value of [undefined, "", "  ", " , "]) {
    assert.deepEqual(leadAlertRecipients(value), { to: [DEFAULT_LEAD_ALERT_TO], ignored: [] }, String(value));
  }
});

test("comma-separated, trimmed, duplicates removed", () => {
  assert.deepEqual(leadAlertRecipients(" kyle@example.co.uk,steven@example.co.uk , kyle@example.co.uk "), {
    to: ["kyle@example.co.uk", "steven@example.co.uk"],
    ignored: [],
  });
});

test("entries that aren't addresses are ignored", () => {
  assert.deepEqual(leadAlertRecipients("kyle@example.co.uk, steven, Kyle <k@example.com>"), {
    to: ["kyle@example.co.uk"],
    ignored: ["steven", "Kyle <k@example.com>"],
  });
});

test("nothing usable: the current address rather than nowhere", () => {
  assert.deepEqual(leadAlertRecipients("kyle, steven@"), { to: [DEFAULT_LEAD_ALERT_TO], ignored: ["kyle", "steven@"] });
});
