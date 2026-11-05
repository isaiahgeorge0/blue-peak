import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { houseImageFor } from "./email-house-image.ts";
import { emailImageSources, FALLBACK_SITE_URL, siteUrlFrom } from "./email-image-plan.ts";
import { renderFollowUpEmail, type FollowUpEmailInput } from "./follow-up-email.ts";
import { FOLLOW_UP_STEPS } from "./follow-up-schedule.ts";
import { STEP_STAGE } from "./job-card.ts";
import { renderNewLeadEmail, type NewLeadEmailInput } from "./new-lead-email.ts";

const HOUSE = houseImageFor(["extension"]);
assert.ok(HOUSE);
const ESTIMATE = { rows: [{ label: "Work", value: "Rear extension" }], addonKeys: ["extension"] };

function followUp(step: FollowUpEmailInput["step"], sources: FollowUpEmailInput["images"], estimate: FollowUpEmailInput["estimate"] = null) {
  return renderFollowUpEmail({
    step,
    subject: "Hello {first_name}",
    body: "Hi {first_name},\n\nThanks.",
    name: "Jo Bloggs",
    serviceType: "kitchen-renovations",
    phoneDisplay: "01234 567890",
    phoneHref: "tel:+441234567890",
    reviewUrl: "https://g.page/r/x/review",
    stopUrl: "https://example.com/stop",
    intendedRecipient: null,
    estimate,
    jobCard: { reference: "CX-0042", about: "Your kitchen renovation", enquiryDate: "5 October 2026", stage: STEP_STAGE[step] },
    images: sources,
  });
}

const alertBase: Omit<NewLeadEmailInput, "images" | "estimate"> = {
  name: "Jo Bloggs",
  phone: "07700 900123",
  email: "jo@example.com",
  postcode: "AB1 2CD",
  serviceLabel: "Kitchen renovations",
  message: "New kitchen.",
  jobCard: { reference: "CX-0007", about: "Kitchen renovations", enquiryDate: "11 October 2026", stage: 1 },
  adminUrl: "https://example.com/admin/leads/abc",
  phoneDisplay: "01234 567890",
  phoneHref: "tel:+441234567890",
};

/** Every attached image is referenced, every cid: is attached, and backgrounds never use a cid. */
function assertImageContract(html: string, contentIds: string[]) {
  const used = [...html.matchAll(/cid:([A-Za-z0-9-]+)/g)].map((match) => match[1]);
  assert.deepEqual([...new Set(used)].sort(), [...contentIds].sort());
  for (const value of html.match(/background="[^"]*"|background-image:\s*url\([^)]*\)/g) ?? []) {
    assert.doesNotMatch(value, /cid:/, value);
  }
}

describe("email image attachments", () => {
  test("the site URL drops a trailing slash and falls back to the public site", () => {
    assert.equal(siteUrlFrom(undefined), FALLBACK_SITE_URL);
    assert.equal(siteUrlFrom("  "), FALLBACK_SITE_URL);
    assert.equal(siteUrlFrom("https://preview.example/"), "https://preview.example");
  });

  test("each follow-up step attaches only the images that layout shows", () => {
    for (const step of FOLLOW_UP_STEPS) {
      const layout = step === "acknowledgement" ? "branded" : "personal";
      const plan = emailImageSources(layout, layout === "personal" ? HOUSE : null);
      const email = followUp(step, plan.sources);
      assertImageContract(email.html, plan.files.map((file) => file.contentId));
      assert.equal(plan.files.some((file) => file.relativePath.endsWith("navy.png")), false, step);
      assert.equal(plan.files.some((file) => /logo-light|logo-dark/.test(file.relativePath)), false, step);
      if (layout === "personal") {
        assert.deepEqual(plan.files.map((file) => file.contentId), ["bp-signature"]);
        assert.match(email.html, /cid:bp-signature/);
      }
      if (layout === "branded") assert.match(email.html, new RegExp(`background="${FALLBACK_SITE_URL}/email/navy.png"`));
    }
  });

  test("a branded email with a house picture attaches that picture too", () => {
    const plan = emailImageSources("branded", HOUSE, "https://preview.example/");
    const email = followUp("acknowledgement", plan.sources, ESTIMATE);
    assertImageContract(email.html, plan.files.map((file) => file.contentId));
    assert.ok(plan.files.some((file) => file.contentId === "bp-house"));
    assert.match(email.html, /background="https:\/\/preview\.example\/email\/navy.png"/);
    assert.match(email.html, /background-image: url\('https:\/\/preview\.example\/email\/navy.png'\)/);
  });

  test("the new-lead alert attaches the branded images, including the house when there is one", () => {
    for (const house of [null, HOUSE]) {
      const plan = emailImageSources("branded", house);
      const email = renderNewLeadEmail({ ...alertBase, estimate: house ? ESTIMATE : null, images: plan.sources });
      assertImageContract(email.html, plan.files.map((file) => file.contentId));
      assert.match(email.html, new RegExp(`url\\('${FALLBACK_SITE_URL}/email/navy.png'\\)`));
    }
  });
});
