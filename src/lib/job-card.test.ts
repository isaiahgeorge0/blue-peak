import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  formatLeadReference,
  jobCardFor,
  jobStage,
  referenceMatches,
  referenceNumberFromQuery,
  stageSummary,
  STEP_STAGE,
} from "./job-card.ts";

describe("reference", () => {
  test("CX- and four digits, longer past 9999", () => {
    assert.equal(formatLeadReference(1), "CX-0001");
    assert.equal(formatLeadReference(42), "CX-0042");
    assert.equal(formatLeadReference(9999), "CX-9999");
    assert.equal(formatLeadReference(12345), "CX-12345");
  });

  test("searches that mean a reference", () => {
    for (const query of ["CX-0007", "cx-0007", "CX0007", "cx 7", "CX-7", "cx7", "0007", "7", " cx-07 "]) {
      assert.equal(referenceNumberFromQuery(query), 7, query);
    }
    for (const query of ["BP-0007", "bp-0007", "BP0007", "bp 7", "BP-7", " bp-07 "]) {
      assert.equal(referenceNumberFromQuery(query), 7, query);
    }
    for (const query of ["", "cx", "CX-", "bp", "BP-", "0", "CX-0000", "Smith", "7a", "cx-7-1", "07700 900123"]) {
      assert.equal(referenceNumberFromQuery(query), null, query);
    }
  });

  test("matching a lead", () => {
    assert.ok(referenceMatches("CX-0007", 7));
    assert.ok(referenceMatches("BP-0007", 7));
    assert.ok(referenceMatches("7", 7));
    assert.ok(!referenceMatches("CX-0007", 70));
    assert.ok(!referenceMatches("17", 7));
    assert.ok(referenceMatches("cx-", 7));
    assert.ok(referenceMatches("bp-", 7));
    assert.ok(referenceMatches("CX-00", 7));
    assert.ok(referenceMatches("BP-00", 7));
    assert.ok(!referenceMatches("Smith", 7));
    assert.ok(!referenceMatches("", 7));
    assert.ok(!referenceMatches("CX-0007", null));
  });
});

describe("stage", () => {
  test("from the lead's status, and finished once completed", () => {
    assert.equal(jobStage({ status: "new" }), 1);
    assert.equal(jobStage({ status: "contacted" }), 2);
    assert.equal(jobStage({ status: "quoted" }), 3);
    assert.equal(jobStage({ status: "won", completed_at: null }), 4);
    assert.equal(jobStage({ status: "won", completed_at: "2026-10-01T10:00:00Z" }), 5);
  });

  test("no stage for lost or spam leads, or anything unknown", () => {
    assert.equal(jobStage({ status: "lost" }), null);
    assert.equal(jobStage({ status: "spam", completed_at: "2026-10-01T10:00:00Z" }), null);
    assert.equal(jobStage({ status: "archived" }), null);
    assert.equal(jobStage({ status: null }), null);
  });

  test("each email's stage", () => {
    assert.deepEqual(STEP_STAGE, { acknowledgement: 1, quote_chaser_1: 3, quote_chaser_2: 3, review_request: 5 });
  });

  test("in words", () => {
    assert.equal(stageSummary(1), "Stage 1 of 5: Enquiry received");
    assert.equal(stageSummary(3), "Stage 3 of 5: Quote sent");
    assert.equal(stageSummary(5), "Stage 5 of 5: Finished");
  });
});

describe("job card", () => {
  test("reference, service, and the enquiry date in UK time", () => {
    assert.deepEqual(jobCardFor({ reference_number: 3, service_type: "loft-conversions", created_at: "2026-10-04T23:30:00Z", stage: 1 }), {
      reference: "CX-0003",
      about: "Your loft conversion",
      enquiryDate: "5 October 2026",
      stage: 1,
    });
  });

  test("your project when there's no service, and no reference if one is missing", () => {
    const card = jobCardFor({ reference_number: null, service_type: "quote-calculator", created_at: "2026-01-15T12:00:00Z", stage: 3 });
    assert.equal(card.about, "Your project");
    assert.equal(card.reference, null);
    assert.equal(card.enquiryDate, "15 January 2026");
  });
});
