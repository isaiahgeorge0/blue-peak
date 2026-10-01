/**
 * Admin access is granted by `app_metadata.role = "admin"` on the Supabase
 * user. app_metadata can only be written with the service role, so a user
 * cannot promote themselves. Mirrors the RLS policies on leads, lead_notes,
 * and calendar_events.
 */
export const ADMIN_ROLE = "admin";

export function isAdminClaims(claims: unknown): boolean {
  if (!claims || typeof claims !== "object") return false;
  const appMetadata = (claims as { app_metadata?: unknown }).app_metadata;
  if (!appMetadata || typeof appMetadata !== "object") return false;
  return (appMetadata as { role?: unknown }).role === ADMIN_ROLE;
}
