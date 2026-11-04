import { isSupabasePublishableKey, supabasePublishableKey } from "./supabase-env.ts";

/**
 * Pure readers for the Supabase secret key and admin status label.
 * Prefer SUPABASE_SECRET_KEY; fall back to the legacy service_role JWT while
 * both are set. Remove the fallback once legacy keys are disabled in Supabase.
 *
 * Import via supabase-secret.ts (server-only) from app code so this never
 * reaches a Client Component bundle.
 */

/** True when the value looks like a new secret key (prefix only). */
export function isSupabaseSecretKey(value: string) {
  return value.startsWith("sb_secret_");
}

export function supabaseSecretKey(): string | null {
  const secret = process.env.SUPABASE_SECRET_KEY?.trim();
  if (secret) return secret;
  // Temporary fallback — remove once legacy service_role keys are disabled in Supabase.
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return serviceRole || null;
}

/** Which secret-side env var resolved, for admin status (never the value). */
export function supabaseSecretKeySource(): "secret" | "service_role" | null {
  if (process.env.SUPABASE_SECRET_KEY?.trim()) return "secret";
  if (process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) return "service_role";
  return null;
}

/**
 * Read-only label for the admin Follow-ups setup panel.
 * Derived from which variables resolved (or key prefixes), never from values.
 */
export function supabaseKeysLabel(): string {
  if (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() && process.env.SUPABASE_SECRET_KEY?.trim()) {
    return "new (publishable + secret)";
  }
  const publishable = supabasePublishableKey();
  const secret = supabaseSecretKey();
  if (publishable && isSupabasePublishableKey(publishable) && secret && isSupabaseSecretKey(secret)) {
    return "new (publishable + secret)";
  }
  return "legacy (anon + service_role)";
}
