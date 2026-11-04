/**
 * When the Supabase URL or publishable key is missing, admin routes (other
 * than login) must not fall through — redirect to /admin/login instead.
 */
export function missingSupabaseAdminRedirect(
  pathname: string,
): { pathname: "/admin/login"; next: string } | null {
  if (!pathname.startsWith("/admin") || pathname === "/admin/login") return null;
  return { pathname: "/admin/login", next: pathname };
}
