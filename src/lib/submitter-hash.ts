import { createHash } from "node:crypto";

/** Hash a client IP for rate limiting. Salt must not be empty. */
export function hashSubmitter(ip: string, salt: string) {
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

/**
 * Prefer SUBMITTER_HASH_SECRET so rotating the Supabase secret does not reset
 * rate limits. Callers that fall back to the Supabase secret should log a
 * warning (never the value).
 */
export function resolveSubmitterHashSalt(env: {
  SUBMITTER_HASH_SECRET?: string;
  secretKeyFallback?: string | null;
}): { salt: string | null; usedSecretFallback: boolean } {
  const dedicated = env.SUBMITTER_HASH_SECRET?.trim();
  if (dedicated) return { salt: dedicated, usedSecretFallback: false };
  const fallback = env.secretKeyFallback?.trim();
  if (fallback) return { salt: fallback, usedSecretFallback: true };
  return { salt: null, usedSecretFallback: false };
}
