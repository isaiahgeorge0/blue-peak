/**
 * Pure readers for the Supabase secret key and admin status label.
 *
 * Import via supabase-secret.ts (server-only) from app code so this never
 * reaches a Client Component bundle.
 */

export function supabaseSecretKey(): string | null {
  return process.env.SUPABASE_SECRET_KEY?.trim() || null;
}

/**
 * Read-only label for the admin Follow-ups setup panel.
 * Names which variables are missing; never includes a value.
 */
export function supabaseKeysLabel(): string {
  const missing = [
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ? null : "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    process.env.SUPABASE_SECRET_KEY?.trim() ? null : "SUPABASE_SECRET_KEY",
  ].filter((name): name is string => Boolean(name));
  return missing.length === 0 ? "Set" : `Missing: ${missing.join(", ")}`;
}
