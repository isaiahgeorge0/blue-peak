import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  estimatorDetails,
  firstNameFromClaims,
  greetingFor,
  leadSource,
  normalizeStatus,
  serviceLabel,
  ukWeekStart,
  waitedFor,
  weeklyVolume,
} from "./admin-leads.ts";

const estimatorMessage = [
  "Site visit request from the quote calculator.",
  "Work: Loft conversion, Solar panels",
  "Size: Medium",
  "Finish: Standard",
  "Estimated from: £42,000",
].join("\n");

describe("admin lead helpers", () => {
  test("statuses fall back to new", () => {
    assert.equal(normalizeStatus("quoted"), "quoted");
    assert.equal(normalizeStatus(null), "new");
    assert.equal(normalizeStatus("archived"), "new");
  });

  test("source is read from the service type", () => {
    assert.equal(leadSource("quote-calculator"), "Estimator");
    assert.equal(leadSource("kitchen-renovations"), "Contact form");
    assert.equal(leadSource(null), "Contact form");
  });

  test("estimator selections are parsed from the message", () => {
    assert.deepEqual(estimatorDetails(estimatorMessage)?.slice(0, 2), [
      { label: "Work", value: "Loft conversion, Solar panels" },
      { label: "Size", value: "Medium" },
    ]);
    assert.equal(estimatorDetails("Just a question about a kitchen"), null);
    assert.equal(estimatorDetails(null), null);
  });

  test("service labels are human-readable", () => {
    const names = { "kitchen-renovations": "Kitchen renovations" };
    assert.equal(serviceLabel("quote-calculator", estimatorMessage, names), "Loft conversion, Solar panels");
    assert.equal(serviceLabel("quote-calculator", null, names), "Estimate");
    assert.equal(serviceLabel("kitchen-renovations", null, names), "Kitchen renovations");
    assert.equal(serviceLabel("garden-walls", null, names), "Garden walls");
    assert.equal(serviceLabel("", null, names), "No service chosen");
  });

  test("waiting time reads in plain words", () => {
    const now = new Date("2026-10-09T18:00:00Z");
    assert.equal(waitedFor("2026-10-09T17:30:00Z", now), "Under an hour");
    assert.equal(waitedFor("2026-10-09T13:00:00Z", now), "5 hours");
    assert.equal(waitedFor("2026-10-08T17:00:00Z", now), "1 day");
    assert.equal(waitedFor("2026-10-05T13:57:00Z", now), "4 days");
    assert.equal(waitedFor("2026-09-10T12:00:00Z", now), "4 weeks");
  });

  test("greeting follows UK time", () => {
    assert.equal(greetingFor(new Date("2026-10-09T10:59:00Z")), "Good morning");
    assert.equal(greetingFor(new Date("2026-10-09T11:00:00Z")), "Good afternoon");
    assert.equal(greetingFor(new Date("2026-10-09T17:00:00Z")), "Good evening");
    assert.equal(greetingFor(new Date("2026-01-09T11:30:00Z")), "Good morning");
  });

  test("first name comes from the profile only", () => {
    assert.equal(firstNameFromClaims({ user_metadata: { first_name: " Kyle " } }), "Kyle");
    assert.equal(firstNameFromClaims({ email: "steven@example.com", user_metadata: {} }), null);
    assert.equal(firstNameFromClaims(undefined), null);
  });

  test("weeks start on Monday in UK time", () => {
    assert.equal(ukWeekStart(new Date("2026-10-05T13:57:00Z")), "2026-10-05");
    assert.equal(ukWeekStart(new Date("2026-10-11T22:30:00Z")), "2026-10-05");
    assert.equal(ukWeekStart(new Date("2026-10-11T23:30:00Z")), "2026-10-12");
  });

  test("weekly volume waits for four weeks of leads", () => {
    const leads = ["2026-10-05T13:57:00Z", "2026-10-06T09:00:00Z"];
    assert.equal(weeklyVolume(leads, new Date("2026-11-01T12:00:00Z")), null);
    const weeks = weeklyVolume(leads, new Date("2026-11-03T12:00:00Z"));
    assert.deepEqual(weeks?.map((week) => week.leads), [2, 0, 0, 0, 0]);
    assert.equal(weeks?.[0].week, "2026-10-05");
    assert.equal(weeklyVolume([], new Date()), null);
  });
});
