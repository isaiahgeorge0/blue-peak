import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminLoginForm } from "@/components/admin-login-form";
import { BrandMark, BrandWordmark } from "@/components/brand/brand-logo";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to the Blue Peak Solutions admin.",
};

export default function AdminLoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <BrandMark title="" className="size-14 text-frost" />
          <BrandWordmark className="mt-5 h-5 w-auto text-frost" />
          <p className="admin-label mt-3">Admin</p>
        </div>
        <div className="mt-8 rounded-2xl border border-admin-line bg-admin-surface px-6 py-7 sm:px-8">
          <h1 className="font-serif text-[2rem] leading-tight tracking-heading text-ink">Sign in</h1>
          <p className="mt-1.5 text-sm text-ink/80">Use your Blue Peak admin account.</p>
          <div className="mt-6">
            <Suspense fallback={<p className="text-sm text-ink/80">Loading…</p>}>
              <AdminLoginForm />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  );
}
