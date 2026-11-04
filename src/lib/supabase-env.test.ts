import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";
import {
  isSupabasePublishableKey,
  supabasePublishableKey,
  supabasePublishableKeySource,
} from "./supabase-env.ts";

const KEYS = [
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

const saved = Object.fromEntries(KEYS.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

describe("supabasePublishableKey", () => {
  test("prefers the publishable key over the legacy anon key", () => {
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable-preferred";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-fallback";
    assert.equal(supabasePublishableKey(), "publishable-preferred");
    assert.equal(supabasePublishableKeySource(), "publishable");
  });

  test("falls back to the anon key when publishable is unset", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-fallback";
    assert.equal(supabasePublishableKey(), "anon-fallback");
    assert.equal(supabasePublishableKeySource(), "anon");
  });

  test("returns null when neither is set", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    assert.equal(supabasePublishableKey(), null);
    assert.equal(supabasePublishableKeySource(), null);
  });

  test("prefix helper recognises publishable keys only by prefix", () => {
    assert.ok(isSupabasePublishableKey("sb_publishable_"));
    assert.ok(!isSupabasePublishableKey("eyJhbGciOi"));
  });
});
