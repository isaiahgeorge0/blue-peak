import "server-only";

/**
 * Server-only entry for the Supabase secret key.
 * Never import this file into a Client Component.
 */
export {
  isSupabaseSecretKey,
  supabaseKeysLabel,
  supabaseSecretKey,
  supabaseSecretKeySource,
} from "./supabase-secret-values.ts";
