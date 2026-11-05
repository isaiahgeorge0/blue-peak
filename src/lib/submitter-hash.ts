import { createHash } from "node:crypto";

/** Hash a client IP for rate limiting. Salt must not be empty. */
export function hashSubmitter(ip: string, salt: string) {
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

/**
 * SUBMITTER_HASH_SECRET, trimmed. Null when unset: the caller skips rate
 * limiting and still accepts the enquiry.
 */
export function rateLimitSalt(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed || null;
}
