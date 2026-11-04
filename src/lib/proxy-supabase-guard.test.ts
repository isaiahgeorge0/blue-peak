import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { missingSupabaseAdminRedirect } from "./proxy-supabase-guard.ts";

describe("missingSupabaseAdminRedirect", () => {
  test("redirects /admin/leads to login when the key is missing", () => {
    assert.deepEqual(missingSupabaseAdminRedirect("/admin/leads"), {
      pathname: "/admin/login",
      next: "/admin/leads",
    });
  });

  test("does not redirect /admin/login", () => {
    assert.equal(missingSupabaseAdminRedirect("/admin/login"), null);
  });

  test("does not redirect non-admin paths", () => {
    assert.equal(missingSupabaseAdminRedirect("/contact"), null);
  });
});
