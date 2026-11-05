import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { hashSubmitter, rateLimitSalt } from "./submitter-hash.ts";

describe("rateLimitSalt", () => {
  test("uses SUBMITTER_HASH_SECRET when set", () => {
    assert.equal(rateLimitSalt(" dedicated-salt "), "dedicated-salt");
  });

  test("a missing SUBMITTER_HASH_SECRET skips rate limiting without failing", () => {
    assert.equal(rateLimitSalt(undefined), null);
    assert.equal(rateLimitSalt(""), null);
    assert.equal(rateLimitSalt("   "), null);
  });
});

describe("hashSubmitter", () => {
  test("is stable for the same salt and changes when the salt changes", () => {
    const a = hashSubmitter("1.2.3.4", "salt-a");
    const b = hashSubmitter("1.2.3.4", "salt-a");
    const c = hashSubmitter("1.2.3.4", "salt-b");
    assert.equal(a, b);
    assert.notEqual(a, c);
    assert.match(a, /^[a-f0-9]{64}$/);
  });
});
