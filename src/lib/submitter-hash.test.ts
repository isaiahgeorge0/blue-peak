import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { hashSubmitter, resolveSubmitterHashSalt } from "./submitter-hash.ts";

describe("resolveSubmitterHashSalt", () => {
  test("uses SUBMITTER_HASH_SECRET when set", () => {
    assert.deepEqual(
      resolveSubmitterHashSalt({
        SUBMITTER_HASH_SECRET: " dedicated-salt ",
        secretKeyFallback: "secret-should-not-win",
      }),
      { salt: "dedicated-salt", usedSecretFallback: false },
    );
  });

  test("falls back to the Supabase secret when SUBMITTER_HASH_SECRET is unset", () => {
    assert.deepEqual(
      resolveSubmitterHashSalt({
        SUBMITTER_HASH_SECRET: "  ",
        secretKeyFallback: "secret-fallback",
      }),
      { salt: "secret-fallback", usedSecretFallback: true },
    );
  });

  test("returns null when neither salt is available", () => {
    assert.deepEqual(resolveSubmitterHashSalt({}), { salt: null, usedSecretFallback: false });
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
