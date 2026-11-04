/**
 * Supabase URL and publishable (browser-safe) key.
 * Prefer the new publishable key; fall back to the legacy anon JWT while both
 * are set. Remove the fallback once legacy keys are disabled in Supabase.
 *
 * NEXT_PUBLIC_ values are inlined at build time — reference them by literal
 * name, never via a dynamic lookup.
 */

export function supabaseUrl(): string | null {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || null;
}

/** True when the value looks like a new publishable key (prefix only). */
export function isSupabasePublishableKey(value: string) {
  return value.startsWith("sb_publishable_");
}

export function supabasePublishableKey(): string | null {
  const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (publishable) return publishable;
  // Temporary fallback — remove once legacy anon keys are disabled in Supabase.
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return anon || null;
}

/** Which publishable-side env var resolved, for admin status (never the value). */
export function supabasePublishableKeySource(): "publishable" | "anon" | null {
  if (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()) return "publishable";
  if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()) return "anon";
  return null;
}
