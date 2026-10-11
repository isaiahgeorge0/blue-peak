import assert from "node:assert/strict";
import { test } from "node:test";
import { looksLikeEmail } from "./email-format.ts";

test("everyday and unusual but valid addresses pass", () => {
  for (const value of [
    "jo@example.com",
    "Jo.Bloggs@Example.CO.UK",
    "jo+builders@gmail.com",
    "o'brien@example.ie",
    "jo@mail.example.photography",
    "siân@enghraifft.cymru",
    "a@b.io",
    " jo@example.com ",
    "1234@example.com",
    "jo_bloggs-2@sub-domain.example.com",
  ]) {
    assert.ok(looksLikeEmail(value), value);
  }
});

test("obvious typos are caught", () => {
  for (const value of [
    "",
    "jo",
    "jo.example.com",
    "jo@",
    "jo@example",
    "@example.com",
    "jo@.com",
    "jo@example.",
    "jo@@example.com",
    "jo @example.com",
    "jo@exa mple.com",
    "jo@example..com",
    "jo@gmail,com",
  ]) {
    assert.ok(!looksLikeEmail(value), value);
  }
});
