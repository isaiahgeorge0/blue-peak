import type { Metadata, Viewport } from "next";
import { AdminShell, type AdminUser } from "@/components/admin-shell";
import { isAdminClaims } from "@/lib/admin-role";
import { firstNameFromClaims } from "@/lib/admin-leads";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#09162a",
  colorScheme: "dark",
};

async function signedInUser(): Promise<AdminUser | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims || !isAdminClaims(claims)) return null;
  return {
    firstName: firstNameFromClaims(claims),
    email: typeof claims.email === "string" ? claims.email : "",
  };
}

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await signedInUser();
  return <AdminShell user={user}>{children}</AdminShell>;
}
