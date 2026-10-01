import "server-only";
import { redirect } from "next/navigation";
import { isAdminClaims } from "@/lib/admin-role";
import { createSupabaseServerClient } from "@/lib/supabase-server";

/**
 * For admin Server Components. Redirects to the login page unless the
 * session belongs to an admin, so service-role reads after this call are
 * never reachable on session existence alone.
 */
export async function requireAdminPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims || !isAdminClaims(data.claims)) {
    redirect("/admin/login");
  }

  return { claims: data.claims };
}

/**
 * For admin Server Actions. Returns the session-scoped client (still subject
 * to the admin RLS policies) or null when the caller is not an admin.
 */
export async function getAdminActionClient() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims || !isAdminClaims(data.claims)) {
    return null;
  }

  return supabase;
}
