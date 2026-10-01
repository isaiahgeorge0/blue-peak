"use server";

import { redirect } from "next/navigation";
import { isAdminClaims } from "@/lib/admin-role";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export type LoginState = {
  error: string | null;
};

export async function loginAdmin(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nextPath = String(formData.get("next") ?? "/admin");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("admin login failed", error.message);
    return { error: "Invalid email or password." };
  }

  if (!isAdminClaims({ app_metadata: data.user?.app_metadata })) {
    await supabase.auth.signOut();
    return { error: "This account does not have admin access." };
  }

  redirect(nextPath.startsWith("/admin") ? nextPath : "/admin");
}

export async function logoutAdmin() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
