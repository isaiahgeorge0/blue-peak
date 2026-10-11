import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  fillPlaceholders,
  firstNameFrom,
  renderFollowUpEmail,
  servicePhrase,
  STOP_LINK_TEXT,
  templateProblems,
  type FollowUpEmailInput,
} from "./follow-up-email.ts";

const ACK_BODY = `Hi {first_name},

Thanks for getting in touch about {service}.

Here's what happens next:

1. We read through what you've sent.
2. We visit the property.

Call us on {phone}.`;

const base: FollowUpEmailInput = {
  step: "acknowledgement",
  subject: "Thanks for your enquiry, {first_name}",
  body: ACK_BODY,
  name: "jo bloggs",
  serviceType: "kitchen-renovations",
  phoneDisplay: "01234 567890",
  phoneHref: "tel:+441234567890",
  reviewUrl: null,
  stopUrl: "https://example.com/stop-emails?t=abc",
  intendedRecipient: null,
  markSrc: "cid:blue-peak-mark",
};

describe("first names", () => {
  test("first word, tidied", () => {
    assert.equal(firstNameFrom("jo bloggs"), "Jo");
    assert.equal(firstNameFrom("JO BLOGGS"), "Jo");
    assert.equal(firstNameFrom("  Mary-Jane Smith "), "Mary-Jane");
    assert.equal(firstNameFrom("Siân"), "Siân");
  });

  test("nothing usable", () => {
    for (const name of [null, "", "  ", "Mr Smith", "Mrs. Jones", "J", "J. Smith", "jo@example.com", "123", "Dr"]) {
      assert.equal(firstNameFrom(name), null, String(name));
    }
  });
});

describe("placeholders", () => {
  test("filled", () => {
    assert.equal(
      fillPlaceholders("Hi {first_name}, about {service}, call {phone}", { firstName: "Jo", service: "your extension", phone: "01234" }),
      "Hi Jo, about your extension, call 01234",
    );
  });

  test("no first name: Hi there, and other uses drop out cleanly", () => {
    const values = { firstName: null, service: "your project", phone: "01234" };
    assert.equal(fillPlaceholders("Hi {first_name},", values), "Hi there,");
    assert.equal(fillPlaceholders("Thanks for your enquiry, {first_name}", values), "Thanks for your enquiry");
  });

  test("no service: your project", () => {
    assert.equal(servicePhrase(null), "your project");
    assert.equal(servicePhrase("quote-calculator"), "your project");
    assert.equal(servicePhrase("loft-conversions"), "your loft conversion");
  });

  test("templates with unknown placeholders or stray brackets can't be saved", () => {
    assert.deepEqual(templateProblems("acknowledgement", "Hi {first_name}", ACK_BODY), []);
    assert.equal(templateProblems("acknowledgement", "Hi {firstname}", "x").length, 1);
    assert.equal(templateProblems("acknowledgement", "Hi", "Call {phone").length, 1);
    assert.equal(templateProblems("quote_chaser_1", "Hi", "{review_link}").length, 1);
    assert.deepEqual(templateProblems("review_request", "Hi", "{review_link}"), []);
    assert.equal(templateProblems("review_request", "{review_link}", "x").length, 1);
    assert.equal(templateProblems("acknowledgement", " ", " ").length, 2);
  });
});

describe("rendered email", () => {
  const noBraces = (value: string) => assert.doesNotMatch(value, /[{}]/);

  test("no empty or raw placeholders, whatever the lead looks like", () => {
    for (const name of ["Jo Bloggs", "", "Mr Smith", null]) {
      for (const serviceType of ["extensions", "", null, "quote-calculator"]) {
        const email = renderFollowUpEmail({ ...base, name, serviceType });
        noBraces(email.subject);
        noBraces(email.text);
        assert.doesNotMatch(email.text, /Hi ,|Hi\s*\n|about \.|, \./);
        assert.doesNotMatch(email.html, /\{(first_name|service|phone|review_link)\}/);
      }
    }
  });

  test("subject, list, sign-off, phone link, plain text and stop link", () => {
    const email = renderFollowUpEmail(base);
    assert.equal(email.subject, "Thanks for your enquiry, Jo");
    assert.match(email.html, /<a href="tel:\+441234567890"[^>]*>01234 567890<\/a>/);
    assert.match(email.html, /Kyle and Steven, Blue Peak/);
    assert.match(email.html, />1<\/div>[\s\S]*>2<\/div>/);
    assert.ok(email.html.includes(STOP_LINK_TEXT.replace("'", "&#39;")));
    assert.match(email.html, /href="https:\/\/example.com\/stop-emails\?t=abc"/);
    assert.match(email.text, /^Hi Jo,\n\nThanks for getting in touch about your kitchen renovation\./);
    assert.match(email.text, /1\. We read through what you've sent\.\n2\. We visit the property\./);
    assert.match(email.text, /Kyle and Steven, Blue Peak/);
    assert.match(email.text, /Stop them here: https:\/\/example.com\/stop-emails\?t=abc$/);
    assert.doesNotMatch(email.html, /Test email/);
  });

  test("redirected to the test address: the intended recipient is shown at the top", () => {
    const email = renderFollowUpEmail({ ...base, intendedRecipient: "jo@example.com" });
    assert.match(email.text, /^TEST EMAIL\. In normal use this would have gone to jo@example\.com\./);
    assert.ok(email.html.indexOf("jo@example.com") < email.html.indexOf("Blue Peak</td>"));
  });

  test("review request: button to the review link, added if the template leaves it out", () => {
    const withLink = renderFollowUpEmail({
      ...base,
      step: "review_request",
      subject: "Thank you",
      body: "Hi {first_name},\n\n{review_link}\n\nThanks.",
      reviewUrl: "https://g.page/r/x/review",
    });
    assert.match(withLink.html, /href="https:\/\/g.page\/r\/x\/review"[^>]*>Leave a Google review/);
    assert.match(withLink.text, /Leave a Google review: https:\/\/g.page\/r\/x\/review/);
    const without = renderFollowUpEmail({ ...base, step: "review_request", subject: "Thank you", body: "Hi.", reviewUrl: "https://g.page/r/x/review" });
    assert.match(without.html, /Leave a Google review/);
  });

  test("customer text is escaped", () => {
    const email = renderFollowUpEmail({ ...base, name: "<b>Jo</b>", body: "Hi {first_name} <script>" });
    assert.doesNotMatch(email.html, /<script>/);
  });
});
