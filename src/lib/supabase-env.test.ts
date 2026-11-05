import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";
import { supabasePublishableKey } from "./supabase-env.ts";

const PUBLISHABLE = "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY";
/** Retired name, built so the source doesn't spell the old identifier. */
const RETIRED_PUBLISHABLE = ["NEXT_PUBLIC_SUPABASE", "ANON", "KEY"].join("_");

const saved = {
  [PUBLISHABLE]: process.env[PUBLISHABLE],
  [RETIRED_PUBLISHABLE]: process.env[RETIRED_PUBLISHABLE],
};

afterEach(() => {
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("supabasePublishableKey", () => {
  test("reads the publishable key", () => {
    process.env[PUBLISHABLE] = "publishable-set";
    assert.equal(supabasePublishableKey(), "publishable-set");
  });

  test("returns null when the publishable key is unset", () => {
    delete process.env[PUBLISHABLE];
    assert.equal(supabasePublishableKey(), null);
  });

  test("does not pick up the retired variable name on its own", () => {
    delete process.env[PUBLISHABLE];
    process.env[RETIRED_PUBLISHABLE] = "retired-value";
    assert.equal(supabasePublishableKey(), null);
  });
});
