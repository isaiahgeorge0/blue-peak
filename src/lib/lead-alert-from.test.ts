import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { DEFAULT_LEAD_ALERT_FROM, leadAlertFrom, looksLikeFromAddress } from "./lead-alert-from.ts";

describe("looksLikeFromAddress", () => {
  test("bare addresses and display-name forms pass", () => {
    for (const value of [
      "admin@cortexbuilding.co.uk",
      "Cortex Notifications <admin@cortexbuilding.co.uk>",
      "Kyle <kyle@example.co.uk>",
      "  Jo Bloggs <jo@example.com> ",
    ]) {
      assert.ok(looksLikeFromAddress(value), value);
    }
  });

  test("empty, incomplete and nonsense fail", () => {
    for (const value of [
      "",
      "   ",
      "Cortex Notifications",
      "<admin@cortexbuilding.co.uk>",
      "Cortex Notifications <>",
      "Cortex Notifications <not-an-email>",
      "admin@",
      "Name <a@b>",
    ]) {
      assert.ok(!looksLikeFromAddress(value), value);
    }
  });
});

describe("leadAlertFrom", () => {
  test("falls back to the default when unset", () => {
    for (const value of [undefined, "", "  "]) {
      assert.deepEqual(leadAlertFrom(value), { from: DEFAULT_LEAD_ALERT_FROM, invalid: false }, String(value));
    }
  });

  test("falls back to the default when invalid", () => {
    assert.deepEqual(leadAlertFrom("not a from"), { from: DEFAULT_LEAD_ALERT_FROM, invalid: true });
    assert.deepEqual(leadAlertFrom("Cortex Notifications"), { from: DEFAULT_LEAD_ALERT_FROM, invalid: true });
  });

  test("uses the env value when valid", () => {
    assert.deepEqual(leadAlertFrom("alerts@example.co.uk"), {
      from: "alerts@example.co.uk",
      invalid: false,
    });
    assert.deepEqual(leadAlertFrom("Cortex Alerts <alerts@example.co.uk>"), {
      from: "Cortex Alerts <alerts@example.co.uk>",
      invalid: false,
    });
    assert.deepEqual(leadAlertFrom("  Cortex Alerts <alerts@example.co.uk>  "), {
      from: "Cortex Alerts <alerts@example.co.uk>",
      invalid: false,
    });
  });
});
