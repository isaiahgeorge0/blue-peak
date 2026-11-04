import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";
import {
  isSupabaseSecretKey,
  supabaseKeysLabel,
  supabaseSecretKey,
  supabaseSecretKeySource,
} from "./supabase-secret-values.ts";

const KEYS = [
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
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

describe("supabaseSecretKey", () => {
  test("prefers the secret key over the legacy service_role key", () => {
    process.env.SUPABASE_SECRET_KEY = "secret-preferred";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-fallback";
    assert.equal(supabaseSecretKey(), "secret-preferred");
    assert.equal(supabaseSecretKeySource(), "secret");
  });

  test("falls back to the service_role key when secret is unset", () => {
    delete process.env.SUPABASE_SECRET_KEY;
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-fallback";
    assert.equal(supabaseSecretKey(), "service-role-fallback");
    assert.equal(supabaseSecretKeySource(), "service_role");
  });

  test("returns null when neither is set", () => {
    delete process.env.SUPABASE_SECRET_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    assert.equal(supabaseSecretKey(), null);
    assert.equal(supabaseSecretKeySource(), null);
  });

  test("prefix helper recognises secret keys only by prefix", () => {
    assert.ok(isSupabaseSecretKey("sb_secret_"));
    assert.ok(!isSupabaseSecretKey("eyJhbGciOi"));
  });
});

describe("supabaseKeysLabel", () => {
  test("says new when both new variables are set", () => {
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable-set";
    process.env.SUPABASE_SECRET_KEY = "secret-set";
    assert.equal(supabaseKeysLabel(), "new (publishable + secret)");
  });

  test("says legacy when only the old variables are set", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    delete process.env.SUPABASE_SECRET_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-set";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-set";
    assert.equal(supabaseKeysLabel(), "legacy (anon + service_role)");
  });
});
