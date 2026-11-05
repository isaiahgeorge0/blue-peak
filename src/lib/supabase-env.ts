/**
 * Supabase URL and publishable (browser-safe) key.
 *
 * NEXT_PUBLIC_ values are inlined at build time — reference them by literal
 * name, never via a dynamic lookup.
 */

export function supabaseUrl(): string | null {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || null;
}

export function supabasePublishableKey(): string | null {
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || null;
}
