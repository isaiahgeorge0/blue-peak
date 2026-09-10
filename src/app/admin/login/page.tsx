import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminLoginForm } from "@/components/admin-login-form";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Admin login",
    description: "Sign in to the Blue Peak Solutions admin dashboard.",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function AdminLoginPage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-serif text-3xl tracking-tight text-off-white">
        Admin login
      </h1>
      <p className="mt-3 text-sm text-off-white/70">
        Sign in with your Blue Peak admin account.
      </p>
      <div className="mt-8 rounded-lg border border-off-white/10 bg-black px-6 py-8">
        <Suspense fallback={<p className="text-sm text-off-white/60">Loading...</p>}>
          <AdminLoginForm />
        </Suspense>
      </div>
    </div>
  );
}
