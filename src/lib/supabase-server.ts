import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabasePublishableKey, supabaseUrl } from "./supabase-env.ts";

/**
 * Server-side auth-aware Supabase client for Server Components,
 * Server Actions, and Route Handlers. Uses cookie session storage.
 */
export async function createSupabaseServerClient() {
  const url = supabaseUrl();
  const key = supabasePublishableKey();

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component where cookies cannot be set.
          // The proxy refreshes the session on each request.
        }
      },
    },
  });
}
