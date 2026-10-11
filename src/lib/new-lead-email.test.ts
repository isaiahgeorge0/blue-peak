import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { renderNewLeadEmail, telHref, type NewLeadEmailInput } from "./new-lead-email.ts";

const base: NewLeadEmailInput = {
  name: "Jo Bloggs",
  phone: "07700 900123",
  email: "jo@example.com",
  postcode: "AB1 2CD",
  serviceLabel: "Kitchen renovations",
  message: "New kitchen, roughly in spring.\nSemi-detached.",
  estimate: null,
  jobCard: { reference: "BP-0007", about: "Kitchen renovations", enquiryDate: "11 October 2026", stage: 1 },
  adminUrl: "https://example.com/admin/leads/abc",
  phoneDisplay: "01234 567890",
  phoneHref: "tel:+441234567890",
  images: { logo: "cid:bp-logo", gable: "cid:bp-gable", house: null },
};

describe("new-lead alert", () => {
  test("subject with the reference, name and service", () => {
    assert.equal(renderNewLeadEmail(base).subject, "New lead BP-0007: Jo Bloggs, Kitchen renovations");
  });

  test("job card, tap-to-call, mailto, message and both buttons", () => {
    const { html, text } = renderNewLeadEmail(base);
    assert.match(html, />BP-0007</);
    assert.match(html, />New lead</);
    assert.match(html, /Stage 1 of 5:<\/strong> Enquiry received/);
    assert.match(html, /<a href="tel:07700900123"[^>]*>07700 900123<\/a>/);
    assert.match(html, /<a href="mailto:jo@example.com"[^>]*>jo@example.com<\/a>/);
    assert.match(html, /New kitchen, roughly in spring\.<br \/>Semi-detached\./);
    assert.match(html, /href="tel:07700900123"[^>]*>Call Jo<\/a>/);
    assert.match(html, /href="https:\/\/example.com\/admin\/leads\/abc"[^>]*>Open in admin<\/a>/);
    assert.match(html, /v:roundrect[^>]*href="tel:07700900123"/);
    assert.match(text, /^New lead: BP-0007\nKitchen renovations, enquired 11 October 2026\nStage 1 of 5: Enquiry received\n/);
    assert.match(text, /Call Jo: 07700 900123\nOpen in admin: https:\/\/example.com\/admin\/leads\/abc/);
  });

  test("an estimator lead shows the estimate box and house picture instead of the raw message", () => {
    const { html, text } = renderNewLeadEmail({
      ...base,
      serviceLabel: "Quote calculator",
      message: "Site visit request from the quote calculator.\nWork: Rear extension",
      estimate: { rows: [{ label: "Work", value: "Rear extension" }, { label: "Estimated from", value: "£58,000" }], addonKeys: ["extension"] },
      images: { ...base.images, house: "cid:bp-house" },
    });
    assert.match(html, /Your estimate/);
    assert.match(html, /<img src="cid:bp-house"[^>]*alt="Your house as you built it in the estimator, with: rear extension"/);
    assert.doesNotMatch(html, /Site visit request/);
    assert.match(text, /Your estimate\nWork: Rear extension\nEstimated from: £58,000/);
  });

  test("no email, no usable phone, and customer text escaped", () => {
    const { html, text } = renderNewLeadEmail({ ...base, name: "<b>Mr Smith</b>", phone: "call me", email: "", message: "<script>x</script>" });
    assert.doesNotMatch(html, /<script>|<b>Mr/);
    assert.doesNotMatch(html, />Call [^<]*<\/(a|center)>/);
    assert.doesNotMatch(text, /^Call /m);
    assert.match(html, /Not given/);
    assert.match(text, /Email: Not given/);
    assert.match(html, />Open in admin</);
  });

  test("call button uses the full name when there's no usable first name", () => {
    assert.match(renderNewLeadEmail({ ...base, name: "Mr Smith" }).html, />Call Mr Smith</);
  });

  test("tel links", () => {
    assert.equal(telHref("+44 (0)7700 900-123"), "tel:+4407700900123");
    assert.equal(telHref("07700 900123 ext +2"), "tel:077009001232");
    assert.equal(telHref("123"), null);
    assert.equal(telHref("none"), null);
  });
});
