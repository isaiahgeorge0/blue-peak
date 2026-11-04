import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./supabase-env.ts";
import { supabaseSecretKey } from "./supabase-secret.ts";

/**
 * Server-only Supabase admin client (secret key).
 * WARNING: Never import this file into a Client Component.
 * The secret key bypasses RLS and must stay on the server.
 */

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (adminClient) {
    return adminClient;
  }

  const url = supabaseUrl();
  const key = supabaseSecretKey();

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY",
    );
  }

  adminClient = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return adminClient;
}
