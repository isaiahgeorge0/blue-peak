import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { estimateFromLead, estimatorFigures, formatPounds } from "./estimate-summary.ts";
import { SAMPLE_LEADS } from "./follow-up-sample.ts";

const ALL_SIX = "Loft conversion, Rear extension, Side return, Garden room, Solar panels, Kitchen or bathroom";

function message(lines: Record<string, string>) {
  return [
    "Site visit request from the quote calculator.",
    ...Object.entries(lines).map(([key, value]) => `${key}: ${value}`),
  ].join("\n");
}

const valid = {
  Work: ALL_SIX,
  Size: "Compact",
  Finish: "Quality",
  "Estimated from": "£168,500",
  "Time on site": "22 to 24 weeks",
};

describe("estimator figures", () => {
  test("same sums as the estimator", () => {
    assert.deepEqual(
      estimatorFigures(["loft", "extension", "side_return", "garden_room", "solar", "kitchen_bath"], "compact", "quality"),
      { total: 168500, weeks: "22 to 24 weeks" },
    );
    assert.deepEqual(estimatorFigures(["extension", "kitchen_bath"], "standard", "quality"), { total: 90000, weeks: "13 to 15 weeks" });
    assert.deepEqual(estimatorFigures(["solar"], "large", "highend"), { total: 15000, weeks: "5 to 7 weeks" });
  });

  test("pounds", () => {
    assert.equal(formatPounds(168500), "£168,500");
    assert.equal(formatPounds(9000), "£9,000");
    assert.equal(formatPounds(1250000), "£1,250,000");
  });
});

describe("estimate from a lead's message", () => {
  test("the rows, in the estimator's words", () => {
    assert.deepEqual(estimateFromLead("quote-calculator", message(valid)), [
      { label: "Work", value: ALL_SIX },
      { label: "Size", value: "Compact" },
      { label: "Finish", value: "Quality" },
      { label: "Estimated from", value: "£168,500" },
      { label: "Time on site", value: "22 to 24 weeks" },
    ]);
  });

  test("start date when it is one of the estimator's options", () => {
    const rows = estimateFromLead("quote-calculator", message({ ...valid, "When would you like to start": "Within 3 months" }));
    assert.deepEqual(rows?.at(-1), { label: "Start", value: "Within 3 months" });
    const typed = estimateFromLead("quote-calculator", message({ ...valid, "When would you like to start": "<a href=x>now</a>" }));
    assert.equal(typed?.length, 5);
  });

  test("the sample estimator lead checks out", () => {
    const rows = estimateFromLead(SAMPLE_LEADS.estimator.serviceType, SAMPLE_LEADS.estimator.message);
    assert.equal(rows?.find((row) => row.label === "Estimated from")?.value, "£90,000");
  });

  test("Windows line endings", () => {
    assert.ok(estimateFromLead("quote-calculator", message(valid).replaceAll("\n", "\r\n")));
  });

  test("nothing for other leads or no message", () => {
    assert.equal(estimateFromLead("extensions", message(valid)), null);
    assert.equal(estimateFromLead(null, message(valid)), null);
    assert.equal(estimateFromLead("quote-calculator", null), null);
    assert.equal(estimateFromLead("quote-calculator", ""), null);
    assert.equal(estimateFromLead("quote-calculator", "Site visit request from the quote calculator."), null);
  });

  test("nothing if anything was changed or isn't an estimator option", () => {
    const tampered: Record<string, string>[] = [
      { ...valid, "Estimated from": "£1,000" },
      { ...valid, "Estimated from": "£168,500 (call now: http://evil.example)" },
      { ...valid, "Time on site": "1 to 3 weeks" },
      { ...valid, Work: `${ALL_SIX}, Swimming pool` },
      { ...valid, Work: "Loft conversion, Loft conversion" },
      { ...valid, Work: "Not selected" },
      { ...valid, Size: "Huge" },
      { ...valid, Finish: "quality" },
    ];
    for (const lines of tampered) assert.equal(estimateFromLead("quote-calculator", message(lines)), null, JSON.stringify(lines));
    const noTotal: Record<string, string> = { ...valid };
    delete noTotal["Estimated from"];
    assert.equal(estimateFromLead("quote-calculator", message(noTotal)), null);
  });
});
