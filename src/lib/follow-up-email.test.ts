import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import { MIN_LINK_SECRET_LENGTH, readLinkSecret, type FollowUpStep } from "./follow-up-schedule.ts";
import {
  fillPlaceholders,
  firstNameFrom,
  renderFollowUpEmail,
  servicePhrase,
  STOP_LINK_TEXT,
  templateParts,
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
  jobCard: { reference: "BP-0042", about: "Your kitchen renovation", enquiryDate: "5 October 2026", stage: 1 },
  images: { logo: "cid:bp-logo", gable: "cid:bp-gable", house: null },
};

/** The plain text after the job card that opens every email. */
function afterJobCard(text: string) {
  const card = text.indexOf("\n\n", text.indexOf("Stage "));
  return text.slice(card + 2);
}

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

  test("no first name: subjects and sentences in any position", () => {
    const values = { firstName: null, service: "your project", phone: "01234" };
    const cases: [string, string][] = [
      ["Thanks for your enquiry, {first_name}", "Thanks for your enquiry"],
      ["Thanks for your enquiry {first_name}", "Thanks for your enquiry"],
      ["{first_name}, thanks for your enquiry", "Thanks for your enquiry"],
      ["{first_name}: your quote", "Your quote"],
      ["{first_name}", ""],
      ["{first_name}'s quote is ready", "Your quote is ready"],
      ["Here is {first_name}'s quote", "Here is your quote"],
      ["Thanks {first_name}!", "Thanks!"],
      ["Thanks, {first_name}.", "Thanks."],
      ["Thanks. {first_name}, we'll call soon.", "Thanks. We'll call soon."],
      ["Thanks. {first_name}!", "Thanks."],
      ["We'll see you soon, {first_name}, and thanks again.", "We'll see you soon, and thanks again."],
      ["A quote for you {first_name} - have a look", "A quote for you - have a look"],
      ["Hi {first_name}", "Hi there"],
      ["Hi, {first_name}!", "Hi there!"],
      ["Hello {first_name},", "Hello there,"],
      ["Dear {first_name},", "Hello,"],
      ["Hi {first_name},\n\n{first_name}, here's what happens next:", "Hi there,\n\nHere's what happens next:"],
      ["Your quote, {first_name}: {service}", "Your quote: your project"],
    ];
    for (const [template, expected] of cases) assert.equal(fillPlaceholders(template, values), expected, template);
  });

  test("with a first name, nothing else changes", () => {
    const values = { firstName: "Jo", service: "your extension", phone: "01234" };
    assert.equal(fillPlaceholders("Dear {first_name}, {first_name}'s quote", values), "Dear Jo, Jo's quote");
    assert.equal(fillPlaceholders("Thanks , see you .", values), "Thanks , see you .");
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

  test("{estimate} only in the acknowledgement's email", () => {
    assert.deepEqual(templateProblems("acknowledgement", "Hi", "Hi\n\n{estimate}"), []);
    assert.match(templateProblems("quote_chaser_1", "Hi", "{estimate}")[0], /acknowledgement's email/);
    assert.match(templateProblems("acknowledgement", "{estimate}", "x")[0], /not the subject/);
  });

  test("a subject has to say something without the name", () => {
    assert.equal(templateProblems("acknowledgement", "{first_name}", "x").length, 1);
    assert.equal(templateProblems("acknowledgement", "{first_name}!", "x").length, 1);
    assert.deepEqual(templateProblems("acknowledgement", "{service}", "x"), []);
  });
});

/** The seeded templates as they now stand: the original text with the P.S. line the later migration appends. */
const SEEDED = (() => {
  const migration = (name: string) => readFileSync(new URL(`../../supabase/migrations/${name}`, import.meta.url), "utf8");
  const psLines = new Map(
    [
      ...migration("20261011140100_follow_up_ps_lines.sql").matchAll(
        /'(acknowledgement|quote_chaser_1|quote_chaser_2|review_request)',\s*\$body\$([\s\S]*?)\$body\$,\s*'((?:[^']|'')*)'/g,
      ),
    ].map((match) => [match[1], { seeded: match[2], line: match[3].replaceAll("''", "'") }]),
  );
  const templates = [
    ...migration("20261011120300_follow_up_settings.sql").matchAll(
      /'(acknowledgement|quote_chaser_1|quote_chaser_2|review_request)',\s*\w+,\s*\d+,\s*'\w+',\s*'((?:[^']|'')*)',\s*\$body\$([\s\S]*?)\$body\$/g,
    ),
  ].map((match) => {
    const ps = psLines.get(match[1]);
    assert.equal(ps?.seeded, match[3], `P.S. migration matches the seeded ${match[1]} text`);
    return { step: match[1] as FollowUpStep, subject: match[2].replaceAll("''", "'"), body: `${match[3]}\n\n${ps!.line}`, ps: ps!.line };
  });
  return templates;
})();

describe("template parts for the admin's summary rows", () => {
  test("placeholders are named in words, the text around them kept", () => {
    assert.deepEqual(templateParts("Your {service} quote, {first_name}"), [
      { text: "Your " },
      { placeholder: "service" },
      { text: " quote, " },
      { placeholder: "first name" },
    ]);
  });

  test("leading, adjacent and absent placeholders", () => {
    assert.deepEqual(templateParts("{first_name}{phone}!"), [{ placeholder: "first name" }, { placeholder: "phone" }, { text: "!" }]);
    assert.deepEqual(templateParts("Thanks for getting in touch"), [{ text: "Thanks for getting in touch" }]);
    assert.deepEqual(templateParts(""), []);
  });
});

const ESTIMATE_ROWS = [
  { label: "Work", value: "Rear extension" },
  { label: "Estimated from", value: "£58,000" },
];
const ESTIMATE = { rows: ESTIMATE_ROWS, addonKeys: ["extension"] };

describe("seeded templates, every combination of name and service", () => {
  test("all four are read from the migration", () => {
    assert.deepEqual(
      SEEDED.map((template) => template.step),
      ["acknowledgement", "quote_chaser_1", "quote_chaser_2", "review_request"],
    );
  });

  const names = ["Sam Taylor", "sam", null, "", "   ", "Mr Smith", "Dr", "J. Smith", "J", "123", "sam@example.com"];
  const services = ["kitchen-renovations", "extensions", "loft-conversions", null, "", "quote-calculator", "something-new"];

  for (const template of SEEDED) {
    test(template.step, () => {
      for (const name of names) {
        for (const serviceType of services) {
          for (const estimate of [null, ESTIMATE]) {
            const label = `${template.step} / ${JSON.stringify(name)} / ${JSON.stringify(serviceType)}`;
            const email = renderFollowUpEmail({
              ...base,
              ...template,
              name,
              serviceType,
              estimate,
              reviewUrl: "https://g.page/r/x/review",
            });
            const firstName = firstNameFrom(name);
            for (const value of [email.subject, email.text]) {
              assert.doesNotMatch(value, /[{}\u0000]|\bundefined\b|\bnull\b/, label);
              assert.doesNotMatch(value, /,,|,[.!?;:]| [,.!?;:]|[ \t]{2,}|^[ \t]*,/m, label);
              assert.doesNotMatch(value, /\b(?:Hi|Hello|Dear),|\b(?:about|for|with)[.,!?]/, label);
            }
            assert.ok(email.subject.length > 0 && email.subject === email.subject.trim(), label);
            assert.doesNotMatch(email.subject, /[,;:]$/, label);
            if (!firstName) assert.doesNotMatch(email.text, /\bthere's quote|'s quote|Dear there/, label);
            assert.ok(email.text.includes(servicePhrase(serviceType)) || !template.body.includes("{service}"), label);
            assert.match(afterJobCard(email.text), firstName ? new RegExp(`^Hi ${firstName},`) : /^Hi there,/, label);
            assert.equal(email.text.includes("Your estimate"), template.step === "acknowledgement" && estimate !== null, label);
            assert.doesNotMatch(email.html, /\{(first_name|service|phone|review_link|estimate)\}/, label);
            assert.ok(email.text.indexOf("Kyle and Steven, Blue Peak\n\nP.S.") > 0, label);
            assert.ok(email.html.indexOf("Kyle and Steven, Blue Peak") < email.html.indexOf(">P.S. "), label);
          }
        }
      }
    });
  }

  test("the acknowledgement's subject with and without a name", () => {
    const ack = SEEDED.find((template) => template.step === "acknowledgement")!;
    assert.equal(ack.subject, "Thanks for your enquiry, {first_name}");
    assert.equal(renderFollowUpEmail({ ...base, ...ack, name: "sam taylor" }).subject, "Thanks for your enquiry, Sam");
    for (const name of [null, "", "Mr Smith", "J. Smith"]) {
      assert.equal(renderFollowUpEmail({ ...base, ...ack, name }).subject, "Thanks for your enquiry");
    }
  });
});

describe("estimate in the acknowledgement", () => {
  test("after the first paragraph past the greeting when the template doesn't place it", () => {
    const email = renderFollowUpEmail({ ...base, estimate: ESTIMATE });
    assert.match(
      afterJobCard(email.text),
      /^Hi Jo,\n\nThanks for getting in touch about your kitchen renovation\.\n\nYour estimate\nWork: Rear extension\nEstimated from: £58,000\nThese figures are estimates for scoping a conversation, not a fixed quote\.\n\nHere's what happens next:/,
    );
    const content = email.html.slice(email.html.indexOf("<h1"));
    assert.ok(content.indexOf("Thanks for getting in touch") < content.indexOf("Your estimate"));
    assert.ok(content.indexOf("Your estimate") < content.indexOf("Here&#39;s what happens next"));
    assert.match(email.html, /not a fixed quote/);
    const noGreeting = renderFollowUpEmail({ ...base, body: "Thanks for your enquiry.\n\nWe'll call.", estimate: ESTIMATE });
    assert.match(afterJobCard(noGreeting.text), /^Thanks for your enquiry\.\n\nYour estimate\n[\s\S]*\n\nWe'll call\./);
    const greetingOnly = renderFollowUpEmail({ ...base, body: "Hi {first_name},", estimate: ESTIMATE });
    assert.match(afterJobCard(greetingOnly.text), /^Hi Jo,\n\nYour estimate\n/);
  });

  test("the house picture goes in the box when there is one, with alt text naming the add-ons", () => {
    const withHouse = renderFollowUpEmail({ ...base, estimate: ESTIMATE, images: { ...base.images, house: "cid:bp-house" } });
    assert.match(withHouse.html, /<img src="cid:bp-house"[^>]*alt="Your house as you built it in the estimator, with: rear extension"/);
    const withoutHouse = renderFollowUpEmail({ ...base, estimate: ESTIMATE });
    assert.match(withoutHouse.html, /Your estimate/);
    assert.doesNotMatch(withoutHouse.html, /bp-house|as you built it/);
  });

  test("where {estimate} is, and nothing left behind without one", () => {
    const body = "Hi {first_name},\n\nThanks.\n\n{estimate}\n\nCall {phone}.";
    const placed = renderFollowUpEmail({ ...base, body, estimate: ESTIMATE });
    assert.match(placed.text, /Thanks\.\n\nYour estimate\n[\s\S]*not a fixed quote\.\n\nCall 01234 567890\./);
    const without = renderFollowUpEmail({ ...base, body, estimate: null });
    assert.match(without.text, /Thanks\.\n\nCall 01234 567890\./);
    const inline = renderFollowUpEmail({ ...base, body: "Hi.\n\nSee {estimate} below.", estimate: null });
    assert.match(inline.text, /\n\nSee below\.\n/);
  });

  test("only in the acknowledgement", () => {
    for (const step of ["quote_chaser_1", "quote_chaser_2", "review_request"] as const) {
      const email = renderFollowUpEmail({ ...base, step, subject: "Hi", body: "Hi.\n\n{estimate}", estimate: ESTIMATE });
      assert.doesNotMatch(email.text, /Your estimate/);
    }
  });

  test("values are escaped", () => {
    const email = renderFollowUpEmail({ ...base, estimate: { rows: [{ label: "Work", value: "<b>x</b>" }], addonKeys: [] } });
    assert.match(email.html, /&lt;b&gt;x&lt;\/b&gt;/);
  });
});

describe("stop-link secret", () => {
  test("needs at least 32 characters", () => {
    assert.deepEqual(readLinkSecret({}), { status: "unset", secret: null });
    assert.deepEqual(readLinkSecret({ FOLLOW_UP_LINK_SECRET: "  " }), { status: "unset", secret: null });
    assert.deepEqual(readLinkSecret({ FOLLOW_UP_LINK_SECRET: "short" }), { status: "too-short", secret: null });
    const secret = "a".repeat(MIN_LINK_SECRET_LENGTH);
    assert.deepEqual(readLinkSecret({ FOLLOW_UP_LINK_SECRET: ` ${secret} ` }), { status: "set", secret });
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
    assert.match(afterJobCard(email.text), /^Hi Jo,\n\nThanks for getting in touch about your kitchen renovation\./);
    assert.match(email.text, /1\. We read through what you've sent\.\n2\. We visit the property\./);
    assert.match(email.text, /Kyle and Steven, Blue Peak/);
    assert.match(email.text, /Stop them here: https:\/\/example.com\/stop-emails\?t=abc$/);
    assert.doesNotMatch(email.html, /Test email/);
  });

  test("the frame: logo and gable with alt text, tagline and phone in the footer", () => {
    const email = renderFollowUpEmail(base);
    assert.match(email.html, /<img src="cid:bp-logo"[^>]*alt="Blue Peak"/);
    assert.match(email.html, /<img src="cid:bp-gable"[^>]*alt=""/);
    for (const img of email.html.match(/<img\b[^>]*>/g) ?? []) assert.match(img, /\balt="/, img);
    assert.match(email.html, /font-style: italic[^>]*>Everything under one roof\.<\/p>/);
    assert.ok(email.html.indexOf("Everything under one roof.") < email.html.lastIndexOf("tel:+441234567890"));
    assert.match(email.text, /--\nEverything under one roof\.\nBlue Peak\. Call 01234 567890/);
  });

  test("job card: reference, what it's about, the date and the stage, in HTML and text", () => {
    const email = renderFollowUpEmail({ ...base, jobCard: { ...base.jobCard, stage: 3 } });
    assert.match(email.text, /^Your job: BP-0042\nYour kitchen renovation, enquired 5 October 2026\nStage 3 of 5: Quote sent\n\n/);
    assert.match(email.html, />BP-0042</);
    assert.match(email.html, /Stage 3 of 5:<\/strong> Quote sent/);
    assert.equal(email.html.match(/class="bp-track-done"/g)?.length, 2);
    assert.equal(email.html.match(/class="bp-track-current"/g)?.length, 1);
    assert.equal(email.html.match(/class="bp-track-later"/g)?.length, 2);
    const content = email.html.slice(email.html.indexOf("<h1"));
    assert.ok(content.indexOf("BP-0042") < content.indexOf("Thanks for getting in touch"));
  });

  test("a closing P.S. goes after the sign-off; one on its own stays put", () => {
    const email = renderFollowUpEmail({ ...base, body: `${ACK_BODY}\n\nP.S. Every job starts on paper.` });
    assert.match(email.text, /Kyle and Steven, Blue Peak\n\nP\.S\. Every job starts on paper\.\n\n--/);
    assert.ok(email.html.indexOf("Kyle and Steven") < email.html.indexOf("P.S. Every job"));
    const only = renderFollowUpEmail({ ...base, body: "PS hello" });
    assert.ok(only.text.indexOf("PS hello") < only.text.indexOf("Kyle and Steven"));
  });

  test("redirected to the test address: the intended recipient is shown at the top", () => {
    const email = renderFollowUpEmail({ ...base, intendedRecipient: "jo@example.com" });
    assert.match(email.text, /^TEST EMAIL\. In normal use this would have gone to jo@example\.com\./);
    assert.ok(email.html.indexOf("jo@example.com") < email.html.indexOf('alt="Blue Peak"'));
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
