import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAdminClaims } from "@/lib/admin-role";
import { missingSupabaseAdminRedirect } from "@/lib/proxy-supabase-guard";
import { supabasePublishableKey, supabaseUrl } from "@/lib/supabase-env";

/**
 * Next.js 16 proxy (replaces deprecated middleware).
 * Refreshes the Supabase Auth session and limits /admin/* to admin users.
 */
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = supabaseUrl();
  const key = supabasePublishableKey();
  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginRoute = pathname === "/admin/login";

  if (!url || !key) {
    const missing = [
      !url ? "NEXT_PUBLIC_SUPABASE_URL" : null,
      !key ? "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" : null,
    ].filter(Boolean);
    console.error("proxy: missing Supabase environment variables:", missing.join(", "));
    const redirect = missingSupabaseAdminRedirect(pathname);
    if (redirect) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = redirect.pathname;
      loginUrl.searchParams.set("next", redirect.next);
      return NextResponse.redirect(loginUrl);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([headerKey, value]) => {
          supabaseResponse.headers.set(headerKey, value);
        });
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const isAdmin = isAdminClaims(data?.claims);

  if (isAdminRoute && !isLoginRoute && !isAdmin) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoginRoute && isAdmin) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/admin";
    dashboardUrl.search = "";
    return NextResponse.redirect(dashboardUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/admin/:path*"],
};
