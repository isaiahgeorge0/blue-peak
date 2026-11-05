import "server-only";

/**
 * Server-only entry for the Supabase secret key.
 * Never import this file into a Client Component.
 */
export { supabaseKeysLabel, supabaseSecretKey } from "./supabase-secret-values.ts";
