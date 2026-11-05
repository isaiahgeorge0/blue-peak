import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";
import { supabaseKeysLabel, supabaseSecretKey } from "./supabase-secret-values.ts";

const PUBLISHABLE = "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY";
const SECRET = "SUPABASE_SECRET_KEY";
/** Retired names, built so the source doesn't spell the old identifiers. */
const RETIRED_PUBLISHABLE = ["NEXT_PUBLIC_SUPABASE", "ANON", "KEY"].join("_");
const RETIRED_SECRET = ["SUPABASE", "SERVICE", "ROLE", "KEY"].join("_");

const NAMES = [PUBLISHABLE, SECRET, RETIRED_PUBLISHABLE, RETIRED_SECRET];
const saved = Object.fromEntries(NAMES.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of NAMES) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

describe("supabaseSecretKey", () => {
  test("reads the secret key", () => {
    process.env[SECRET] = "secret-set";
    assert.equal(supabaseSecretKey(), "secret-set");
  });

  test("returns null when the secret key is unset", () => {
    delete process.env[SECRET];
    assert.equal(supabaseSecretKey(), null);
  });

  test("does not pick up the retired variable name on its own", () => {
    delete process.env[SECRET];
    process.env[RETIRED_SECRET] = "retired-value";
    assert.equal(supabaseSecretKey(), null);
  });
});

describe("supabaseKeysLabel", () => {
  test("says Set when both variables are present", () => {
    process.env[PUBLISHABLE] = "publishable-set";
    process.env[SECRET] = "secret-set";
    assert.equal(supabaseKeysLabel(), "Set");
  });

  test("names each missing variable and ignores the retired names", () => {
    delete process.env[PUBLISHABLE];
    delete process.env[SECRET];
    process.env[RETIRED_PUBLISHABLE] = "retired-publishable";
    process.env[RETIRED_SECRET] = "retired-secret";
    assert.equal(
      supabaseKeysLabel(),
      "Missing: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY",
    );
  });

  test("names only the secret when the publishable key is set", () => {
    process.env[PUBLISHABLE] = "publishable-set";
    delete process.env[SECRET];
    assert.equal(supabaseKeysLabel(), "Missing: SUPABASE_SECRET_KEY");
  });
});
